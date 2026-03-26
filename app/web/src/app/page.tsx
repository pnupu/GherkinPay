import Link from "next/link";

/* ─── data ─────────────────────────────────────────────────────────────── */

const capabilities = [
  {
    title: "Programmable Escrow",
    desc: "Composable AND/OR condition trees — time-locks, Pyth oracles, multisig, webhooks, token gates — evaluated on-chain before any funds move.",
    tag: "Core",
    span: "wide",
  },
  {
    title: "FX Oracle Settlement",
    desc: "Cross-border forex settlement triggered by live Pyth EUR/USD, GBP/USD, and USD/JPY feeds. Institutional-grade FX payments settled on Solana in seconds.",
    tag: "New",
    span: "wide",
  },
  {
    title: "KYC / AML Enforcement",
    desc: "On-chain identity allowlist via Token-2022 transfer hooks. Only KYC-verified wallets can participate.",
    tag: "Compliance",
    span: "normal",
  },
  {
    title: "Travel Rule",
    desc: "Every payment carries a metadata URI for FATF Travel Rule — sender/receiver identity data attached at the protocol level.",
    tag: "Compliance",
    span: "normal",
  },
  {
    title: "Milestone Releases",
    desc: "Phased stablecoin disbursement tied to verifiable deliverables, each gated by its own condition set.",
    tag: "Payments",
    span: "normal",
  },
  {
    title: "Multi-Stablecoin",
    desc: "USDC, USDT, and USDG with custom token mint extensibility across regulated stablecoins.",
    tag: "Payments",
    span: "normal",
  },
  {
    title: "MPC Custody Compatible",
    desc: "Standard Solana signers — Fireblocks, Fordefi, and other MPC custody providers work out of the box. No protocol changes needed.",
    tag: "Institutional",
    span: "normal",
  },
  {
    title: "Permissionless Cranks",
    desc: "Anyone can trigger condition evaluations — no privileged operators. Autonomous crank bot included for hands-off settlement.",
    tag: "Automation",
    span: "normal",
  },
];

const steps = [
  {
    num: "01",
    title: "Create & Fund",
    desc: "Define payment terms, set conditions, and lock stablecoins in a program-owned escrow PDA.",
  },
  {
    num: "02",
    title: "Evaluate Conditions",
    desc: "On-chain conditions are cranked permissionlessly — time-locks, oracle prices, multisig, webhooks, token gates.",
  },
  {
    num: "03",
    title: "Release or Refund",
    desc: "When all conditions pass, funds release to the payee. If conditions aren't met by the expiry, the payer gets a full refund.",
  },
];

const pages = [
  { href: "/agreements", label: "Agreements", key: "A" },
  { href: "/milestones", label: "Milestones", key: "M" },
  { href: "/compliance", label: "KYC / AML", key: "K" },
  { href: "/relayers", label: "Relayers", key: "R" },
  { href: "/activity", label: "KYT Monitor", key: "T" },
  { href: "/audit", label: "Audit Log", key: "L" },
];

/* ─── page ─────────────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <main className="lp">
      {/* Ambient */}
      <div className="lp-glow lp-glow--a" aria-hidden="true" />
      <div className="lp-glow lp-glow--b" aria-hidden="true" />
      <div className="lp-noise" aria-hidden="true" />

      {/* Nav */}
      <header className="lp-nav">
        <span className="lp-logo">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M9 1L16.5 5.5V12.5L9 17L1.5 12.5V5.5L9 1Z" fill="#23c55e" />
          </svg>
          GherkinPay
        </span>
        <div className="lp-nav-links">
          <a href="https://github.com" className="lp-nav-link" target="_blank" rel="noopener">
            Docs
          </a>
          <Link className="lp-nav-cta" href="/agreements">
            Launch App
            <span className="lp-nav-cta-arrow">→</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-tag">
          <span className="lp-hero-tag-dot" />
          Built for StableHacks 2026 · Track 3: Institutional
        </div>

        <h1 className="lp-hero-title">
          Escrow that settles
          <br />
          <span className="lp-hero-title-em">on your terms.</span>
        </h1>

        <p className="lp-hero-sub">
          Condition-gated stablecoin payments with on-chain KYC enforcement,
          Pyth oracle triggers, milestone releases, and MPC custody support.
        </p>

        <div className="lp-hero-actions">
          <Link className="lp-btn lp-btn--primary" href="/agreements">
            Open Console
          </Link>
          <Link className="lp-btn lp-btn--ghost" href="/activity">
            KYT Monitor
          </Link>
        </div>

        {/* Evidence strip */}
        <div className="lp-evidence">
          {[
            ["6", "Condition Types"],
            ["3", "FX Pairs"],
            ["T-22", "KYC Enforcement"],
            ["3", "Stablecoins"],
            ["<1s", "Settlement"],
          ].map(([val, label]) => (
            <div className="lp-ev" key={label}>
              <span className="lp-ev-val">{val}</span>
              <span className="lp-ev-label">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="lp-section" id="how">
        <div className="lp-section-head">
          <span className="lp-section-tag">How It Works</span>
          <h2 className="lp-section-title">Three steps to trustless settlement</h2>
        </div>
        <div className="lp-steps">
          {steps.map((s, i) => (
            <div className="lp-step" key={s.num}>
              <span className="lp-step-num">{s.num}</span>
              <h3 className="lp-step-title">{s.title}</h3>
              <p className="lp-step-desc">{s.desc}</p>
              {i < steps.length - 1 && (
                <div className="lp-step-connector" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="lp-section" id="capabilities">
        <div className="lp-section-head">
          <span className="lp-section-tag">Capabilities</span>
          <h2 className="lp-section-title">Everything institutional payments need</h2>
        </div>
        <div className="lp-bento">
          {capabilities.map((c) => (
            <article
              key={c.title}
              className={`lp-card ${c.span === "wide" ? "lp-card--wide" : ""}`}
            >
              <div className="lp-card-head">
                <span className="lp-card-tag">{c.tag}</span>
              </div>
              <h3 className="lp-card-title">{c.title}</h3>
              <p className="lp-card-desc">{c.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Console */}
      <section className="lp-section" id="console">
        <div className="lp-section-head">
          <span className="lp-section-tag">Console</span>
          <h2 className="lp-section-title">Full institutional dashboard</h2>
        </div>
        <div className="lp-console">
          {pages.map((p) => (
            <Link key={p.href} className="lp-console-item" href={p.href}>
              <span className="lp-console-key">{p.key}</span>
              <span className="lp-console-label">{p.label}</span>
              <span className="lp-console-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-left">
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M9 1L16.5 5.5V12.5L9 17L1.5 12.5V5.5L9 1Z" fill="#23c55e" />
          </svg>
          <span>GherkinPay</span>
        </div>
        <span className="lp-footer-right">
          Solana · Anchor · Token-2022 · StableHacks 2026
        </span>
      </footer>
    </main>
  );
}
