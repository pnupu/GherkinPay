"use client";

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PublicKey } from "@solana/web3.js";
import type { Wallet } from "@coral-xyz/anchor";
import { HermesClient } from "@pythnetwork/hermes-client";
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";
import type { InstructionWithEphemeralSigners } from "@pythnetwork/pyth-solana-receiver";
import { useAnchorProgram } from "~/lib/anchor";
import { decodeAnchorError } from "~/lib/errors";

const HERMES_URL = "https://hermes.pyth.network";

interface PostAndCrankOracleParams {
  paymentPubkey: PublicKey;
  conditionAccountPubkey: PublicKey;
  conditionIndex: number;
  /** The on-chain PublicKey whose bytes encode the hex feed ID */
  feedAccount: PublicKey;
}

/**
 * Post a Pyth PriceUpdateV2 from Hermes pull-model data, then crank the oracle
 * condition — all in one user action. Works for both push-sponsored (e.g. SOL/USD)
 * and pull-only (e.g. EUR/USD) feeds.
 *
 * Flow:
 *   1. Derive hex feed ID from feedAccount bytes
 *   2. Fetch latest price update VAA from Pyth Hermes
 *   3. Build PythSolanaReceiver tx: post PriceUpdateV2 + crankOracle consumer ix
 *   4. Send versioned transaction(s) via wallet
 */
export function usePostAndCrankOracle() {
  const { program, connection } = useAnchorProgram();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paymentPubkey,
      conditionAccountPubkey,
      conditionIndex,
      feedAccount,
    }: PostAndCrankOracleParams): Promise<string> => {
      if (!program) throw new Error("Wallet not connected");

      const t0 = performance.now();

      // 1. Derive hex feed ID from the on-chain PublicKey's raw bytes
      const feedIdHex = Buffer.from(feedAccount.toBytes()).toString("hex");
      console.log(
        `[GherkinPay] Post+crank oracle: feedId=${feedIdHex}, conditionIndex=${conditionIndex}`,
      );

      // 2. Fetch latest price update from Hermes
      let priceUpdateData: string[];
      try {
        const hermesClient = new HermesClient(HERMES_URL, {});
        const result = await hermesClient.getLatestPriceUpdates(
          ["0x" + feedIdHex],
          { encoding: "base64" },
        );
        priceUpdateData = result.binary.data;
        if (!priceUpdateData.length) {
          throw new Error("No price update data returned from Hermes");
        }
        console.log(
          `[GherkinPay] Hermes returned ${priceUpdateData.length} update(s)`,
        );
      } catch (err) {
        console.error("[GherkinPay] Hermes fetch failed:", err);
        throw new Error(
          "Unable to fetch FX rate from Pyth — the market may be closed or the feed unavailable.",
        );
      }

      // 3. Build PythSolanaReceiver transaction
      //    The wallet adapter's AnchorWallet satisfies the Wallet interface
      //    (signTransaction, signAllTransactions, publicKey).
      const wallet = (program.provider as any).wallet as Wallet;
      const pythSolanaReceiver = new PythSolanaReceiver({
        connection,
        wallet,
      });

      const transactionBuilder = pythSolanaReceiver.newTransactionBuilder({
        closeUpdateAccounts: false,
      });

      // Post the price update VAA(s) on-chain
      await transactionBuilder.addPostPriceUpdates(priceUpdateData);

      // Add crankOracle as a consumer instruction
      await transactionBuilder.addPriceConsumerInstructions(
        async (
          getPriceUpdateAccount: (priceFeedId: string) => PublicKey,
        ): Promise<InstructionWithEphemeralSigners[]> => {
          const priceUpdateAccount = getPriceUpdateAccount(feedIdHex);
          console.log(
            `[GherkinPay] PriceUpdateV2 account: ${priceUpdateAccount.toBase58()}`,
          );

          const ix = await (program.methods as any)
            .crankOracle(conditionIndex)
            .accounts({
              payment: paymentPubkey,
              conditionAccount: conditionAccountPubkey,
              priceFeed: priceUpdateAccount,
            })
            .instruction();

          return [{ instruction: ix, signers: [] }];
        },
      );

      // 4. Build and send versioned transactions
      const txs = await transactionBuilder.buildVersionedTransactions({
        tightComputeBudget: true,
        computeUnitPriceMicroLamports: 50000,
      });

      const signatures = await pythSolanaReceiver.provider.sendAll(
        txs.map(({ tx, signers }) => ({ tx, signers })),
        { skipPreflight: true },
      );

      const elapsed = Math.round(performance.now() - t0);
      const lastSig = signatures[signatures.length - 1] ?? "";
      console.log(
        `[GherkinPay] Post+crank oracle complete: ${signatures.length} tx(s), last=${lastSig}, ${elapsed}ms`,
      );

      return lastSig;
    },
    onSuccess: (_sig, { paymentPubkey }) => {
      void queryClient.invalidateQueries({
        queryKey: ["conditions", paymentPubkey.toBase58()],
      });
    },
    onError: (error: unknown) => {
      // Hermes errors are already user-friendly; decode on-chain errors
      const msg =
        error instanceof Error && error.message.includes("Unable to fetch FX rate")
          ? error.message
          : decodeAnchorError(error);
      console.error(`[GherkinPay] Post+crank oracle failed: ${msg}`);
    },
  });
}
