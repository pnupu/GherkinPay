import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

/**
 * Devnet USDC Token-2022 mint.
 * Replace with mainnet mint for production.
 */
export const USDC_MINT = new PublicKey(
  "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
);

/**
 * Derive the USDC associated token account for an owner using Token-2022.
 */
export function getUsdcAta(owner: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(
    USDC_MINT,
    owner,
    true, // allowOwnerOffCurve
    TOKEN_2022_PROGRAM_ID,
  );
}
