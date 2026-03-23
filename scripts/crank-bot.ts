#!/usr/bin/env node
/**
 * GherkinPay Crank Bot
 *
 * Polls all on-chain ConditionAccounts and automatically cranks conditions
 * when they become satisfiable (time-based, oracle, token-gate).
 *
 * Usage:
 *   bun run scripts/crank-bot.ts [options]
 *
 * Options:
 *   --rpc <url>       Solana RPC URL (default: https://api.devnet.solana.com)
 *   --keypair <path>  Path to keypair JSON (default: ~/.config/solana/id.json)
 *   --interval <sec>  Poll interval in seconds (default: 30)
 *   --dry-run         Log actions without sending transactions
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";
import {
  Connection,
  Keypair,
  PublicKey,
  type TransactionSignature,
} from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

import idl from "../app/web/src/idl/gherkin_pay.json";

// ─── CLI Argument Parsing ──────────────────────────────────────────────────

interface CliArgs {
  rpc: string;
  keypairPath: string;
  interval: number;
  dryRun: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const opts: CliArgs = {
    rpc: "https://api.devnet.solana.com",
    keypairPath: resolve(homedir(), ".config/solana/id.json"),
    interval: 30,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--rpc":
        opts.rpc = args[++i]!;
        break;
      case "--keypair":
        opts.keypairPath = resolve(args[++i]!);
        break;
      case "--interval":
        opts.interval = parseInt(args[++i]!, 10);
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      default:
        log("WARN", `Unknown argument: ${args[i]}`);
    }
  }

  return opts;
}

// ─── Logging ───────────────────────────────────────────────────────────────

function log(
  level: "INFO" | "WARN" | "ERROR",
  message: string,
  fields?: Record<string, unknown>,
) {
  const ts = new Date().toISOString();
  const extra = fields
    ? " " + Object.entries(fields)
        .map(([k, v]) => `${k}=${String(v)}`)
        .join(" ")
    : "";
  console.log(`[${ts}] [${level}] ${message}${extra}`);
}

// ─── Keypair Loading ───────────────────────────────────────────────────────

function loadKeypair(path: string): Keypair {
  const raw = readFileSync(path, "utf-8");
  const secret = Uint8Array.from(JSON.parse(raw) as number[]);
  return Keypair.fromSecretKey(secret);
}

// ─── BN / BigInt Helpers ───────────────────────────────────────────────────

function toNumber(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val === "bigint") return Number(val);
  if (val && typeof (val as { toNumber: () => number }).toNumber === "function")
    return (val as { toNumber: () => number }).toNumber();
  return Number(String(val ?? "0"));
}

// ─── Anchor Enum Helper ───────────────────────────────────────────────────

function enumKey(obj: Record<string, unknown>): string {
  return Object.keys(obj)[0] ?? "unknown";
}

// ─── Condition Evaluation ──────────────────────────────────────────────────

interface TimeBasedFields {
  unlockAt: unknown; // BN or number
  met: boolean;
}

function isTimeBased(
  condition: Record<string, unknown>,
): condition is { timeBased: TimeBasedFields } {
  return "timeBased" in condition;
}

// ─── Oracle Condition ─────────────────────────────────────────────────────

interface OracleFields {
  feedAccount: PublicKey;
  operator: Record<string, unknown>; // { gt: {} } | { gte: {} } | ...
  targetValue: unknown; // BN or number (i64)
  decimals: number;
  met: boolean;
}

function isOracle(
  condition: Record<string, unknown>,
): condition is { oracle: OracleFields } {
  return "oracle" in condition;
}

const MAX_PRICE_AGE_SECS = 60;

/**
 * Parse Pyth PriceUpdateV2 account data.
 * Layout: 8B disc + 32B write_authority + 1B verification_level + PriceFeedMessage
 *   PriceFeedMessage: 32B feed_id, i64 price @73, u64 conf @81, i32 exponent @89, i64 publish_time @93
 */
