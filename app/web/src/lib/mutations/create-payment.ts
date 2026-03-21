"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { type PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

import { useAnchorProgram } from "~/lib/anchor";
import { getPaymentPDA, getEscrowPDA, getConditionPDA } from "~/lib/pda";

// ---------------------------------------------------------------------------
// Condition input types — discriminated union matching the 5 Anchor variants
// ---------------------------------------------------------------------------

export type ConditionInput =
  | {
      type: "timeBased";
      unlockAt: BN; // unix timestamp (i64)
    }
  | {
      type: "multisig";
      signers: PublicKey[];
      threshold: number;
    }
  | {
      type: "oracle";
      feedAccount: PublicKey;
      operator: "gt" | "gte" | "lt" | "lte" | "eq";
      targetValue: BN; // i64
      decimals: number;
    }
  | {
      type: "webhook";
      relayer: PublicKey;
      eventHash: number[]; // [u8; 32]
    }
  | {
      type: "tokenGated";
      requiredMint: PublicKey;
      minAmount: BN;
      holder: PublicKey;
    };

export interface MilestoneInput {
  amount: BN;
  operator: "and" | "or";
  conditions: ConditionInput[];
}

export interface CreatePaymentInput {
  totalAmount: BN;
  payerWallet: PublicKey;
  payee: PublicKey;
  tokenMint: PublicKey;
  isMilestone: boolean;
  operator: "and" | "or";
  conditions: ConditionInput[];
  milestones?: MilestoneInput[];
}

