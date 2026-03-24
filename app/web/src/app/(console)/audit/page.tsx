"use client";

import { useState, useMemo } from "react";
import { type PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  useComplianceAuditLog,
  COMPLIANCE_EVENTS,
} from "~/lib/queries/audit-log";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Pagination, usePagination } from "~/components/pagination";
import { TableToolbar, type FilterOption } from "~/components/table-toolbar";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncatePubkey(pubkey: PublicKey | string): string {
  const str = typeof pubkey === "string" ? pubkey : pubkey.toBase58();
  return `${str.slice(0, 4)}…${str.slice(-4)}`;
}

function truncateSignature(sig: string): string {
  return `${sig.slice(0, 4)}…${sig.slice(-4)}`;
}

function formatTime(blockTime: number | null): string {
  if (blockTime === null) return "Unknown";
  const now = Date.now() / 1000;
  const diff = Math.max(0, Math.floor(now - blockTime));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ---------------------------------------------------------------------------
// Details column — context-dependent rendering per event type
// ---------------------------------------------------------------------------

function renderDetails(
  name: string,
  data: Record<string, unknown>,
): React.ReactNode {
  switch (name) {
    case "PaymentCreated": {
      const uri = data.metadata_uri;
      if (typeof uri === "string" && uri.length > 0) {
        return (
          <span title={uri}>
            {uri.length > 32 ? `${uri.slice(0, 29)}…` : uri}
          </span>
        );
      }
      return "—";
    }

    case "MultisigApproval": {
      const signer =
        typeof data.signer === "string"
          ? truncatePubkey(data.signer)
          : undefined;
      const approvals = data.approvals_count;
      const threshold = data.threshold;
      if (signer && approvals !== undefined && threshold !== undefined) {
        return (
          <>
            {signer}{" "}
            <span className="text-muted-foreground">
              ({Number(approvals)}/{Number(threshold)})
            </span>
          </>
        );
      }
      if (signer) return signer;
      return "—";
    }

    case "PaymentReleased":
    case "PaymentFunded": {
      const amount = data.amount;
      if (amount !== undefined) return `${Number(amount)} lamports`;
      return "—";
    }

    case "ConditionMet": {
      const condType = data.condition_type;
      if (typeof condType === "string") return condType;
      return "—";
    }

    case "PaymentCancelled": {
      const refund = data.refund_amount;
      if (refund !== undefined) return `Refund: ${Number(refund)} lamports`;
      return "—";
    }

    case "MilestoneAdvanced": {
      const completed = data.completed_index;
      const next = data.next_index;
      if (completed !== undefined && next !== undefined) {
        return `${Number(completed)} → ${Number(next)}`;
      }
      return "—";
    }

    default:
      return "—";
  }
}

// ---------------------------------------------------------------------------
// Table skeleton
// ---------------------------------------------------------------------------

const TABLE_HEADS = [
  "Time",
  "Event",
  "Details",
  "Payment",
  "Signature",
] as const;

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          {TABLE_HEADS.map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-20" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AuditPage() {
  const { connected } = useWallet();
  const { data, isLoading, isError, error } = useComplianceAuditLog();
  const [eventFilter, setEventFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Derive event name counts for filter pills
  const eventCounts = useMemo(() => {
    if (!data) return { all: 0 } as Record<string, number>;
    const counts: Record<string, number> = { all: data.length };
    for (const e of data) {
      counts[e.name] = (counts[e.name] ?? 0) + 1;
    }
    return counts;
  }, [data]);

  // Filtered data: event filter + search
  const filteredData = useMemo(() => {
    let items = data ?? [];
    if (eventFilter !== "all") {
      items = items.filter((e) => e.name === eventFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.signature.toLowerCase().includes(q),
      );
    }
    return items;
  }, [data, eventFilter, searchQuery]);

  const { page, setPage, totalPages, paginatedItems } = usePagination(
    filteredData,
    10,
  );

  // Build filter options from the COMPLIANCE_EVENTS allowlist
  const filterOptions: FilterOption[] = useMemo(
    () => [
      { value: "all", label: "All", count: eventCounts.all },
      ...COMPLIANCE_EVENTS.map(
        (name): FilterOption => ({
          value: name,
          label: name.replace(/([A-Z])/g, " $1").trim(),
          count: eventCounts[name] ?? 0,
        }),
      ),
    ],
    [eventCounts],
  );

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">AML Audit Log</h1>
          <p className="page-subtitle">
            Anti-money-laundering event trail — filterable compliance record
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-title-row">
          <h2 className="panel-title">Compliance events</h2>
        </div>

        {connected && !isLoading && !isError && data && data.length > 0 && (
          <TableToolbar
            totalFiltered={filteredData.length}
            totalAll={data.length}
            unit="event"
            search={{
              value: searchQuery,
              onChange: (v) => {
                setSearchQuery(v);
                setPage(1);
              },
              placeholder: "Search by event or signature…",
            }}
            filters={{
              options: filterOptions,
              value: eventFilter,
              onChange: (v) => {
                setEventFilter(v);
                setPage(1);
              },
            }}
          />
        )}

        {!connected ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
            <p className="text-sm">
              Connect your wallet to view the compliance audit log.
            </p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-destructive">
            <p className="text-sm">
              Failed to load audit log
              {error instanceof Error ? `: ${error.message}` : "."}
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <Table>
              <TableHeader>
                <TableRow>
                  {TABLE_HEADS.map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <SkeletonRows />
                ) : data && data.length > 0 ? (
                  paginatedItems.map((event, idx) => (
                    <TableRow key={`${event.signature}-${event.name}-${idx}`}>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatTime(event.blockTime)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{event.name}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {renderDetails(event.name, event.data)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {event.data.payment
                          ? truncatePubkey(
                              event.data.payment as unknown as PublicKey,
                            )
                          : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {truncateSignature(event.signature)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={TABLE_HEADS.length}
                      className="py-12 text-center text-muted-foreground"
                    >
                      No compliance events found. Events appear when
                      compliance-relevant transactions are executed on-chain.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </section>
    </>
  );
}
