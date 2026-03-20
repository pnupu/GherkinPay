"use client";

import type { Program } from "@coral-xyz/anchor";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import type { GherkinPay } from "~/types/gherkin_pay";
import { useAnchorProgram } from "~/lib/anchor";

/**
 * Fetches all paymentAgreement accounts from devnet.
 * When a wallet is connected, filters by authority (memcmp at offset 16).
 * Returns standard React Query state: data, isLoading, isError, error.
 */
export function useAgreements() {
  const { program: rawProgram } = useAnchorProgram();
  const { publicKey } = useWallet();

  // Cast to the concrete IDL type — anchor.ts constructs with the GherkinPay IDL
  // but TS infers Program<Idl> because the constructor signature takes `any`.
  const program = rawProgram as Program<GherkinPay> | null;

  return useQuery({
    queryKey: ["agreements", publicKey?.toBase58() ?? "disconnected"],
    queryFn: async () => {
      const filters = publicKey
        ? [{ memcmp: { offset: 16, bytes: publicKey.toBase58() } }]
        : [];

      return program!.account.paymentAgreement.all(filters);
    },
    enabled: !!program,
  });
}