function parsePythPrice(data: Buffer): { price: bigint; publishTime: bigint } | null {
  if (data.length < 101) return null;
  const price = data.readBigInt64LE(73);
  const publishTime = data.readBigInt64LE(93);
  return { price, publishTime };
}

/** Evaluate a ComparisonOperator enum variant against two values. */
function evaluateOperator(
  operator: Record<string, unknown>,
  actual: bigint,
  target: bigint,
): boolean {
  const op = enumKey(operator);
  switch (op) {
    case "gt":
      return actual > target;
    case "gte":
      return actual >= target;
    case "lt":
      return actual < target;
    case "lte":
      return actual <= target;
    case "eq":
      return actual === target;
    default:
      return false;
  }
}

/** Convert BN / number / bigint to bigint for precise i64/u64 comparison. */
function toBigInt(val: unknown): bigint {
  if (typeof val === "bigint") return val;
  if (typeof val === "number") return BigInt(val);
  if (val && typeof (val as { toString: () => string }).toString === "function") {
    return BigInt((val as { toString: () => string }).toString());
  }
  return BigInt(0);
}

// ─── Token-Gate Condition ─────────────────────────────────────────────────

interface TokenGatedFields {
  requiredMint: PublicKey;
  minAmount: unknown; // BN or number (u64)
  holder: PublicKey;
  met: boolean;
}

