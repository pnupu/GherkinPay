"use client";

import type { Program } from "@coral-xyz/anchor";
import { EventParser } from "@coral-xyz/anchor";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import type { GherkinPay } from "~/types/gherkin_pay";
import { useAnchorProgram } from "~/lib/anchor";
import { PROGRAM_ID } from "~/lib/constants";

export interface ActivityEvent {
  signature: string;
  slot: number;
  blockTime: number | null;
  name: string;
  data: Record<string, unknown>;
}

/**
 * Fetches recent gherkin_pay program transactions from devnet, parses their
 * log messages using Anchor's EventParser, and returns typed event objects.
 *
 * Returns standard React Query state: data, isLoading, isError, error.
 */
export function useActivityFeed() {
  const { connection } = useConnection();
  const { program: rawProgram } = useAnchorProgram();

  const program = rawProgram as Program<GherkinPay> | null;

  return useQuery({
    queryKey: ["activity"],
    queryFn: async (): Promise<ActivityEvent[]> => {
      const sigInfos = await connection.getSignaturesForAddress(PROGRAM_ID, {
        limit: 50,
      });

      if (sigInfos.length === 0) return [];

      const signatures = sigInfos.map((s) => s.signature);
      const txs = await connection.getParsedTransactions(signatures, {
        maxSupportedTransactionVersion: 0,
      });

      const eventParser = new EventParser(PROGRAM_ID, program!.coder);
      const events: ActivityEvent[] = [];

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
            data: event.data as Record<string, unknown>,
          });
        }
      }

      return events;
    },
    enabled: !!program,
  });
}
