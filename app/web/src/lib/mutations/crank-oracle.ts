"use client";

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PublicKey } from "@solana/web3.js";
import { useAnchorProgram } from "~/lib/anchor";
import { decodeAnchorError } from "~/lib/errors";

interface CrankOracleParams {
  paymentPubkey: PublicKey;
  conditionAccountPubkey: PublicKey;
  conditionIndex: number;
  priceFeedPubkey: PublicKey;
}

/**
 * Parse Pyth PriceUpdateV2 account data at the same byte offsets
 * the on-chain program uses (see crank_oracle.rs):
 *   price:        i64  @ bytes 73..81
 *   conf:         u64  @ bytes 81..89
 *   exponent:     i32  @ bytes 89..93
 *   publish_time: i64  @ bytes 93..101
 */
export interface PythPriceData {
  price: bigint;
  conf: bigint;
  exponent: number;
  publishTime: number;
}

export function parsePythPrice(data: Buffer): PythPriceData | null {
  if (data.length < 101) return null;

  const view = new DataView(
    data.buffer,
    data.byteOffset,
    data.byteLength,
  );

  const price = view.getBigInt64(73, true);
  const conf = view.getBigUint64(81, true);
  const exponent = view.getInt32(89, true);
  const publishTime = Number(view.getBigInt64(93, true));

  return { price, conf, exponent, publishTime };
}

/**
 * Check whether a Pyth publish_time is older than MAX_PRICE_AGE_SECS (60).
 */
export function isPriceStale(publishTime: number): boolean {
  return Math.floor(Date.now() / 1000) - publishTime > 60;
}

export function useCrankOracle() {
  const { program } = useAnchorProgram();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paymentPubkey,
      conditionAccountPubkey,
      conditionIndex,
      priceFeedPubkey,
    }: CrankOracleParams): Promise<string> => {
      if (!program) throw new Error("Wallet not connected");

      console.log(
        `[GherkinPay] Cranking oracle condition index=${conditionIndex}`,
      );

      const sig = await (program.methods as any)
        .crankOracle(conditionIndex)
        .accounts({
          payment: paymentPubkey,
          conditionAccount: conditionAccountPubkey,
          priceFeed: priceFeedPubkey,
        })
        .rpc();

      console.log(`[GherkinPay] crankOracle tx: ${sig}`);
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
