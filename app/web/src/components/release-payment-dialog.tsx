"use client";

import { useCallback, useEffect } from "react";
import type { PublicKey } from "@solana/web3.js";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { TransactionStatus } from "~/components/transaction-status";
import { useReleasePayment } from "~/lib/mutations/release-payment";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReleasePaymentDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when open state should change */
  onOpenChange: (open: boolean) => void;
  /** PDA of the PaymentAgreement to release */
  paymentPDA: PublicKey;
  /** Payment details for display */
  paymentDetails: {
    payer: PublicKey;
    payee: PublicKey;
    totalAmount: bigint;
    releasedAmount: bigint;
    tokenMint: PublicKey;
    isMilestone: boolean;
    milestoneCount: number;
    currentMilestone: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

function formatUsdcAmount(lamports: bigint): string {
  const amount = Number(lamports) / 1_000_000;
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

/**
 * For milestone payments, the per-milestone amount is totalAmount / milestoneCount.
 * For simple payments, it's the full totalAmount.
 */
function getReleaseAmount(details: ReleasePaymentDialogProps["paymentDetails"]): bigint {
  if (details.isMilestone && details.milestoneCount > 0) {
    return details.totalAmount / BigInt(details.milestoneCount);
  }
  return details.totalAmount;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ReleasePaymentDialog — confirmation dialog for releasing funds from an
 * Active payment whose conditions are met.
 *
 * Displays:
 * - Payment amount to release (per-milestone or total)
 * - For milestone payments: "Releasing milestone X of Y"
 * - Payee address receiving the funds
 * - TransactionStatus during processing
 *
 * Observability: surfaces Anchor errors (e.g. "conditions not met") in
 * the TransactionStatus error display.
 */
export function ReleasePaymentDialog({
  open,
  onOpenChange,
  paymentPDA,
  paymentDetails,
}: ReleasePaymentDialogProps) {
  const releaseMutation = useReleasePayment();

  const releaseAmount = getReleaseAmount(paymentDetails);

  // Reset mutation state when dialog opens
  useEffect(() => {
    if (open) {
      releaseMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const canRelease =
    !releaseMutation.isPending && !releaseMutation.isSuccess;

  const handleRelease = useCallback(() => {
    console.log(
      "[GherkinPay] Release dialog: initiating release for payment:",
      paymentPDA.toBase58(),
    );
    releaseMutation.mutate({ paymentPDA });
  }, [releaseMutation, paymentPDA]);

  // Close dialog on success after a short delay
  useEffect(() => {
    if (releaseMutation.isSuccess && open) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [releaseMutation.isSuccess, open, onOpenChange]);

  // Map mutation state to TransactionStatus
  const txStatus = releaseMutation.isPending
    ? ("loading" as const)
    : releaseMutation.isSuccess
      ? ("success" as const)
      : releaseMutation.isError
        ? ("error" as const)
        : ("idle" as const);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        data-testid="release-payment-dialog"
      >
        <DialogHeader>
          <DialogTitle>Release Payment</DialogTitle>
          <DialogDescription>
            {paymentDetails.isMilestone
              ? `Release milestone ${paymentDetails.currentMilestone + 1} of ${paymentDetails.milestoneCount} — transfer USDC from escrow to the payee.`
              : "Release funds from escrow to the payee. Conditions must be met."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {/* Release amount */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Release Amount</span>
            <span className="font-medium">
              {formatUsdcAmount(releaseAmount)} USDC
            </span>
          </div>

          {/* Type */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Type</span>
            <Badge variant="outline">
              {paymentDetails.isMilestone
                ? `Milestone ${paymentDetails.currentMilestone + 1} of ${paymentDetails.milestoneCount}`
                : "Simple"}
            </Badge>
          </div>

          {/* Total amount (for milestone context) */}
          {paymentDetails.isMilestone && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Agreement</span>
              <span className="text-xs text-muted-foreground">
                {formatUsdcAmount(paymentDetails.totalAmount)} USDC
              </span>
            </div>
          )}

          {/* Already released */}
          {paymentDetails.releasedAmount > 0n && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Already Released</span>
              <span className="text-xs text-muted-foreground">
                {formatUsdcAmount(paymentDetails.releasedAmount)} USDC
              </span>
            </div>
          )}

          <Separator />

          {/* Payer */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Payer</span>
            <span
              className="font-mono text-xs"
              title={paymentDetails.payer.toBase58()}
            >
              {truncateAddress(paymentDetails.payer.toBase58())}
            </span>
          </div>

          {/* Payee (recipient) */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Payee (recipient)</span>
            <span
              className="font-mono text-xs"
              title={paymentDetails.payee.toBase58()}
            >
              {truncateAddress(paymentDetails.payee.toBase58())}
            </span>
          </div>
        </div>

        {/* Transaction status */}
        <TransactionStatus
          status={txStatus}
          signature={releaseMutation.data?.signature}
          error={releaseMutation.error?.message ?? "Release transaction failed"}
        />

        <DialogFooter showCloseButton>
          <Button onClick={handleRelease} disabled={!canRelease}>
            {releaseMutation.isPending
              ? "Releasing…"
              : releaseMutation.isError
                ? "Retry"
                : "Release Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
