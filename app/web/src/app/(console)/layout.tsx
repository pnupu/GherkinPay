import type { ReactNode } from "react";
import { DashboardNav } from "~/app/_components/dashboard-nav";

export default function ConsoleLayout(props: { children: ReactNode }) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">GherkinPay</div>
        <DashboardNav />
      </aside>
      <section className="content">{props.children}</section>
    </main>
  );
}
