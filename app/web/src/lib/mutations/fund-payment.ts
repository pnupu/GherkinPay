/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import type { PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

import { useAnchorProgram } from "~/lib/anchor";
import { getEscrowPDA, getConditionPDA } from "~/lib/pda";
import { getUsdcAta } from "~/lib/token";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FundPaymentInput {
  /** The PDA of the PaymentAgreement account to fund. */
  paymentPDA: PublicKey;
}

export interface FundPaymentResult {
  /** Transaction signature from the fundPayment RPC call. */
  signature: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Mutation hook that funds a Created payment — transferring USDC from the
 * payer's token account into the escrow PDA, moving status to Active.
 *
 * Derives all required PDAs from the on-chain PaymentAgreement account:
 * - escrowPDA  — `["escrow", paymentPDA]`
 * - conditionPDA — `["conditions", paymentPDA, milestoneIndex]`
 * - payerAta — Token-2022 ATA for payer's USDC
 *
 * On success, invalidates the `["agreements"]` query cache so the UI
 * reflects the new Active status.
 */
export function useFundPayment() {
  const { program } = useAnchorProgram();
  const wallet = useWallet();
  const queryClient = useQueryClient();

  return useMutation<FundPaymentResult, Error, FundPaymentInput>({
    mutationFn: async ({ paymentPDA }) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      // 1. Fetch the on-chain PaymentAgreement to read account fields
      console.log(
        "[GherkinPay] Funding payment:",
        paymentPDA.toBase58()
      );

      const paymentAccount =
        await (program.account as any).paymentAgreement.fetch(paymentPDA);

      const { tokenMint, payer, isMilestone, currentMilestone } =
        paymentAccount;

      // 2. Derive PDAs
      const [escrowPDA] = getEscrowPDA(paymentPDA);

      // For simple payments the condition account is at milestone index 0.
      // For milestone payments, use the currentMilestone field.
      const milestoneIndex = isMilestone ? currentMilestone : 0;
      const [conditionPDA] = getConditionPDA(paymentPDA, milestoneIndex);

      // 3. Derive the payer's Token-2022 USDC ATA
      const payerAta = getUsdcAta(payer);

      console.log("[GherkinPay] fundPayment accounts:", {
        payer: payer.toBase58(),
        payment: paymentPDA.toBase58(),
        conditionAccount: conditionPDA.toBase58(),
        tokenMint: tokenMint.toBase58(),
        payerTokenAccount: payerAta.toBase58(),
        escrowTokenAccount: escrowPDA.toBase58(),
      });

      // 4. Send the fund instruction
      const signature = await (program.methods as any)
        .fundPayment()
        .accounts({
          payer: wallet.publicKey,
          payment: paymentPDA,
          conditionAccount: conditionPDA,
          tokenMint,
          payerTokenAccount: payerAta,
          escrowTokenAccount: escrowPDA,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      console.log("[GherkinPay] fundPayment tx:", signature);

      return { signature };
    },

    onSuccess: () => {
      // Refresh agreement list so status changes from Created → Active
      void queryClient.invalidateQueries({ queryKey: ["agreements"] });
    },

    onError: (error) => {
      console.error("[GherkinPay] Fund payment failed:", error);
    },
  });
}
