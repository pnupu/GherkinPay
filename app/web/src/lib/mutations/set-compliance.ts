"use client";

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
// Anchor 0.32 untyped method accessors — see KNOWLEDGE.md

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useAnchorProgram } from "~/lib/anchor";
import { USDC_MINT } from "~/lib/token";
import { decodeAnchorError } from "~/lib/errors";
import { deriveComplianceEntryPda } from "~/lib/queries/compliance";

interface SetComplianceParams {
  walletAddress: string;
  isAllowed: boolean;
}

export function useSetCompliance() {
  const { hookProgram, provider } = useAnchorProgram();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      walletAddress,
      isAllowed,
    }: SetComplianceParams): Promise<string> => {
      if (!hookProgram || !provider) throw new Error("Wallet not connected");

      const wallet = new PublicKey(walletAddress);
      const pda = deriveComplianceEntryPda(wallet);

      console.log(
        `[GherkinPay] setCompliance wallet=${walletAddress} isAllowed=${isAllowed}`,
      );

      const sig = await (hookProgram.methods as any)
        .setCompliance(isAllowed)
        .accounts({
          authority: provider.wallet.publicKey,
          mint: USDC_MINT,
          wallet,
          complianceEntry: pda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log(`[GherkinPay] setCompliance tx: ${sig}`);
      return sig as string;
    },
    onSuccess: (_sig, { walletAddress }) => {
      void queryClient.invalidateQueries({
        queryKey: ["compliance-entry", walletAddress],
      });
    },
    onError: (error: unknown) => {
      const decoded = decodeAnchorError(error);
      console.error(`[GherkinPay] setCompliance failed: ${decoded}`);
    },
  });
}
