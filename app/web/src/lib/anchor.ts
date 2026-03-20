"use client";

import { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import type { GherkinPay } from "~/types/gherkin_pay";
import idl from "~/idl/gherkin_pay.json";

/**
 * Returns a typed Anchor Program instance (or null when wallet is disconnected).
 * Anchor v0.30+ reads the program address from the IDL JSON.
 */
export function useAnchorProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;

    const provider = new AnchorProvider(
      connection,
      wallet as never,
      AnchorProvider.defaultOptions()
    );

    return new Program(idl as never, provider) as unknown as Program<GherkinPay>;
  }, [connection, wallet]);

  return { program };
}
