import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV"
);

export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
