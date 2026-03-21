"use client";

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PublicKey } from "@solana/web3.js";
import { useAnchorProgram } from "~/lib/anchor";
import { decodeAnchorError } from "~/lib/errors";

interface SignMultisigParams {
  paymentPubkey: PublicKey;
  conditionAccountPubkey: PublicKey;
  conditionIndex: number;
}

export function useSignMultisig() {
  const { program } = useAnchorProgram();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paymentPubkey,
      conditionAccountPubkey,
      conditionIndex,
    }: SignMultisigParams): Promise<string> => {
      if (!program) throw new Error("Wallet not connected");

      console.log(
        `[GherkinPay] Signing multisig condition index=${conditionIndex}`,
      );

      const sig = await (program.methods as any)
        .signMultisig(conditionIndex)
        .accounts({
          payment: paymentPubkey,
          conditionAccount: conditionAccountPubkey,
          signer: program.provider.publicKey,
        })
        .rpc();

      console.log(`[GherkinPay] signMultisig tx: ${sig}`);
      return sig as string;
    },
    onSuccess: (_sig, { paymentPubkey }) => {
      void queryClient.invalidateQueries({
        queryKey: ["conditions", paymentPubkey.toBase58()],
      });
    },
    onError: (error: unknown) => {
      const decoded = decodeAnchorError(error);
      console.error(`[GherkinPay] signMultisig failed: ${decoded}`);
    },
  });
}
