import { PublicKey } from "@solana/web3.js";
import type { BN } from "@coral-xyz/anchor";
import { PROGRAM_ID } from "~/lib/constants";

/**
 * Derive the PDA for a payment agreement account.
 * Seeds: ["payment", authority, paymentId (u64 LE)]
 */
export function getPaymentPDA(
  authority: PublicKey,
  paymentId: BN
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("payment"),
      authority.toBuffer(),
      paymentId.toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  );
}

/**
 * Derive the PDA for an escrow token account.
 * Seeds: ["escrow", paymentPDA]
 */
export function getEscrowPDA(paymentPDA: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), paymentPDA.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Derive the PDA for a condition account at a given milestone index.
 * Seeds: ["conditions", paymentPDA, milestoneIndex (u8)]
 */
export function getConditionPDA(
  paymentPDA: PublicKey,
  milestoneIndex: number
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("conditions"),
      paymentPDA.toBuffer(),
      Buffer.from([milestoneIndex]),
    ],
    PROGRAM_ID
  );
}
