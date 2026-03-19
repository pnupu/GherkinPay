const relayers = [
  { name: "Mainnet relay A", uptime: "99.96%", events: "41 today" },
  { name: "Webhook relay B", uptime: "99.81%", events: "26 today" },
  { name: "Oracle relay C", uptime: "99.90%", events: "34 today" },
];

export default function RelayersPage() {
  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Relayers</h1>
          <p className="page-subtitle">Webhook attestation and oracle trigger workers</p>
        </div>
      </header>

      <section className="panel">
        <h2 className="panel-title">Registered relayers</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Uptime</th>
                <th>Events processed</th>
              </tr>
            </thead>
            <tbody>
              {relayers.map((relayer) => (
                <tr key={relayer.name}>
                  <td>{relayer.name}</td>
                  <td>{relayer.uptime}</td>
                  <td>{relayer.events}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
