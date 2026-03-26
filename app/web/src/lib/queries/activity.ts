"use client";

import { api } from "~/trpc/react";

export interface ActivityEvent {
  signature: string;
  slot: number;
  blockTime: number | null;
  name: string;
  data: Record<string, unknown>;
}

/**
 * Fetches recent gherkin_pay program events via the server-side cached
 * tRPC endpoint. The server fetches from devnet and caches for 30s,
 * eliminating redundant RPC calls from multiple browser tabs/pages.
 */
export function useActivityFeed() {
  return api.events.list.useQuery(undefined, {
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
