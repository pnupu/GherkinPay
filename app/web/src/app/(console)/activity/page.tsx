const events = [
  "PAY-4022 released after time condition passed",
  "Webhook confirmation matched event hash for PAY-4023",
  "Compliance entry updated for wallet 2QB...sra",
  "Oracle crank submitted for PAY-4021",
];

export default function ActivityPage() {
  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Activity</h1>
          <p className="page-subtitle">Recent settlement and condition evaluation events</p>
        </div>
      </header>

      <section className="panel">
        <h2 className="panel-title">Recent events</h2>
        <ul className="plain-list">
          {events.map((event) => (
            <li key={event}>{event}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
