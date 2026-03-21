"use client";

import { useMemo } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";

import type { GherkinPay } from "~/types/gherkin_pay";
import type { GherkinPayHook } from "~/types/gherkin_pay_hook";
import gherkinPayIdl from "~/idl/gherkin_pay.json";
import gherkinPayHookIdl from "~/idl/gherkin_pay_hook.json";

export function useAnchorProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const result = useMemo(() => {
    if (!wallet) {
      return { program: null, hookProgram: null, connection } as const;
    }

    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });

    const program = new Program(
      gherkinPayIdl as unknown as GherkinPay,
      provider
    );

    const hookProgram = new Program(
      gherkinPayHookIdl as unknown as GherkinPayHook,
      provider
    );

    return { program, hookProgram, connection, provider } as const;
  }, [connection, wallet]);

  return result;
}
