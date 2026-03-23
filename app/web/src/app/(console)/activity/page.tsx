"use client";

import { useState, useMemo } from "react";
import { type PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useActivityFeed } from "~/lib/queries/activity";
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

function truncatePubkey(pubkey: PublicKey): string {
  const str = pubkey.toBase58();
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

const TABLE_HEADS = ["Time", "Event", "Payment", "Signature"] as const;

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

export default function ActivityPage() {
  const { connected } = useWallet();
  const { data, isLoading, isError, error } = useActivityFeed();
  const [eventFilter, setEventFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Derive unique event names for filter pills
  const eventNames = useMemo(() => {
    if (!data) return [] as string[];
    const names = new Set<string>();
    for (const e of data) names.add(e.name);
    return Array.from(names).sort();
  }, [data]);

  const eventCounts = useMemo(() => {
    if (!data) return { all: 0 } as Record<string, number>;
    const counts: Record<string, number> = { all: data.length };
    for (const e of data) {
      counts[e.name] = (counts[e.name] ?? 0) + 1;
    }
    return counts;
  }, [data]);

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

  const { page, setPage, totalPages, paginatedItems } = usePagination(filteredData, 10);

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Activity</h1>
          <p className="page-subtitle">
            Recent settlement and condition evaluation events
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-title-row">
          <h2 className="panel-title">Recent events</h2>
        </div>

        {connected && !isLoading && !isError && data && data.length > 0 && (
          <TableToolbar
            totalFiltered={filteredData.length}
            totalAll={data.length}
            unit="event"
            search={{
              value: searchQuery,
              onChange: (v) => { setSearchQuery(v); setPage(1); },
              placeholder: "Search by event or signature…",
            }}
            filters={eventNames.length > 1 ? {
              options: [
                { value: "all", label: "All", count: eventCounts.all },
                ...eventNames.map((n): FilterOption => ({
                  value: n,
                  label: n.replace(/([A-Z])/g, " $1").trim(),
                  count: eventCounts[n] ?? 0,
                })),
              ],
              value: eventFilter,
              onChange: (v) => { setEventFilter(v); setPage(1); },
            } : undefined}
          />
        )}

        {!connected ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
            <p className="text-sm">
              Connect your wallet to view activity events.
            </p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-destructive">
            <p className="text-sm">
              Failed to load activity events
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
                      No activity events found. Events appear when payment
                      transactions are executed on-chain.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </section>
    </>
  );
}
