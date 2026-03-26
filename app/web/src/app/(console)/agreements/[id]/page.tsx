"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { usePaymentDetail, useConditions } from "~/lib/queries/conditions";
import { truncatePubkey, formatTokenAmount } from "~/lib/queries/agreements";
import { ConditionCard } from "~/components/condition-card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { MpcBadge } from "~/components/mpc-badge";

/* ── status badge colors ──────────────── */

const STATUS_COLORS: Record<string, string> = {
  created: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

/* ── loading skeleton ─────────────────── */

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-48" />
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-64" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/* ── main page component ──────────────── */

export default function AgreementDetailPage() {
  const params = useParams<{ id: string }>();
  const paymentPubkey = params.id;
  const { connected } = useWallet();

  const {
    data: payment,
    isLoading: paymentLoading,
    error: paymentError,
  } = usePaymentDetail(connected ? paymentPubkey : undefined);

  const {
    data: conditionAccounts,
    isLoading: conditionsLoading,
  } = useConditions(connected ? paymentPubkey : undefined);

  // Disconnected
  if (!connected) {
    return (
      <div className="space-y-6">
        <Link
          href="/agreements"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to agreements
        </Link>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            Connect your wallet to view agreement details
          </p>
        </div>
      </div>
    );
  }

  // Loading
  if (paymentLoading || conditionsLoading) {
    return (
      <div className="space-y-6">
        <Link
          href="/agreements"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to agreements
        </Link>
        <DetailSkeleton />
      </div>
    );
  }

  // Error / not found
  if (paymentError || !payment) {
    return (
      <div className="space-y-6">
        <Link
          href="/agreements"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to agreements
        </Link>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-destructive">
            {paymentError ? "Failed to load agreement" : "Agreement not found"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {paymentError?.message ?? `No on-chain account found for ${truncatePubkey(paymentPubkey)}`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Link
        href="/agreements"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to agreements
      </Link>

      {/* Payment header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">
            Agreement{" "}
            <span className="font-mono text-sm text-muted-foreground">
              {truncatePubkey(payment.pubkey)}
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {payment.isMilestone ? `Milestone (${payment.currentMilestone + 1}/${payment.milestoneCount})` : "Simple"}
            </Badge>
            <Badge
              variant="secondary"
              className={cn("text-xs capitalize", STATUS_COLORS[payment.status])}
            >
              {payment.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Payer</dt>
              <dd className="flex items-center gap-1.5 font-mono text-xs">
                {truncatePubkey(payment.payer)}
                <MpcBadge />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payee</dt>
              <dd className="flex items-center gap-1.5 font-mono text-xs">
                {truncatePubkey(payment.payee)}
                <MpcBadge />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Total Amount</dt>
              <dd className="font-mono">
                {formatTokenAmount({ toString: () => String(payment.totalAmount) })}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Released</dt>
              <dd className="font-mono">
                {formatTokenAmount({ toString: () => String(payment.releasedAmount) })}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Authority</dt>
              <dd className="flex items-center gap-1.5 font-mono text-xs">
                {truncatePubkey(payment.authority)}
                <MpcBadge />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Token Mint</dt>
              <dd className="font-mono text-xs">{truncatePubkey(payment.tokenMint)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="text-xs">
                {new Date(payment.createdAt * 1000).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payment ID</dt>
              <dd className="font-mono text-xs">{payment.paymentId}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Metadata URI</dt>
              <dd className="font-mono text-xs truncate">
                {payment.metadataUri?.startsWith("http") ? (
                  <a
                    href={payment.metadataUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                    title={payment.metadataUri}
                  >
                    {payment.metadataUri}
                  </a>
                ) : (
                  payment.metadataUri || "—"
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Condition accounts summary */}
      {(conditionAccounts?.length ?? 0) > 0 && (
        <div className="space-y-4">
          {conditionAccounts!.map((ca) => (
            <div key={ca.pubkey}>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-medium">
                  Milestone {ca.milestoneIndex}
                </h3>
                <Badge variant="outline" className="text-xs capitalize">
                  {ca.milestoneStatus}
                </Badge>
                <Badge variant="outline" className="text-xs uppercase">
                  {ca.operator}
                </Badge>
                {ca.isFinalized && (
                  <Badge variant="secondary" className="text-xs">
                    Finalized
                  </Badge>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ca.conditions.map((cond, idx) => (
                  <ConditionCard
                    key={`${ca.pubkey}-${idx}`}
                    condition={cond}
                    index={idx}
                    paymentPubkey={paymentPubkey}
                    conditionAccountPubkey={ca.pubkey}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No conditions */}
      {conditionAccounts?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <p className="text-muted-foreground">
            No conditions found for this agreement.
          </p>
        </div>
      )}
    </div>
  );
}
