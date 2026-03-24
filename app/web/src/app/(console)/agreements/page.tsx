import { AgreementsClient } from "~/components/agreements-client";
import { CreatePaymentWizard } from "~/components/create-payment-wizard";

export default function AgreementsPage() {
  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Agreements</h1>
          <p className="page-subtitle">
            Programmable stablecoin escrow — condition-gated settlement
          </p>
        </div>
        <div className="topbar-actions">
          <CreatePaymentWizard />
        </div>
      </header>

      <AgreementsClient />
    </>
  );
}
