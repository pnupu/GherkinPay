"use client";

import { useState, useMemo } from "react";
import { type PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMilestones } from "~/lib/queries/milestones";
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

const MILESTONE_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pending", variant: "outline" },
  active: { label: "Active", variant: "default" },
  released: { label: "Released", variant: "secondary" },
};

function formatAmount(lamports: { toNumber: () => number }): string {
  const amount = lamports.toNumber() / 1e6;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const TABLE_HEADS = [
  "Milestone",
  "Agreement",
  "Amount",
  "Status",
  "Conditions",
  "Operator",
  "Finalized",
] as const;

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          {TABLE_HEADS.map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-16" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default function MilestonesPage() {
  const { connected } = useWallet();
  const { data, isLoading, isError, error } = useMilestones();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    let items = [...data];
    if (statusFilter !== "all") {
      items = items.filter((m) => {
        const key = Object.keys(m.account.milestoneStatus)[0]!.toLowerCase();
        return key === statusFilter;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (m) =>
          `#${m.account.milestoneIndex + 1}`.includes(q) ||
          (m.parentPaymentId !== undefined && `#${m.parentPaymentId}`.includes(q)) ||
          m.parentPubkey.toBase58().toLowerCase().includes(q),
      );
    }
    return items;
  }, [data, statusFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    if (!data) return { all: 0, pending: 0, active: 0, released: 0 };
    const counts = { all: data.length, pending: 0, active: 0, released: 0 };
    for (const m of data) {
      const key = Object.keys(m.account.milestoneStatus)[0]!.toLowerCase() as keyof typeof counts;
      if (key in counts) counts[key]++;
    }
    return counts;
  }, [data]);

  const { page, setPage, totalPages, paginatedItems } = usePagination(filtered, 10);

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Milestones</h1>
          <p className="page-subtitle">Phased stablecoin disbursement tied to verifiable conditions</p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-title-row">
          <h2 className="panel-title">Milestone schedule</h2>
        </div>

        {connected && !isLoading && !isError && data && data.length > 0 && (
          <TableToolbar
            totalFiltered={filtered.length}
            totalAll={data.length}
            unit="milestone"
            search={{
              value: searchQuery,
              onChange: (v) => { setSearchQuery(v); setPage(1); },
              placeholder: "Search by index or agreement…",
            }}
            filters={{
              options: (["all", "pending", "active", "released"] as const).map(
                (s): FilterOption => ({
                  value: s,
                  label: s === "all" ? "All" : s,
                  count: statusCounts[s],
                }),
              ),
              value: statusFilter,
              onChange: (v) => { setStatusFilter(v); setPage(1); },
            }}
          />
        )}

        {!connected ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
            <p className="text-sm">
              Connect your wallet to view milestone schedules.
            </p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-destructive">
            <p className="text-sm">
              Failed to load milestones
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
                  paginatedItems.map(
                    ({ publicKey: accountKey, account, parentPaymentId, parentPubkey }) => {
                      const statusKey =
                        Object.keys(account.milestoneStatus)[0]!.toLowerCase();
                      const status = MILESTONE_STATUS_CONFIG[statusKey] ?? {
                        label: statusKey,
                        variant: "outline" as const,
                      };
                      const operatorKey =
                        Object.keys(account.operator)[0]!.toLowerCase();

                      return (
                        <TableRow key={accountKey.toBase58()}>
                          <TableCell className="font-medium">
                            #{account.milestoneIndex + 1}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {parentPaymentId !== undefined
                              ? `#${parentPaymentId.toString()}`
                              : truncatePubkey(parentPubkey)}
                          </TableCell>
                          <TableCell>{formatAmount(account.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{account.conditions.length}</TableCell>
                          <TableCell className="capitalize">
                            {operatorKey}
                          </TableCell>
                          <TableCell>
                            {account.isFinalized ? "Yes" : "No"}
                          </TableCell>
                        </TableRow>
                      );
                    },
                  )
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={TABLE_HEADS.length}
                      className="py-12 text-center text-muted-foreground"
                    >
                      No milestones found. Create a milestone-based payment
                      agreement to get started.
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
