import type { ReactNode } from "react";
import { DashboardNav } from "~/app/_components/dashboard-nav";
import { Button } from "~/components/ui/button";

export default function ConsoleLayout(props: { children: ReactNode }) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">GherkinPay</div>
        <DashboardNav />
        <div className="mt-auto p-4">
          <Button variant="outline" size="sm">
            Connect Wallet
          </Button>
        </div>
      </aside>
      <section className="content">{props.children}</section>
    </main>
  );
}
