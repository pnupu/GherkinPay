"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAgreements, truncatePubkey, formatTokenAmount } from "~/lib/queries/agreements";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn } from "~/lib/utils";

/* ── status badge colors ──────────────── */

const STATUS_COLORS: Record<string, string> = {
  created: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

/* ── skeleton rows ────────────────────── */

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

/* ── main component ───────────────────── */

export function AgreementsClient() {
  const { connected } = useWallet();
  const { data: agreements, isLoading, error } = useAgreements();

  // State: disconnected
  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          Connect your wallet to view agreements
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the wallet button in the sidebar to get started.
        </p>
      </div>
    );
  }

  // State: error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-destructive">
          Failed to load agreements
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Payer</TableHead>
            <TableHead>Payee</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* State: loading */}
          {isLoading && <SkeletonRows />}

          {/* State: empty */}
          {!isLoading && agreements?.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No agreements found on-chain. Create a payment to get started.
              </TableCell>
            </TableRow>
          )}

          {/* State: populated */}
          {agreements?.map((agreement) => (
            <TableRow key={agreement.pubkey} className="cursor-pointer hover:bg-muted/50">
              <TableCell>
                <Link
                  href={`/agreements/${agreement.pubkey}`}
                  className="font-mono text-xs underline-offset-4 hover:underline"
                >
                  {truncatePubkey(agreement.pubkey)}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {truncatePubkey(agreement.payer)}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {truncatePubkey(agreement.payee)}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {agreement.isMilestone ? "Milestone" : "Simple"}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {formatTokenAmount({ toString: () => String(agreement.totalAmount) })}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn("text-xs capitalize", STATUS_COLORS[agreement.status])}
                >
                  {agreement.status}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(agreement.createdAt * 1000).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
