import type { ReactNode } from "react";
import { DashboardNav } from "~/app/_components/dashboard-nav";
import { WalletButton } from "~/components/wallet-button";

export default function ConsoleLayout(props: { children: ReactNode }) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">GherkinPay</div>
        <DashboardNav />
        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          <WalletButton />
        </div>
      </aside>
      <section className="content">{props.children}</section>
    </main>
  );
}
