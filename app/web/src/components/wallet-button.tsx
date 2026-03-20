"use client";

import dynamic from "next/dynamic";

// Dynamically import to avoid SSR issues with wallet adapter
const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton,
    ),
  { ssr: false },
);

export function WalletButton() {
  return <WalletMultiButton className="btn btn-secondary" />;
}
