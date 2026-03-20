export default function RelayersPage() {
  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Relayers</h1>
          <p className="page-subtitle">
            Webhook attestation and oracle trigger workers
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="mb-2 text-lg font-medium text-muted-foreground">
            Relayer Management
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Relayer registration and management will be available in a future
            update.
          </p>
        </div>
      </section>
    </>
  );
}
