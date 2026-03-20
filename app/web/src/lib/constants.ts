import { PublicKey } from "@solana/web3.js";
import { env } from "~/env";

export const PROGRAM_ID = new PublicKey(
  "2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV"
);
export const HOOK_PROGRAM_ID = new PublicKey(
  "3pG9tTyExGA3C7sdvw5AcUvfmwydtRCLV22KPb6SfYRc"
);
export const DEVNET_RPC_ENDPOINT = env.NEXT_PUBLIC_SOLANA_RPC_URL;
