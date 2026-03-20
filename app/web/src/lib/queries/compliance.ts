"use client";

import type { Program } from "@coral-xyz/anchor";
import { useQuery } from "@tanstack/react-query";
import type { GherkinPayHook } from "~/types/gherkin_pay_hook";
import { useAnchorProgram } from "~/lib/anchor";

/**
 * Fetches all complianceEntry accounts from the gherkin_pay_hook program on devnet.
 * Each ComplianceEntry has { isAllowed: bool, bump: u8 }.
 * PDA seeds are ["compliance", mint, wallet] — the account pubkey encodes the
 * mint/wallet, but the account data only stores isAllowed and bump.
 *
 * Returns standard React Query state: data, isLoading, isError, error.
 */
export function useComplianceEntries() {
  const { hookProgram: rawHookProgram } = useAnchorProgram();

  const hookProgram = rawHookProgram as Program<GherkinPayHook> | null;

  return useQuery({
    queryKey: ["compliance"],
    queryFn: async () => {
      return hookProgram!.account.complianceEntry.all();
    },
    enabled: !!hookProgram,
  });
}
