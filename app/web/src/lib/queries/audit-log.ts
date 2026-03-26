"use client";

import { api } from "~/trpc/react";
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
 * Fetches compliance-relevant events via the server-side cached tRPC endpoint,
 * filtered to only COMPLIANCE_EVENTS. The server handles RPC caching — clients
 * no longer make direct devnet calls for event data.
 */
export function useComplianceAuditLog() {
  return api.events.list.useQuery(
    { filter: [...COMPLIANCE_EVENTS] },
    {
      staleTime: 15_000,
      refetchInterval: 30_000,
    }
  );
}

// Re-export for backward compat with pages that import ActivityEvent from here
export type { ActivityEvent };
