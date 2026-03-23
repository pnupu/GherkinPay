import Link from "next/link";

const features = [
  {
    title: "Condition Engine",
    desc: "Composable AND/OR rule trees — time-locks, oracles, multisig, webhooks, token gates — evaluated on-chain before any funds move.",
    icon: "⧫",
  },
  {
    title: "Token-2022 Compliance",
    desc: "Transfer-hook allowlists and mint-authority checks enforced at the protocol level, every settlement.",
    icon: "◈",
  },
  {
    title: "Milestone Releases",
    desc: "Phased fund disbursement tied to verifiable deliverables, each gated by its own condition set.",
    icon: "▣",
  },
  {
    title: "Permissionless Cranks",
    desc: "Anyone can trigger oracle, time-lock, and token-gate evaluations — no privileged operators required.",
    icon: "⟐",
  },
];

const pages = [
  { href: "/agreements", label: "Agreements", note: "Create & manage escrows" },
  { href: "/milestones", label: "Milestones", note: "Track phased releases" },
  { href: "/compliance", label: "Compliance", note: "Token-2022 rule status" },
  { href: "/relayers", label: "Relayers", note: "Crank operator registry" },
  { href: "/activity", label: "Activity", note: "On-chain event feed" },
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
        <div className="landing-badge">Solana-native escrow protocol</div>
        <h1 className="landing-title">
          Programmable settlements,
          <br />
          <span className="landing-title-accent">verified on-chain.</span>
        </h1>
        <p className="landing-subtitle">
          Condition-gated escrow with composable rule engines, milestone-based
          releases, and Token-2022 compliance — trustless settlement on Solana.
        </p>
        <div className="landing-actions">
          <Link className="btn btn-primary btn-lg" href="/agreements">
            Open App
          </Link>
          <Link className="btn btn-outline btn-lg" href="/activity">
            Activity Feed
          </Link>
        </div>
        <div className="landing-stats">
          <div className="landing-stat">
            <span className="landing-stat-value">5</span>
            <span className="landing-stat-label">Condition types</span>
          </div>
          <div className="landing-stat-divider" />
          <div className="landing-stat">
            <span className="landing-stat-value">T-22</span>
            <span className="landing-stat-label">Token standard</span>
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
          Built on Solana · Anchor · Token-2022
        </span>
      </footer>
    </main>
  );
}
