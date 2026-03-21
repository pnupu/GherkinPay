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
  // Devnet Token-2022 USDC-test mint — replace with devnet/mainnet USDC when deploying.
  "5xUUritQPSGaLS1ggMzmii746xGbbeN2NSPyxqA5U5df"
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
