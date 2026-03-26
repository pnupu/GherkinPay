/**
 * Server-side cached Solana event feed.
 *
 * Fetches recent program transactions from devnet, parses Anchor events,
 * and caches the result in memory with a 30-second TTL. All clients
 * (Activity page, Audit Log page) share the same cache — collapsing
 * ~100 client-side RPC calls per page load into one server-side fetch.
 */
import { z } from "zod";
import { Connection, PublicKey } from "@solana/web3.js";
import { BorshCoder, EventParser } from "@coral-xyz/anchor";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import idl from "~/idl/gherkin_pay.json";

/* ── Constants ─────────────────────────────────────────────────────── */

const PROGRAM_ID = new PublicKey(
  "2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV"
);

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

const CACHE_TTL_MS = 30_000; // 30 seconds
const FETCH_LIMIT = 50;

/* ── Types ─────────────────────────────────────────────────────────── */

interface CachedEvent {
  signature: string;
  slot: number;
  blockTime: number | null;
  name: string;
  data: Record<string, unknown>;
}

interface CacheEntry {
  events: CachedEvent[];
  fetchedAt: number;
}

/* ── In-memory cache ───────────────────────────────────────────────── */

let cache: CacheEntry | null = null;
let fetchPromise: Promise<CachedEvent[]> | null = null;

/**
 * Serialize BN / PublicKey values in event data to strings so they
 * survive JSON serialization through tRPC/superjson.
 */
function serializeEventData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === "object" && "toNumber" in value) {
      // BN — try toNumber, fall back to toString for large values
      try {
        result[key] = (value as { toNumber: () => number }).toNumber();
      } catch {
        result[key] = (value as { toString: () => string }).toString();
      }
    } else if (value && typeof value === "object" && "toBase58" in value) {
      // PublicKey
      result[key] = (value as { toBase58: () => string }).toBase58();
    } else {
      result[key] = value;
    }
  }
  return result;
}

async function fetchEvents(): Promise<CachedEvent[]> {
  console.log("[GherkinPay] Fetching events from:", RPC_URL);
  
  // Wrap fetch to disable Next.js caching — Solana RPC uses POST which
  // Next.js patched-fetch may cache or reject
  const nativeFetch: typeof fetch = (input, init) =>
    globalThis.fetch(input, { ...init, cache: "no-store" });

  const connection = new Connection(RPC_URL, {
    commitment: "confirmed",
    fetch: nativeFetch,
    disableRetryOnRateLimit: false,
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  const coder = new BorshCoder(idl as any);

  try {
    const sigInfos = await connection.getSignaturesForAddress(PROGRAM_ID, {
      limit: FETCH_LIMIT,
    });

    console.log("[GherkinPay] Got", sigInfos.length, "signatures");

    if (sigInfos.length === 0) return [];

    const signatures = sigInfos.map((s) => s.signature);
    const txs = await connection.getParsedTransactions(signatures, {
      maxSupportedTransactionVersion: 0,
    });

    const eventParser = new EventParser(PROGRAM_ID, coder);
    const events: CachedEvent[] = [];

    for (let i = 0; i < txs.length; i++) {
      const tx = txs[i];
      const sigInfo = sigInfos[i];
      if (!tx || !sigInfo || !tx.meta?.logMessages) continue;

      const parsed = eventParser.parseLogs(tx.meta.logMessages);
      for (const event of parsed) {
        events.push({
          signature: sigInfo.signature,
          slot: tx.slot,
          blockTime: tx.blockTime ?? null,
          name: event.name,
          data: serializeEventData(
            event.data as Record<string, unknown>
          ),
        });
      }
    }

    console.log(
      `[GherkinPay] Server event cache refreshed: ${events.length} events from ${sigInfos.length} transactions`
    );

    return events;
  } catch (err) {
    console.error(
      "[GherkinPay] fetchEvents error:",
      err instanceof Error ? `${err.name}: ${err.message}` : err
    );
    throw err;
  }
}

/**
 * Get events from cache, or fetch if stale. Coalesces concurrent
 * requests so only one RPC fetch is in-flight at a time.
 */
async function getCachedEvents(): Promise<CachedEvent[]> {
  const now = Date.now();

  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.events;
  }

  // Coalesce concurrent requests
  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = fetchEvents()
    .then((events) => {
      cache = { events, fetchedAt: Date.now() };
      fetchPromise = null;
      return events;
    })
    .catch((err) => {
      fetchPromise = null;
      // Return stale cache on error rather than failing
      if (cache) {
        console.error(
          "[GherkinPay] Event fetch failed, serving stale cache:",
          err instanceof Error ? err.message : err
        );
        return cache.events;
      }
      console.error("[GherkinPay] Event fetch failed (no cache):", err instanceof Error ? err.message : err);
      throw err;
    });

  return fetchPromise;
}

/* ── tRPC Router ───────────────────────────────────────────────────── */

export const eventsRouter = createTRPCRouter({
  /**
   * Get all recent program events (cached server-side).
   * Optional filter param to restrict to specific event names.
   */
  list: publicProcedure
    .input(
      z
        .object({
          filter: z.array(z.string()).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const events = await getCachedEvents();

      if (input?.filter && input.filter.length > 0) {
        const filterSet = new Set(input.filter);
        return events.filter((e) => filterSet.has(e.name));
      }

      return events;
    }),
});
