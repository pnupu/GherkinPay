/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import type { PublicKey } from "@solana/web3.js";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { useAnchorProgram } from "~/lib/anchor";
import { Pagination, usePagination } from "~/components/pagination";
import { FundPaymentDialog } from "~/components/fund-payment-dialog";
import { ReleasePaymentDialog } from "~/components/release-payment-dialog";
import { CancelPaymentDialog } from "~/components/cancel-payment-dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaymentRow {
  /** On-chain PDA for this payment agreement */
  pda: PublicKey;
  paymentId: string;
  payer: PublicKey;
  payee: PublicKey;
  tokenMint: PublicKey;
  totalAmount: bigint;
  releasedAmount: bigint;
  status: "created" | "active" | "completed" | "cancelled";
  isMilestone: boolean;
  milestoneCount: number;
  currentMilestone: number;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function formatUsdcAmount(lamports: bigint): string {
  const amount = Number(lamports) / 1_000_000;
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Extract the status string from the Anchor enum variant object. */
function parseStatus(
  statusObj: Record<string, unknown>
): PaymentRow["status"] {
  const key = Object.keys(statusObj)[0];
  if (
    key === "created" ||
    key === "active" ||
    key === "completed" ||
    key === "cancelled"
  ) {
    return key;
  }
  return "created";
}

const statusVariant: Record<
  PaymentRow["status"],
  "outline" | "default" | "secondary" | "destructive"
> = {
  created: "outline",
  active: "default",
  completed: "secondary",
  cancelled: "destructive",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AgreementsClient — client component that fetches on-chain PaymentAgreement
 * accounts and renders them in a table with action buttons.
 *
 * For payments with status "created", a "Fund" button is shown that opens
 * the FundPaymentDialog.
 */
export function AgreementsClient() {
  const { program } = useAnchorProgram();
  const wallet = useWallet();

  // Dialog state
  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(
    null
  );

  // Fetch all on-chain PaymentAgreement accounts
  const {
    data: agreements,
    isLoading,
    error,
  } = useQuery<PaymentRow[]>({
    queryKey: ["agreements"],
    queryFn: async () => {
      if (!program) throw new Error("Program not available");

      console.log("[GherkinPay] Fetching payment agreements…");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const accounts = await (program.account as any).paymentAgreement.all();
      console.log(
        "[GherkinPay] Fetched",
        accounts.length,
        "payment agreements"
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = accounts.map((acct: any) => ({
        pda: acct.publicKey,
        paymentId: acct.account.paymentId.toString(),
        payer: acct.account.payer,
        payee: acct.account.payee,
        tokenMint: acct.account.tokenMint,
        totalAmount: BigInt(acct.account.totalAmount.toString()),
        releasedAmount: BigInt(acct.account.releasedAmount.toString()),
        status: parseStatus(
          acct.account.status as unknown as Record<string, unknown>
        ),
        isMilestone: acct.account.isMilestone,
        milestoneCount: acct.account.milestoneCount,
        currentMilestone: acct.account.currentMilestone,
        createdAt: acct.account.createdAt.toNumber(),
      }));

      // Deduplicate by PDA — some RPC providers return duplicate accounts
      const seen = new Set<string>();
      return rows.filter((r: PaymentRow) => {
        const key = r.pda?.toBase58?.() ?? String(r.pda);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    enabled: !!program,
    refetchInterval: 30_000, // poll every 30s for on-chain updates
  });

  // Filter + sort
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const sorted = useMemo(
    () => {
      if (!agreements) return [];
      let filtered = [...agreements];
      if (statusFilter !== "all") {
        filtered = filtered.filter((a) => a.status === statusFilter);
      }
      return filtered.sort((a, b) => b.createdAt - a.createdAt);
    },
    [agreements, statusFilter]
  );

  const { page, setPage, totalPages, paginatedItems } = usePagination(sorted, 10);

  const statusCounts = useMemo(() => {
    if (!agreements) return { all: 0, created: 0, active: 0, completed: 0, cancelled: 0 };
    const counts = { all: agreements.length, created: 0, active: 0, completed: 0, cancelled: 0 };
    for (const a of agreements) {
      if (a.status in counts) counts[a.status as keyof typeof counts]++;
    }
    return counts;
  }, [agreements]);

  const handleFundClick = (payment: PaymentRow) => {
    setSelectedPayment(payment);
    setFundDialogOpen(true);
  };

  const handleReleaseClick = (payment: PaymentRow) => {
    setSelectedPayment(payment);
    setReleaseDialogOpen(true);
  };

  const handleCancelClick = (payment: PaymentRow) => {
    setSelectedPayment(payment);
    setCancelDialogOpen(true);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!wallet.publicKey) {
    return (
      <section className="panel">
        <div className="panel-title-row">
          <h2 className="panel-title">Open agreements</h2>
        </div>
        <p className="text-sm text-muted-foreground px-4 py-8 text-center">
          Connect your wallet to view payment agreements.
        </p>
      </section>
    );
  }

  if (!program) {
    return (
      <section className="panel">
        <div className="panel-title-row">
          <h2 className="panel-title">Open agreements</h2>
        </div>
        <p className="text-sm text-muted-foreground px-4 py-8 text-center">
          Initializing program…
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="panel">
        <div className="panel-title-row">
          <h2 className="panel-title">Open agreements</h2>
          <span className="panel-note">
            {isLoading
              ? "Loading…"
              : error
                ? "Error loading agreements"
                : `${sorted.length} agreement${sorted.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Status filter tabs */}
        {!isLoading && !error && agreements && agreements.length > 0 && (
          <div className="flex gap-1 mt-3 mb-1">
            {(["all", "created", "active", "completed", "cancelled"] as const).map((status) => {
              const count = statusCounts[status];
              const isActive = statusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setPage(1); }}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  {status === "all" ? "All" : status}
                  {count > 0 && (
                    <span className={`ml-1.5 tabular-nums ${isActive ? "text-primary/70" : "text-muted-foreground/60"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 px-4 py-2">
            {error instanceof Error ? error.message : "Failed to load agreements"}
          </p>
        )}

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Payer</th>
                <th>Payee</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-8">
                    No payment agreements found. Create one to get started.
                  </td>
                </tr>
              )}

              {paginatedItems.map((payment, i) => (
                <tr key={payment.pda?.toBase58?.() ?? `row-${i}`} className="cursor-pointer hover:bg-white/5">
                  <td className="font-mono text-xs">
                    <Link href={`/agreements/${String(payment.pda)}`} className="hover:underline">
                      #{payment.paymentId}
                    </Link>
                  </td>
                  <td
                    className="font-mono text-xs"
                    title={String(payment.payer)}
                  >
                    {truncateAddress(String(payment.payer))}
                  </td>
                  <td
                    className="font-mono text-xs"
                    title={String(payment.payee)}
                  >
                    {truncateAddress(String(payment.payee))}
                  </td>
                  <td>
                    {payment.isMilestone
                      ? `Milestone (${payment.milestoneCount})`
                      : "Simple"}
                  </td>
                  <td>{formatUsdcAmount(payment.totalAmount)} USDC</td>
                  <td>
                    <Badge variant={statusVariant[payment.status]}>
                      {payment.status.charAt(0).toUpperCase() +
                        payment.status.slice(1)}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {payment.status === "created" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFundClick(payment)}
                        >
                          Fund
                        </Button>
                      )}
                      {payment.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReleaseClick(payment)}
                        >
                          Release
                        </Button>
                      )}
                      {(payment.status === "created" ||
                        payment.status === "active") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleCancelClick(payment)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </section>

      {/* Fund Payment Dialog */}
      {selectedPayment && (
        <FundPaymentDialog
          open={fundDialogOpen}
          onOpenChange={(open) => {
            setFundDialogOpen(open);
            if (!open) setSelectedPayment(null);
          }}
          paymentPDA={selectedPayment.pda}
          paymentDetails={{
            payer: selectedPayment.payer,
            payee: selectedPayment.payee,
            totalAmount: selectedPayment.totalAmount,
            tokenMint: selectedPayment.tokenMint,
            isMilestone: selectedPayment.isMilestone,
            milestoneCount: selectedPayment.milestoneCount,
          }}
        />
      )}

      {/* Release Payment Dialog */}
      {selectedPayment && (
        <ReleasePaymentDialog
          open={releaseDialogOpen}
          onOpenChange={(open) => {
            setReleaseDialogOpen(open);
            if (!open) setSelectedPayment(null);
          }}
          paymentPDA={selectedPayment.pda}
          paymentDetails={{
            payer: selectedPayment.payer,
            payee: selectedPayment.payee,
            totalAmount: selectedPayment.totalAmount,
            releasedAmount: selectedPayment.releasedAmount,
            tokenMint: selectedPayment.tokenMint,
            isMilestone: selectedPayment.isMilestone,
            milestoneCount: selectedPayment.milestoneCount,
            currentMilestone: selectedPayment.currentMilestone,
          }}
        />
      )}

      {/* Cancel Payment Dialog */}
      {selectedPayment && (
        <CancelPaymentDialog
          open={cancelDialogOpen}
          onOpenChange={(open) => {
            setCancelDialogOpen(open);
            if (!open) setSelectedPayment(null);
          }}
          paymentPDA={selectedPayment.pda}
          paymentDetails={{
            payer: selectedPayment.payer,
            payee: selectedPayment.payee,
            totalAmount: selectedPayment.totalAmount,
            releasedAmount: selectedPayment.releasedAmount,
            tokenMint: selectedPayment.tokenMint,
            isMilestone: selectedPayment.isMilestone,
            milestoneCount: selectedPayment.milestoneCount,
          }}
        />
      )}
    </>
  );
}
