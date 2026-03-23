import type { ReactNode } from "react";
import Link from "next/link";
import { DashboardNav } from "~/app/_components/dashboard-nav";
import { WalletButton } from "~/components/wallet-button";

export default function ConsoleLayout(props: { children: ReactNode }) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          ◆ GherkinPay
        </Link>
        <DashboardNav />
        <div className="mt-auto p-4">
          <WalletButton />
        </div>
      </aside>
      <section className="content">{props.children}</section>
    </main>
  );
}
