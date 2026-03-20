"use client";

import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import "@solana/wallet-adapter-react-ui/styles.css";

import { DEVNET_RPC_ENDPOINT } from "~/lib/constants";

export function WalletContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={DEVNET_RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
