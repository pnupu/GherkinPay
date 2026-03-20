"use client";

import { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, type Idl } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
// Import IDL JSON at runtime
import gherkinPayIdl from "~/idl/gherkin_pay.json";
import gherkinPayHookIdl from "~/idl/gherkin_pay_hook.json";

export function useAnchorProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    return new AnchorProvider(connection, wallet as unknown as AnchorWallet, {
      commitment: "confirmed",
    });
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program(gherkinPayIdl as Idl, provider);
  }, [provider]);

  const hookProgram = useMemo(() => {
    if (!provider) return null;
    return new Program(gherkinPayHookIdl as Idl, provider);
  }, [provider]);

  return { program, hookProgram, connection, provider };
}
