"use client";

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
// Anchor 0.32 untyped account accessors — see KNOWLEDGE.md

import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { useAnchorProgram } from "~/lib/anchor";
import { GHERKIN_PAY_HOOK_PROGRAM_ID } from "~/lib/constants";
import { USDC_MINT } from "~/lib/token";
import type { ComplianceEntry } from "~/types/gherkin_pay_hook";

/**
 * Derive the ComplianceEntry PDA for a given wallet.
 * Seeds: ["compliance", mint, wallet]
 */
export function deriveComplianceEntryPda(wallet: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("compliance"), USDC_MINT.toBuffer(), wallet.toBuffer()],
    GHERKIN_PAY_HOOK_PROGRAM_ID,
  );
  return pda;
}

/**
 * Fetch a ComplianceEntry by wallet address.
 * Returns null if the account does not exist (not yet registered).
 */
export function useComplianceEntry(walletAddress: string | null) {
  const { hookProgram } = useAnchorProgram();

  return useQuery({
    queryKey: ["compliance-entry", walletAddress],
    queryFn: async (): Promise<ComplianceEntry | null> => {
      if (!hookProgram || !walletAddress) return null;

      const wallet = new PublicKey(walletAddress);
      const pda = deriveComplianceEntryPda(wallet);

      try {
        const account = await (hookProgram.account as any).complianceEntry.fetch(pda);
        return {
          isAllowed: account.isAllowed as boolean,
          bump: account.bump as number,
        };
      } catch (err: unknown) {
        // Account does not exist on-chain yet — not an error, just not registered
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes("Account does not exist") ||
          msg.includes("could not find account") ||
          msg.includes("Failed to find account")
        ) {
          console.log(`[GherkinPay] ComplianceEntry not found for ${walletAddress}`);
          return null;
        }
        throw err;
      }
    },
    enabled: !!hookProgram && !!walletAddress,
    staleTime: 15_000,
  });
}
