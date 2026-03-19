const complianceEntries = [
  { wallet: "F7X...Lpm", status: "Allowed", updated: "2 min ago" },
  { wallet: "8Ge...eQj", status: "Allowed", updated: "9 min ago" },
  { wallet: "2QB...sra", status: "Blocked", updated: "27 min ago" },
];

export default function CompliancePage() {
  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Compliance</h1>
          <p className="page-subtitle">Token-2022 transfer hook allowlist status</p>
        </div>
      </header>

      <section className="panel">
        <h2 className="panel-title">Wallet policy entries</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Wallet</th>
                <th>Status</th>
                <th>Last update</th>
              </tr>
            </thead>
            <tbody>
              {complianceEntries.map((entry) => (
                <tr key={entry.wallet}>
                  <td>{entry.wallet}</td>
                  <td>{entry.status}</td>
                  <td>{entry.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
