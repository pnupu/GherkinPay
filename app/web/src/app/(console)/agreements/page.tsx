import { api, HydrateClient } from "~/trpc/server";
import { CreatePaymentWizard } from "~/components/create-payment-wizard";

const agreements = [
  {
    id: "PAY-4021",
    counterparty: "Northline Trading",
    condition: "Oracle + Multisig",
    amount: "$52,000",
    state: "Awaiting oracle",
  },
  {
    id: "PAY-4022",
    counterparty: "Boreal Shipping",
    condition: "Time lock",
    amount: "$18,400",
    state: "Ready to release",
  },
  {
    id: "PAY-4023",
    counterparty: "Ridge Finance",
    condition: "Webhook + Token gate",
    amount: "$96,250",
    state: "Pending relayer",
  },
];

export default async function AgreementsPage() {
  const hello = await api.post.hello({ text: "from tRPC" });

  return (
    <HydrateClient>
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

      <section className="panel">
        <div className="panel-title-row">
          <h2 className="panel-title">Open agreements</h2>
          <span className="panel-note">{hello.greeting}</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Agreement</th>
                <th>Counterparty</th>
                <th>Condition</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {agreements.map((agreement) => (
                <tr key={agreement.id}>
                  <td>{agreement.id}</td>
                  <td>{agreement.counterparty}</td>
                  <td>{agreement.condition}</td>
                  <td>{agreement.amount}</td>
                  <td>{agreement.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </HydrateClient>
  );
}
