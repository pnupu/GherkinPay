import { AgreementsClient } from "~/components/agreements-client";

export default function AgreementsPage() {
  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Agreements</h1>
          <p className="page-subtitle">Condition engine settlement workspace</p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-title-row">
          <h2 className="panel-title">On-chain agreements</h2>
        </div>
        <AgreementsClient />
      </section>
    </>
  );
}
