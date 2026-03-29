import "~/styles/globals.css";

import { type Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { WalletContextProvider } from "~/components/wallet-provider";
import { TooltipProvider } from "~/components/ui/tooltip";

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
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <WalletContextProvider>
          <TRPCReactProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </TRPCReactProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}
