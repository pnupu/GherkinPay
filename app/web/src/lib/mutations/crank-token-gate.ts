"use client";

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { useAnchorProgram } from "~/lib/anchor";
import { decodeAnchorError } from "~/lib/errors";

interface CrankTokenGateParams {
  paymentPubkey: PublicKey;
  conditionAccountPubkey: PublicKey;
  conditionIndex: number;
  holder: PublicKey;
  requiredMint: PublicKey;
}

export function useCrankTokenGate() {
  const { program } = useAnchorProgram();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paymentPubkey,
      conditionAccountPubkey,
      conditionIndex,
      holder,
      requiredMint,
    }: CrankTokenGateParams): Promise<string> => {
      if (!program) throw new Error("Wallet not connected");

      console.log(
        `[GherkinPay] Cranking tokenGated condition index=${conditionIndex}`,
      );

      const holderTokenAccount = getAssociatedTokenAddressSync(
        requiredMint,
        holder,
        true, // allowOwnerOffCurve
        TOKEN_2022_PROGRAM_ID,
      );

      const sig = await (program.methods as any)
        .crankTokenGate(conditionIndex)
        .accounts({
          payment: paymentPubkey,
          conditionAccount: conditionAccountPubkey,
          holderTokenAccount,
        })
        .rpc();

      console.log(`[GherkinPay] crankTokenGate tx: ${sig}`);
      return sig as string;
    },
    onSuccess: (_sig, { paymentPubkey }) => {
      void queryClient.invalidateQueries({
        queryKey: ["conditions", paymentPubkey.toBase58()],
      });
    },
    onError: (error: unknown) => {
      const decoded = decodeAnchorError(error);
      console.error(`[GherkinPay] Crank failed: ${decoded}`);
    },
  });
}
