import "~/styles/globals.css";

import { type Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { WalletContextProvider } from "~/components/wallet-provider";

export const metadata: Metadata = {
  title: "GherkinPay",
  description: "Condition-driven escrow settlements on Solana",
  icons: [
    { rel: "icon", url: "/favicon.ico", sizes: "48x48" },
    { rel: "icon", url: "/icon.svg", type: "image/svg+xml" },
  ],
};
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable}`}>
      <body>
        <WalletContextProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}
