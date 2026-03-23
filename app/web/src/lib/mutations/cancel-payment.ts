/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import type { PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

import { useAnchorProgram } from "~/lib/anchor";
import { getEscrowPDA } from "~/lib/pda";
import { getUsdcAta } from "~/lib/token";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CancelPaymentInput {
  /** The PDA of the PaymentAgreement account to cancel. */
  paymentPDA: PublicKey;
}

export interface CancelPaymentResult {
  /** Transaction signature from the cancelPayment RPC call. */
  signature: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Mutation hook that cancels a payment — refunding USDC from the escrow
 * back to the payer's token account, moving status to Cancelled.
 *
 * The connected wallet must be the payment authority (payer).
 *
 * On success, invalidates the `["agreements"]` query cache so the UI
 * reflects the new Cancelled status.
 */
export function useCancelPayment() {
  const { program } = useAnchorProgram();
  const wallet = useWallet();
  const queryClient = useQueryClient();

  return useMutation<CancelPaymentResult, Error, CancelPaymentInput>({
    mutationFn: async ({ paymentPDA }) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      // 1. Fetch on-chain PaymentAgreement for tokenMint and payer
      console.log(
        "[GherkinPay] Cancelling payment:",
        paymentPDA.toBase58(),
      );

      const paymentAccount =
        await (program.account as any).paymentAgreement.fetch(paymentPDA);

      const { tokenMint, payer } = paymentAccount;

      // 2. Derive escrow PDA and payer ATA
      const [escrowPDA] = getEscrowPDA(paymentPDA);
      const payerAta = getUsdcAta(payer);

      console.log("[GherkinPay] cancelPayment accounts:", {
        authority: wallet.publicKey.toBase58(),
        payment: paymentPDA.toBase58(),
        tokenMint: tokenMint.toBase58(),
        escrowTokenAccount: escrowPDA.toBase58(),
        payerTokenAccount: payerAta.toBase58(),
      });

      // 3. Call cancelPayment — authority is auto-derived from payment
      //    relation by Anchor, but the connected wallet must match.
      const signature = await (program.methods as any)
        .cancelPayment()
        .accounts({
          payment: paymentPDA,
          tokenMint,
          escrowTokenAccount: escrowPDA,
          payerTokenAccount: payerAta,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      console.log("[GherkinPay] cancelPayment tx:", signature);

      return { signature };
    },

    onSuccess: () => {
      // Refresh agreement list so status changes to Cancelled
      void queryClient.invalidateQueries({ queryKey: ["agreements"] });
    },

    onError: (error) => {
      console.error("[GherkinPay] Cancel payment failed:", error);
    },
  });
}
