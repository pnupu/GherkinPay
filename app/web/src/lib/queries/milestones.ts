"use client";

import type { Program, BN } from "@coral-xyz/anchor";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import type { GherkinPay } from "~/types/gherkin_pay";
import { useAnchorProgram } from "~/lib/anchor";
import { useAgreements } from "~/lib/queries/agreements";

/**
 * Fetches all conditionAccount accounts from devnet and joins them
 * to their parent paymentAgreement for display context.
 *
 * Returns standard React Query state: data, isLoading, isError, error.
 * Query key: ["milestones", walletPubkey] — visible in React Query DevTools.
 */
export function useMilestones() {
  const { program: rawProgram } = useAnchorProgram();
  const { publicKey } = useWallet();
  const { data: agreements } = useAgreements();

  const program = rawProgram as Program<GherkinPay> | null;

  return useQuery({
    queryKey: ["milestones", publicKey?.toBase58() ?? "disconnected"],
    queryFn: async () => {
      const conditionAccounts = await program!.account.conditionAccount.all();

      // Build a lookup map: agreement pubkey → agreement data
      const agreementMap = new Map(
        (agreements ?? []).map((a) => [a.publicKey.toBase58(), a])
      );

      return conditionAccounts.map((ca) => {
        const parentAgreement = agreementMap.get(
          ca.account.payment.toBase58()
        );

        return {
          publicKey: ca.publicKey,
          account: ca.account,
          // Parent agreement context for display
          parentPaymentId: parentAgreement?.account.paymentId,
          parentPubkey: ca.account.payment,
        };
      });
    },
    enabled: !!program && !!agreements,
  });
}
