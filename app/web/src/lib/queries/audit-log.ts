"use client";

import type { Program } from "@coral-xyz/anchor";
import { EventParser } from "@coral-xyz/anchor";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import type { GherkinPay } from "~/types/gherkin_pay";
import { useAnchorProgram } from "~/lib/anchor";
import { PROGRAM_ID } from "~/lib/constants";
import type { ActivityEvent } from "~/lib/queries/activity";

/**
 * The 7 compliance-relevant on-chain event types emitted by the gherkin_pay
 * program. Used both for query-side filtering and for filter-pill generation
 * in the Audit Log page.
 */
export const COMPLIANCE_EVENTS = [
  "PaymentCreated",
  "PaymentFunded",
  "ConditionMet",
  "MultisigApproval",
  "PaymentReleased",
  "PaymentCancelled",
  "MilestoneAdvanced",
] as const;

export type ComplianceEventName = (typeof COMPLIANCE_EVENTS)[number];

/**
 * Fetches recent gherkin_pay program transactions from devnet, parses their
 * log messages using Anchor's EventParser, and returns only compliance-relevant
 * events (those whose name is in COMPLIANCE_EVENTS).
 *
 * Structurally identical to useActivityFeed() with an allowlist filter applied
 * after parsing.
 *
 * Returns standard React Query state: data, isLoading, isError, error.
 */
export function useComplianceAuditLog() {
  const { connection } = useConnection();
  const { program: rawProgram } = useAnchorProgram();

  const program = rawProgram as Program<GherkinPay> | null;

  return useQuery({
    queryKey: ["audit-log"],
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
      const allowSet = new Set<string>(COMPLIANCE_EVENTS);

      for (let i = 0; i < txs.length; i++) {
        const tx = txs[i];
        const sigInfo = sigInfos[i];
        if (!tx || !sigInfo || !tx.meta?.logMessages) continue;

        const parsed = eventParser.parseLogs(tx.meta.logMessages);
        for (const event of parsed) {
          if (!allowSet.has(event.name)) continue;

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
