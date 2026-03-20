"use client";

import { type PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAgreements } from "~/lib/queries/agreements";
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

function truncatePubkey(pubkey: PublicKey): string {
  const str = pubkey.toBase58();
  return `${str.slice(0, 4)}…${str.slice(-4)}`;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  created: { label: "Created", variant: "outline" },
  active: { label: "Active", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

function formatAmount(lamports: { toNumber: () => number }): string {
  const amount = lamports.toNumber() / 1e6;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const TABLE_HEADS = [
  "Agreement",
  "Counterparty",
  "Type",
  "Amount",
  "Status",
  "Created",
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

export default function AgreementsPage() {
  const { publicKey, connected } = useWallet();
  const { data, isLoading, isError, error } = useAgreements();

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Agreements</h1>
          <p className="page-subtitle">
            Condition engine settlement workspace
          </p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-secondary" type="button" disabled>
            Add condition
          </button>
          <button className="btn btn-primary" type="button" disabled>
            Create payment
          </button>
        </div>
      </header>

      <section className="panel">
        <div className="panel-title-row">
          <h2 className="panel-title">Open agreements</h2>
        </div>

        {!connected ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
            <p className="text-sm">
              Connect your wallet to view your payment agreements.
            </p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-destructive">
            <p className="text-sm">
              Failed to load agreements
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
                  data.map(({ publicKey: accountKey, account }) => {
                    const statusKey =
                      Object.keys(account.status)[0]!;
                    const status = STATUS_CONFIG[statusKey] ?? {
                      label: statusKey,
                      variant: "outline" as const,
                    };
                    const counterparty =
                      publicKey && account.payer.equals(publicKey)
                        ? account.payee
                        : account.payer;

                    return (
                      <TableRow key={accountKey.toBase58()}>
                        <TableCell className="font-medium">
                          #{account.paymentId.toNumber()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {truncatePubkey(counterparty)}
                        </TableCell>
                        <TableCell>
                          {account.isMilestone
                            ? `Milestone (${account.milestoneCount} phases)`
                            : "Simple"}
                        </TableCell>
                        <TableCell>
                          <span>{formatAmount(account.totalAmount)}</span>
                          {account.isMilestone && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({formatAmount(account.releasedAmount)} released)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(
                            account.createdAt.toNumber() * 1000,
                          ).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={TABLE_HEADS.length}
                      className="py-12 text-center text-muted-foreground"
                    >
                      No agreements found. Create your first payment agreement
                      to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </>
  );
}
