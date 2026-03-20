import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

/**
 * USDC-dev mint on Solana devnet (Token-2022 program).
 *
 * This is the same mint used in `tests/gherkin-pay.ts` — the actual devnet
 * USDC-dev mint deployed under Token-2022. Update this constant if the
 * program migrates to a different test token.
 */
export const USDC_MINT = new PublicKey(
  // Devnet USDC-dev mint — same address used in create-payment-wizard.tsx.
  // Replace with mainnet USDC when deploying to mainnet.
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

/**
 * Derives the Associated Token Account address for a given owner using
 * the Token-2022 program.
 *
 * @param owner - Wallet public key whose ATA is being derived
 * @returns The deterministic ATA public key (may not exist on-chain yet)
 */
export function getUsdcAta(owner: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(
    USDC_MINT,
    owner,
    false, // allowOwnerOffCurve
    TOKEN_2022_PROGRAM_ID
  );
}
