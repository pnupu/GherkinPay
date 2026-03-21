"use client";

import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import "@solana/wallet-adapter-react-ui/styles.css";

import { DEVNET_RPC_ENDPOINT } from "~/lib/constants";
import { createTestWalletAdapter } from "~/lib/test-wallet-adapter";

const TEST_WALLET_KEY = process.env.NEXT_PUBLIC_TEST_WALLET;

export function WalletContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallets = useMemo(() => {
    if (TEST_WALLET_KEY) {
      return [createTestWalletAdapter(TEST_WALLET_KEY)];
    }
    return [];
  }, []);

  return (
    <ConnectionProvider endpoint={DEVNET_RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
