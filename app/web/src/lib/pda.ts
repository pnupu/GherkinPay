import { PublicKey } from "@solana/web3.js";
import { GHERKIN_PAY_PROGRAM_ID } from "./constants";

/**
 * Derive the PaymentAgreement PDA.
 * Seeds: ["payment", payment_id.to_le_bytes()]
 */
export function getPaymentPDA(paymentId: bigint | number): [PublicKey, number] {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(paymentId));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("payment"), buf],
    GHERKIN_PAY_PROGRAM_ID,
  );
}

/**
 * Derive the escrow token account PDA.
 * Seeds: ["escrow", payment_pubkey]
 */
export function getEscrowPDA(paymentPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), paymentPubkey.toBuffer()],
    GHERKIN_PAY_PROGRAM_ID,
  );
}

/**
 * Derive the ConditionAccount PDA for a specific milestone.
 * Seeds: ["condition", payment_pubkey, milestone_index as u8]
 */
export function getConditionPDA(
  paymentPubkey: PublicKey,
  milestoneIndex: number,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("condition"),
      paymentPubkey.toBuffer(),
      Buffer.from([milestoneIndex]),
    ],
    GHERKIN_PAY_PROGRAM_ID,
  );
}
