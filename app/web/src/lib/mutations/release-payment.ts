/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import type { PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import type { BN } from "@coral-xyz/anchor";

import { useAnchorProgram } from "~/lib/anchor";
import { getEscrowPDA, getConditionPDA } from "~/lib/pda";
import { getUsdcAta } from "~/lib/token";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReleasePaymentInput {
  /** The PDA of the PaymentAgreement account to release. */
  paymentPDA: PublicKey;
}

export interface ReleasePaymentResult {
  /** Transaction signature from the evaluateAndRelease RPC call. */
  signature: string;
  /** Whether crankTime was invoked before release. */
  crankedConditions: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Checks if a condition is TimeBased, has a past `unlockAt` timestamp,
 * and has not yet been marked as met.
 */
function isUnmetPastTimeBased(
  condition: { timeBased?: { unlockAt: BN; met: boolean } },
): boolean {
  if (!("timeBased" in condition) || !condition.timeBased) return false;
  const { unlockAt, met } = condition.timeBased;
  if (met) return false;
  const nowSeconds = Math.floor(Date.now() / 1_000);
  return unlockAt.toNumber() < nowSeconds;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Mutation hook that releases funds from an Active payment whose conditions
 * are met — transferring USDC from the escrow to the payee's token account.
 *
 * For milestone payments it resolves the correct `nextConditionAccount`:
 * - Simple payment or last milestone → same conditionPDA
 * - Milestone in progress → next milestone's conditionPDA
 *
 * Before calling `evaluateAndRelease`, it checks for unmet TimeBased
 * conditions with a past `unlockAt` and cranks them via `crankTime`.
 *
 * On success, invalidates the `["agreements"]` and `["milestones"]` query
 * caches so the UI reflects the new status.
 */
export function useReleasePayment() {
  const { program } = useAnchorProgram();
  const wallet = useWallet();
  const queryClient = useQueryClient();

  return useMutation<ReleasePaymentResult, Error, ReleasePaymentInput>({
    mutationFn: async ({ paymentPDA }) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      // 1. Fetch on-chain PaymentAgreement
      console.log(
        "[GherkinPay] Releasing payment:",
        paymentPDA.toBase58(),
      );

      const paymentAccount =
        await (program.account as any).paymentAgreement.fetch(paymentPDA);

      const {
        isMilestone,
        currentMilestone,
        milestoneCount,
        payee,
        tokenMint,
      } = paymentAccount;

      // 2. Derive condition PDA for current milestone (0 for simple payments)
      const milestoneIndex = isMilestone ? currentMilestone : 0;
      const [conditionPDA] = getConditionPDA(paymentPDA, milestoneIndex);

      // 3. Determine nextConditionAccount
      //    - Simple payment: same as conditionPDA
      //    - Last milestone (currentMilestone === milestoneCount - 1): same
      //    - Otherwise: next milestone's conditionPDA
      let nextConditionPDA: PublicKey;
      if (!isMilestone || currentMilestone === milestoneCount - 1) {
        nextConditionPDA = conditionPDA;
      } else {
        [nextConditionPDA] = getConditionPDA(
          paymentPDA,
          currentMilestone + 1,
        );
      }

      // 4. Crank unmet TimeBased conditions with past unlockAt
      const conditionAccount =
        await (program.account as any).conditionAccount.fetch(conditionPDA);

      let crankedConditions = 0;
      for (let i = 0; i < conditionAccount.conditions.length; i++) {
        const cond = conditionAccount.conditions[i] as {
          timeBased?: { unlockAt: BN; met: boolean };
        };

        if (isUnmetPastTimeBased(cond)) {
          console.log(
            `[GherkinPay] Cranking TimeBased condition index=${i}`,
          );

          await (program.methods as any)
            .crankTime(i)
            .accounts({
              payment: paymentPDA,
              conditionAccount: conditionPDA,
            })
            .rpc();

          crankedConditions++;
        }
      }

      if (crankedConditions > 0) {
        console.log(
          `[GherkinPay] Cranked ${crankedConditions} time condition(s)`,
        );
      }

      // 5. Derive remaining accounts
      const [escrowPDA] = getEscrowPDA(paymentPDA);
      const payeeAta = getUsdcAta(payee);

      console.log("[GherkinPay] evaluateAndRelease accounts:", {
        payment: paymentPDA.toBase58(),
        conditionAccount: conditionPDA.toBase58(),
        nextConditionAccount: nextConditionPDA.toBase58(),
        tokenMint: tokenMint.toBase58(),
        escrowTokenAccount: escrowPDA.toBase58(),
        payeeTokenAccount: payeeAta.toBase58(),
        milestoneIndex,
      });

      // 6. Call evaluateAndRelease
      const signature = await (program.methods as any)
        .evaluateAndRelease()
        .accounts({
          payment: paymentPDA,
          conditionAccount: conditionPDA,
          nextConditionAccount: nextConditionPDA,
          tokenMint,
          escrowTokenAccount: escrowPDA,
          payeeTokenAccount: payeeAta,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      console.log("[GherkinPay] evaluateAndRelease tx:", signature);

      return { signature, crankedConditions };
    },

    onSuccess: () => {
      // Refresh agreement list and milestones after release
      void queryClient.invalidateQueries({ queryKey: ["agreements"] });
      void queryClient.invalidateQueries({ queryKey: ["milestones"] });
    },

    onError: (error) => {
      console.error("[GherkinPay] Release payment failed:", error);
    },
  });
}
