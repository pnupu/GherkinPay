const milestones = [
  { id: "M-01", agreement: "PAY-4021", amount: "$20,000", status: "Released" },
  { id: "M-02", agreement: "PAY-4021", amount: "$32,000", status: "Active" },
  { id: "M-03", agreement: "PAY-4023", amount: "$48,125", status: "Pending" },
];

export default function MilestonesPage() {
  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Milestones</h1>
          <p className="page-subtitle">Phase-by-phase release management</p>
        </div>
      </header>

      <section className="panel">
        <h2 className="panel-title">Milestone schedule</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Agreement</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((milestone) => (
                <tr key={milestone.id}>
                  <td>{milestone.id}</td>
                  <td>{milestone.agreement}</td>
                  <td>{milestone.amount}</td>
                  <td>{milestone.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