function isTokenGated(
  condition: Record<string, unknown>,
): condition is { tokenGated: TokenGatedFields } {
  return "tokenGated" in condition;
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();

  log("INFO", "GherkinPay Crank Bot starting", {
    rpc: opts.rpc,
    keypair: opts.keypairPath,
    interval: `${opts.interval}s`,
    dryRun: opts.dryRun,
  });

  // Load keypair
  const keypair = loadKeypair(opts.keypairPath);
  log("INFO", "Loaded keypair", { pubkey: keypair.publicKey.toBase58() });

  // Build Anchor provider and program
  const connection = new Connection(opts.rpc, "confirmed");
  const wallet = new Wallet(keypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  // Anchor 0.32: new Program(idl, provider) — address comes from idl.address
  const program = new Program(idl as never, provider);

  log("INFO", "Program loaded", {
    programId: (idl as { address: string }).address,
  });

  let cycleCount = 0;

  async function pollCycle() {
    cycleCount++;
    const cycleStart = Date.now();
    log("INFO", `Poll cycle #${cycleCount} starting`);

    let conditionAccounts: Array<{
      publicKey: { toBase58(): string };
      account: Record<string, unknown>;
    }>;

    try {
      conditionAccounts = await (program.account as never as {
        conditionAccount: {
          all(): Promise<
            Array<{
              publicKey: { toBase58(): string };
              account: Record<string, unknown>;
            }>
          >;
        };
      }).conditionAccount.all();
    } catch (err) {
      log("ERROR", "Failed to fetch ConditionAccounts", {
        error: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    log("INFO", `Fetched ${conditionAccounts.length} ConditionAccount(s)`);

    let cranked = 0;
    let skipped = 0;
    let errors = 0;

    for (const acc of conditionAccounts) {
      const pubkey = acc.publicKey.toBase58();
      const data = acc.account;
      const paymentPubkey = (
        data.payment as { toBase58(): string }
      ).toBase58();
      const conditions = data.conditions as Record<string, unknown>[];
      const milestoneStatus = enumKey(
        data.milestoneStatus as Record<string, unknown>,
      );

      // Only crank accounts in active milestone status
      if (milestoneStatus !== "active") {
        skipped += conditions.length;
        continue;
      }

      for (let idx = 0; idx < conditions.length; idx++) {
        const condition = conditions[idx]!;

        // ── TimeBased ──────────────────────────────────────────────
        if (isTimeBased(condition)) {
          const fields = condition.timeBased;
          if (fields.met) {
            skipped++;
            continue;
          }

          const unlockAt = toNumber(fields.unlockAt);
          const now = Math.floor(Date.now() / 1000);

          if (unlockAt > now) {
            skipped++;
            log("INFO", "TimeBased condition not yet due", {
              conditionAccount: pubkey,
              index: idx,
              unlockAt,
              now,
              secondsRemaining: unlockAt - now,
            });
            continue;
          }

          // Crankable!
          if (opts.dryRun) {
            log("INFO", "[DRY-RUN] Would crank TimeBased condition", {
              payment: paymentPubkey,
              conditionAccount: pubkey,
              index: idx,
              unlockAt,
            });
            cranked++;
            continue;
          }

          try {
            const sig: TransactionSignature = await (
              program.methods as never as {
                crankTime(
                  idx: number,
                ): {
                  accounts(accs: {
                    payment: unknown;
                    conditionAccount: unknown;
                  }): { rpc(): Promise<TransactionSignature> };
                };
              }
            )
              .crankTime(idx)
              .accounts({
                payment: data.payment,
                conditionAccount: acc.publicKey,
              })
              .rpc();

            log("INFO", "Cranked TimeBased condition", {
              payment: paymentPubkey,
              conditionAccount: pubkey,
              index: idx,
              tx: sig,
            });
            cranked++;
          } catch (err) {
            errors++;
            log("ERROR", "Failed to crank TimeBased condition", {
              payment: paymentPubkey,
              conditionAccount: pubkey,
              index: idx,
              error: err instanceof Error ? err.message : String(err),
            });
          }
          continue;
        }

        // ── Oracle ────────────────────────────────────────────────────
        if (isOracle(condition)) {
          const fields = condition.oracle;
          if (fields.met) {
            skipped++;
            continue;
          }

          const feedPubkey = new PublicKey(fields.feedAccount);
          const targetValue = toBigInt(fields.targetValue);
          const opLabel = enumKey(fields.operator);

          try {
            const feedInfo = await connection.getAccountInfo(feedPubkey);
            if (!feedInfo || !feedInfo.data) {
              log("WARN", "Oracle price feed account not found, skipping", {
                conditionAccount: pubkey,
                index: idx,
                priceFeed: feedPubkey.toBase58(),
              });
              skipped++;
              continue;
            }

            const priceData = parsePythPrice(feedInfo.data as Buffer);
            if (!priceData) {
              log("WARN", "Cannot parse Pyth price data, skipping", {
                conditionAccount: pubkey,
                index: idx,
                priceFeed: feedPubkey.toBase58(),
              });
              skipped++;
              continue;
            }

            // Stale price check
            const nowUnix = BigInt(Math.floor(Date.now() / 1000));
            if (nowUnix - priceData.publishTime > BigInt(MAX_PRICE_AGE_SECS)) {
              log("WARN", "Oracle price feed is stale, skipping", {
                conditionAccount: pubkey,
                index: idx,
                priceFeed: feedPubkey.toBase58(),
                publishTime: priceData.publishTime.toString(),
                ageSeconds: (nowUnix - priceData.publishTime).toString(),
              });
              skipped++;
              continue;
            }

            const satisfied = evaluateOperator(fields.operator, priceData.price, targetValue);
            if (!satisfied) {
              skipped++;
              log("INFO", "Oracle condition not yet satisfied", {
                conditionAccount: pubkey,
                index: idx,
                price: priceData.price.toString(),
                operator: opLabel,
                targetValue: targetValue.toString(),
              });
              continue;
            }

            // Crankable!
            if (opts.dryRun) {
              log("INFO", "[DRY-RUN] Would crank Oracle condition", {
                payment: paymentPubkey,
                conditionAccount: pubkey,
                index: idx,
                priceFeed: feedPubkey.toBase58(),
                price: priceData.price.toString(),
                operator: opLabel,
                targetValue: targetValue.toString(),
              });
              cranked++;
              continue;
            }

            const sig: TransactionSignature = await (
              program.methods as never as {
                crankOracle(
                  idx: number,
                ): {
                  accounts(accs: {
                    payment: unknown;
                    conditionAccount: unknown;
                    priceFeed: unknown;
                  }): { rpc(): Promise<TransactionSignature> };
                };
              }
            )
              .crankOracle(idx)
              .accounts({
                payment: data.payment,
                conditionAccount: acc.publicKey,
                priceFeed: feedPubkey,
              })
              .rpc();

            log("INFO", "Cranked Oracle condition", {
              payment: paymentPubkey,
              conditionAccount: pubkey,
              index: idx,
              priceFeed: feedPubkey.toBase58(),
              tx: sig,
            });
            cranked++;
          } catch (err) {
            errors++;
            log("ERROR", "Failed to crank Oracle condition", {
              payment: paymentPubkey,
              conditionAccount: pubkey,
              index: idx,
              error: err instanceof Error ? err.message : String(err),
            });
          }
          continue;
        }

        // ── TokenGated ────────────────────────────────────────────────
        if (isTokenGated(condition)) {
          const fields = condition.tokenGated;
          if (fields.met) {
            skipped++;
            continue;
          }

          const mintPubkey = new PublicKey(fields.requiredMint);
          const holderPubkey = new PublicKey(fields.holder);
          const minAmount = toBigInt(fields.minAmount);

          try {
            const ata = getAssociatedTokenAddressSync(mintPubkey, holderPubkey);

            let balance: bigint;
            try {
              const resp = await connection.getTokenAccountBalance(ata);
              balance = BigInt(resp.value.amount);
            } catch {
              log("WARN", "Holder ATA does not exist or is inaccessible, skipping", {
                conditionAccount: pubkey,
                index: idx,
                holder: holderPubkey.toBase58(),
                mint: mintPubkey.toBase58(),
                ata: ata.toBase58(),
              });
              skipped++;
              continue;
            }

            if (balance < minAmount) {
              skipped++;
              log("INFO", "TokenGated condition not yet satisfied", {
                conditionAccount: pubkey,
                index: idx,
                balance: balance.toString(),
                minAmount: minAmount.toString(),
              });
              continue;
            }

            // Crankable!
            if (opts.dryRun) {
              log("INFO", "[DRY-RUN] Would crank TokenGated condition", {
                payment: paymentPubkey,
                conditionAccount: pubkey,
                index: idx,
                holder: holderPubkey.toBase58(),
                mint: mintPubkey.toBase58(),
                holderTokenAccount: ata.toBase58(),
                balance: balance.toString(),
                minAmount: minAmount.toString(),
              });
              cranked++;
              continue;
            }

            const sig: TransactionSignature = await (
              program.methods as never as {
                crankTokenGate(
                  idx: number,
                ): {
                  accounts(accs: {
                    payment: unknown;
                    conditionAccount: unknown;
                    holderTokenAccount: unknown;
                  }): { rpc(): Promise<TransactionSignature> };
                };
              }
            )
              .crankTokenGate(idx)
              .accounts({
                payment: data.payment,
                conditionAccount: acc.publicKey,
                holderTokenAccount: ata,
              })
              .rpc();

            log("INFO", "Cranked TokenGated condition", {
              payment: paymentPubkey,
              conditionAccount: pubkey,
              index: idx,
              holderTokenAccount: ata.toBase58(),
              tx: sig,
            });
            cranked++;
          } catch (err) {
            errors++;
            log("ERROR", "Failed to crank TokenGated condition", {
              payment: paymentPubkey,
              conditionAccount: pubkey,
              index: idx,
              error: err instanceof Error ? err.message : String(err),
            });
          }
          continue;
        }

        // Unknown / unhandled condition type
        skipped++;
      }
    }

    const elapsed = Date.now() - cycleStart;
    log("INFO", `Poll cycle #${cycleCount} complete`, {
      cranked,
      skipped,
      errors,
      durationMs: elapsed,
    });
  }

  // Run first cycle immediately, then loop
  await pollCycle();

  const intervalMs = opts.interval * 1000;
  log("INFO", `Scheduling next poll in ${opts.interval}s`);

  // Use a while-loop with sleep for clean async control flow
  while (true) {
    await new Promise((r) => setTimeout(r, intervalMs));
    await pollCycle();
  }
}

main().catch((err) => {
  log("ERROR", "Fatal error", {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