export interface CreatePaymentResult {
  paymentPDA: PublicKey;
  signatures: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a collision-resistant payment ID from current time + random. */
function generatePaymentId(): BN {
  return new BN(Date.now() * 1000 + Math.floor(Math.random() * 1000));
}

/**
 * Map a ConditionInput to the Anchor instruction argument shape.
 * Uses `as never` to satisfy Anchor v0.32's deep discriminated-union generics.
 */
function toAnchorCondition(c: ConditionInput): never {
  switch (c.type) {
    case "timeBased":
      return { timeBased: { unlockAt: c.unlockAt, met: false } } as never;
    case "multisig":
      return {
        multisig: {
          signers: c.signers,
          threshold: c.threshold,
          approvals: c.signers.map(() => false),
          met: false,
        },
      } as never;
    case "oracle":
      return {
        oracle: {
          feedAccount: c.feedAccount,
          operator: { [c.operator]: {} },
          targetValue: c.targetValue,
          decimals: c.decimals,
          met: false,
        },
      } as never;
    case "webhook":
      return {
        webhook: {
          relayer: c.relayer,
          eventHash: c.eventHash,
          met: false,
        },
      } as never;
    case "tokenGated":
      return {
        tokenGated: {
          requiredMint: c.requiredMint,
          minAmount: c.minAmount,
          holder: c.holder,
          met: false,
        },
      } as never;
  }
}

/** Build an Anchor-compatible ConditionOperator enum value. */
function operatorArg(op: "and" | "or") {
  return { [op]: {} } as never;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCreatePayment() {
  const { program } = useAnchorProgram();
  const wallet = useWallet();
  const queryClient = useQueryClient();

  return useMutation<CreatePaymentResult, Error, CreatePaymentInput>({
    mutationFn: async (input) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      const authority = wallet.publicKey;
      const paymentId = generatePaymentId();
      const signatures: string[] = [];

      const [paymentPDA] = getPaymentPDA(authority, paymentId);
      const [escrowPDA] = getEscrowPDA(paymentPDA);

      if (input.isMilestone) {
        // ------------------------------------------------------------------
        // MILESTONE PAYMENT FLOW
        // ------------------------------------------------------------------
        const milestones = input.milestones ?? [];
        if (milestones.length === 0) {
          throw new Error("Milestone payment requires at least one milestone");
        }

        // 1. createMilestonePayment
        console.log(
          "[GherkinPay] Creating milestone payment:",
          paymentId.toString()
        );
        const createSig = await program.methods
          .createMilestonePayment(
            paymentId,
            input.totalAmount,
            milestones.length
          )
          .accountsPartial({
            authority,
            payerWallet: input.payerWallet,
            payee: input.payee,
            tokenMint: input.tokenMint,
            payment: paymentPDA,
            escrowTokenAccount: escrowPDA,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        signatures.push(createSig);
        console.log("[GherkinPay] createMilestonePayment tx:", createSig);

        // 2. For each milestone: addMilestone → addCondition ×N → finalizeConditions
        for (let i = 0; i < milestones.length; i++) {
          const milestone = milestones[i]!;
          const [conditionPDA] = getConditionPDA(paymentPDA, i);

          // addMilestone
          const msSig = await program.methods
            .addMilestone(i, milestone.amount, operatorArg(milestone.operator))
            .accountsPartial({
              authority,
              payment: paymentPDA,
              conditionAccount: conditionPDA,
              systemProgram: SystemProgram.programId,
            })
            .rpc();
          signatures.push(msSig);
          console.log(`[GherkinPay] addMilestone(${i}) tx:`, msSig);

          // addCondition for each condition in this milestone
          for (const condition of milestone.conditions) {
            const condSig = await program.methods
              .addCondition(toAnchorCondition(condition))
              .accountsPartial({
                authority,
                payment: paymentPDA,
                conditionAccount: conditionPDA,
                systemProgram: SystemProgram.programId,
              })
              .rpc();
            signatures.push(condSig);
            console.log(
              `[GherkinPay] addCondition(milestone ${i}, ${condition.type}) tx:`,
              condSig
            );
          }

          // finalizeConditions for this milestone
          const finSig = await program.methods
            .finalizeConditions()
            .accountsPartial({
              authority,
              payment: paymentPDA,
              conditionAccount: conditionPDA,
            })
            .rpc();
          signatures.push(finSig);
          console.log(
            `[GherkinPay] finalizeConditions(milestone ${i}) tx:`,
            finSig
          );
        }

        console.log("[GherkinPay] Milestone payment created:", {
          paymentPDA: paymentPDA.toBase58(),
          totalTxs: signatures.length,
        });

        return { paymentPDA, signatures };
      } else {
        // ------------------------------------------------------------------
        // SIMPLE PAYMENT FLOW
        // ------------------------------------------------------------------
        const [conditionPDA] = getConditionPDA(paymentPDA, 0);

        // 1. createPayment
        console.log(
          "[GherkinPay] Creating simple payment:",
          paymentId.toString()
        );
        const createSig = await program.methods
          .createPayment(
            paymentId,
            input.totalAmount,
            operatorArg(input.operator)
          )
          .accountsPartial({
            authority,
            payerWallet: input.payerWallet,
            payee: input.payee,
            tokenMint: input.tokenMint,
            payment: paymentPDA,
            escrowTokenAccount: escrowPDA,
            conditionAccount: conditionPDA,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        signatures.push(createSig);
        console.log("[GherkinPay] createPayment tx:", createSig);

        // 2. addCondition for each condition
        for (const condition of input.conditions) {
          const condSig = await program.methods
            .addCondition(toAnchorCondition(condition))
            .accountsPartial({
              authority,
              payment: paymentPDA,
              conditionAccount: conditionPDA,
              systemProgram: SystemProgram.programId,
            })
            .rpc();
          signatures.push(condSig);
          console.log(
            `[GherkinPay] addCondition(${condition.type}) tx:`,
            condSig
          );
        }

        // 3. finalizeConditions
        const finSig = await program.methods
          .finalizeConditions()
          .accountsPartial({
            authority,
            payment: paymentPDA,
            conditionAccount: conditionPDA,
          })
          .rpc();
        signatures.push(finSig);
        console.log("[GherkinPay] finalizeConditions tx:", finSig);

        console.log("[GherkinPay] Simple payment created:", {
          paymentPDA: paymentPDA.toBase58(),
          totalTxs: signatures.length,
        });

        return { paymentPDA, signatures };
      }
    },

    onSuccess: (_data) => {
      // Invalidate queries so the UI refreshes with the new payment
      void queryClient.invalidateQueries({ queryKey: ["agreements"] });
      void queryClient.invalidateQueries({ queryKey: ["milestones"] });
    },

    onError: (error) => {
      console.error("[GherkinPay] Payment creation failed:", error);
    },
  });
}
