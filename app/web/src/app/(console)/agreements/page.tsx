import { AgreementsClient } from "~/components/agreements-client";
import { CreatePaymentWizard } from "~/components/create-payment-wizard";

export default function AgreementsPage() {
  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Agreements</h1>
          <p className="page-subtitle">Condition engine settlement workspace</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-secondary" type="button">
            Add condition
          </button>
          <CreatePaymentWizard />
        </div>
      </header>

      <AgreementsClient />
    </>
  );
}
