import { PublicKey } from "@solana/web3.js";
import type { BN } from "@coral-xyz/anchor";
import { PROGRAM_ID } from "./constants";

/**
 * Derives the PaymentAgreement PDA.
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
 * Derives the escrow token account PDA.
 * Seeds: ["escrow", paymentPDA]
 */
export function getEscrowPDA(paymentPDA: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), paymentPDA.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Derives the ConditionAccount PDA.
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
