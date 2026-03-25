import Link from "next/link";

const features = [
  {
    title: "Programmable Escrow",
    desc: "Composable AND/OR condition trees — time-locks, Pyth oracles, multisig, webhooks, token gates — evaluated on-chain before any funds move.",
    icon: "⧫",
  },
  {
    title: "KYC / AML Enforcement",
    desc: "On-chain identity allowlist via Token-2022 transfer hooks. Only KYC-verified wallets can send or receive — enforced at the protocol level.",
    icon: "◈",
  },
  {
    title: "Travel Rule Compliance",
    desc: "Every payment carries a metadata URI linking to sender/receiver identity data, satisfying FATF Travel Rule requirements for institutional VASPs.",
    icon: "⬡",
  },
  {
    title: "Milestone Releases",
    desc: "Phased stablecoin disbursement tied to verifiable deliverables, each gated by its own condition set — ideal for trade finance and project funding.",
    icon: "▣",
  },
  {
    title: "Multi-Stablecoin",
    desc: "Native support for USDC, USDT, and USDG with custom token mint extensibility. Institutional-grade settlement across regulated stablecoins.",
    icon: "◇",
  },
  {
    title: "Permissionless Automation",
    desc: "Anyone can trigger oracle, time-lock, and token-gate evaluations — no privileged operators. Autonomous crank bot included for hands-off settlement.",
    icon: "⟐",
  },
  {
    title: "FX Oracle Settlement",
    desc: "Cross-border forex settlement triggered by live Pyth EUR/USD, GBP/USD, and USD/JPY rate feeds — institutional-grade FX payments settled on Solana in seconds.",
    icon: "⬢",
  },
];

const pages = [
  { href: "/agreements", label: "Agreements", note: "Create & manage escrows" },
  { href: "/milestones", label: "Milestones", note: "Phased disbursement" },
  { href: "/compliance", label: "KYC / AML", note: "Identity allowlist" },
  { href: "/relayers", label: "Relayers", note: "Crank operator registry" },
  { href: "/activity", label: "KYT Monitor", note: "Transaction monitoring" },
  { href: "/audit", label: "Audit Log", note: "AML event trail" },
];

export default function Home() {
  return (
    <main className="landing">
      {/* Ambient background effects */}
      <div className="landing-glow landing-glow--top" aria-hidden="true" />
      <div className="landing-glow landing-glow--bottom" aria-hidden="true" />
      <div className="landing-grid-bg" aria-hidden="true" />

      {/* Nav bar */}
      <header className="landing-header">
        <span className="landing-brand">
          <span className="landing-brand-icon">◆</span> GherkinPay
        </span>
        <Link className="btn btn-primary btn-sm" href="/agreements">
          Launch App →
        </Link>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-badge">Institutional stablecoin infrastructure on Solana</div>
        <h1 className="landing-title">
          Programmable settlements,
          <br />
          <span className="landing-title-accent">compliance built in.</span>
        </h1>
        <p className="landing-subtitle">
          Condition-gated stablecoin escrow with KYC/AML enforcement, Travel Rule
          compliance, milestone-based releases, and autonomous settlement — built
          for institutional-grade payments on Solana.
        </p>
        <div className="landing-actions">
          <Link className="btn btn-primary btn-lg" href="/agreements">
            Open App
          </Link>
          <Link className="btn btn-outline btn-lg" href="/activity">
            KYT Monitor
          </Link>
        </div>
        <div className="landing-stats">
          <div className="landing-stat">
            <span className="landing-stat-value">6</span>
            <span className="landing-stat-label">Condition types</span>
          </div>
          <div className="landing-stat-divider" />
          <div className="landing-stat">
            <span className="landing-stat-value">3</span>
            <span className="landing-stat-label">FX pairs</span>
          </div>
          <div className="landing-stat-divider" />
          <div className="landing-stat">
            <span className="landing-stat-value">T-22</span>
            <span className="landing-stat-label">KYC enforcement</span>
          </div>
          <div className="landing-stat-divider" />
          <div className="landing-stat">
            <span className="landing-stat-value">3</span>
            <span className="landing-stat-label">Stablecoins</span>
          </div>
          <div className="landing-stat-divider" />
          <div className="landing-stat">
            <span className="landing-stat-value">&lt;1s</span>
            <span className="landing-stat-label">Settlement</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-section">
        <h2 className="landing-section-label">Capabilities</h2>
        <div className="landing-features">
          {features.map((f) => (
            <article key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Console pages */}
      <section className="landing-section">
        <h2 className="landing-section-label">Console</h2>
        <div className="landing-pages">
          {pages.map((p) => (
            <Link key={p.href} className="page-card" href={p.href}>
              <span className="page-card-label">{p.label}</span>
              <span className="page-card-note">{p.note}</span>
              <span className="page-card-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <span className="landing-footer-brand">◆ GherkinPay</span>
        <span className="landing-footer-note">
          Built on Solana · Anchor · Token-2022 · StableHacks 2026
        </span>
      </footer>
    </main>
  );
}
