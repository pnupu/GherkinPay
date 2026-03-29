import Link from "next/link";

const protocolScenes = [
  {
    id: "A1",
    title: "Terms are fixed before release.",
    body: "Amount, expiry, signers, and external conditions are recorded before any stablecoin leaves the payer's wallet.",
  },
  {
    id: "B2",
    title: "Escrow holds the middle.",
    body: "Funds remain parked in program custody while time locks, oracle thresholds, token gates, and approvals resolve around them.",
  },
  {
    id: "C3",
    title: "Outcome follows the record.",
    body: "Once the condition tree passes, settlement is executed. If the deadline expires unmet, the refund path is still explicit.",
  },
];

const consoleRooms = [
  {
    href: "/agreements",
    index: "01",
    name: "Agreements",
    note: "Draft terms, counterparties, and release logic.",
  },
  {
    href: "/milestones",
    index: "02",
    name: "Milestones",
    note: "Break capital into verifiable phases.",
  },
  {
    href: "/compliance",
    index: "03",
    name: "Compliance",
    note: "Enforce allowlists and travel-rule payloads.",
  },
  {
    href: "/activity",
    index: "04",
    name: "Activity",
    note: "Watch settlement events and policy triggers.",
  },
  {
    href: "/audit",
    index: "05",
    name: "Audit Log",
    note: "Trace every state change without reconstruction.",
  },
  {
    href: "/relayers",
    index: "06",
    name: "Relayers",
    note: "Operate the external automation surface.",
  },
];

const ledgerFacts = [
  "Stablecoin escrow for counterparties that need terms settled before trust is assumed.",
  "Conditions can involve time, signatures, oracle prices, token possession, or webhooks.",
  "Drafting, observation, release, and audit live in the same operational surface.",
];

export default function Home() {
  return (
    <main className="lp">
      <div className="lp-ambient lp-ambient--north" aria-hidden="true" />
      <div className="lp-ambient lp-ambient--south" aria-hidden="true" />
      <div className="lp-grain" aria-hidden="true" />

      <header className="lp-nav">
        <Link className="lp-brand" href="/">
          <span className="lp-brand-mark" aria-hidden="true">
            ◆
          </span>
          <span>GherkinPay</span>
        </Link>

        <div className="lp-nav-actions">
          <Link className="lp-nav-link" href="/activity">
            Activity
          </Link>
          <Link className="lp-nav-link" href="/audit">
            Audit
          </Link>
          <Link className="lp-nav-cta" href="/agreements">
            Open Console
          </Link>
        </div>
      </header>

      <section className="lp-lead">
        <div className="lp-copy">
          <p className="lp-kicker">GherkinPay / settlement ledger</p>
          <h1 className="lp-title">
            Capital waits
            <br />
            until proof
            <br />
            arrives.
          </h1>
          <p className="lp-intro">
            GherkinPay is a condition-driven escrow surface for stablecoin
            settlements on Solana. Release logic is defined in advance, observed
            on-chain, and executed without improvisation.
          </p>

          <div className="lp-actions">
            <Link className="lp-button lp-button--primary" href="/agreements">
              Enter the console
            </Link>
            <Link className="lp-button lp-button--secondary" href="/milestones">
              Review milestone flows
            </Link>
          </div>
        </div>

        <aside className="lp-dossier" aria-label="Settlement sequence">
          <div className="lp-dossier-head">
            <span>Settlement record</span>
            <span>Solana / escrow / conditions</span>
          </div>

          <div className="lp-track">
            {[
              ["01", "Draft", "Payer writes terms and expiry windows."],
              ["02", "Fund", "Stablecoins move into program custody."],
              ["03", "Observe", "Conditions resolve without moving capital."],
              ["04", "Release", "Pass or refund is applied deterministically."],
            ].map(([step, label, text]) => (
              <div className="lp-track-row" key={step}>
                <span className="lp-track-step">{step}</span>
                <div>
                  <p className="lp-track-label">{label}</p>
                  <p className="lp-track-text">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lp-dossier-foot">
            <p>Condition inputs</p>
            <ul>
              <li>Oracle-triggered release windows</li>
              <li>Milestone-based payout sequencing</li>
              <li>Transfer-hook identity enforcement</li>
            </ul>
          </div>
        </aside>
      </section>

      <section className="lp-band" aria-label="Protocol summary">
        {ledgerFacts.map((fact) => (
          <p className="lp-band-line" key={fact}>
            {fact}
          </p>
        ))}
      </section>

      <section className="lp-scenes" aria-labelledby="lp-scenes-title">
        <div className="lp-section-copy">
          <h2 id="lp-scenes-title" className="lp-section-title">
            The protocol is closer to a signed process than a payment button.
          </h2>
          <p className="lp-section-text">
            A release can be staged, evidenced, and audited before either side
            is asked to trust the other. That is the point of the system, and
            the page should read like that system exists.
          </p>
        </div>

        <div className="lp-scene-grid">
          {protocolScenes.map((scene) => (
            <article className="lp-scene" key={scene.id}>
              <p className="lp-scene-id">{scene.id}</p>
              <h3 className="lp-scene-title">{scene.title}</h3>
              <p className="lp-scene-body">{scene.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-rooms" aria-labelledby="lp-rooms-title">
        <div className="lp-section-copy">
          <h2 id="lp-rooms-title" className="lp-section-title">
            Inside the app, each room maps to an operational job.
          </h2>
        </div>

        <div className="lp-room-list">
          {consoleRooms.map((room) => (
            <Link className="lp-room" href={room.href} key={room.href}>
              <span className="lp-room-index">{room.index}</span>
              <div className="lp-room-copy">
                <span className="lp-room-name">{room.name}</span>
                <span className="lp-room-note">{room.note}</span>
              </div>
              <span className="lp-room-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="lp-footer">
        <p>Condition-driven escrow for stablecoin settlement.</p>
        <p>Release logic stays visible before capital moves.</p>
      </footer>
    </main>
  );
}
