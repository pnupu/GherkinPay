import { PublicKey } from "@solana/web3.js";
import { env } from "~/env";

export const PROGRAM_ID = new PublicKey(
  "2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV"
);
export const HOOK_PROGRAM_ID = new PublicKey(
  "5AfrRNNaFgByD3fxxFf6nieeM4B516hTvcK6xvPEVkJC"
);
export const DEVNET_RPC_ENDPOINT = env.NEXT_PUBLIC_SOLANA_RPC_URL;

/** Alias used by M003 compliance/relayer code */
export const GHERKIN_PAY_HOOK_PROGRAM_ID = HOOK_PROGRAM_ID;
