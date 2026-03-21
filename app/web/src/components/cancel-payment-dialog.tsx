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
import { useCancelPayment } from "~/lib/mutations/cancel-payment";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CancelPaymentDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when open state should change */
  onOpenChange: (open: boolean) => void;
  /** PDA of the PaymentAgreement to cancel */
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * CancelPaymentDialog — confirmation dialog for cancelling a payment
 * and refunding USDC from escrow back to the payer.
 *
 * Displays:
 * - Refund amount (totalAmount - releasedAmount)
 * - Payer address receiving the refund
 * - TransactionStatus during processing
 *
 * Observability: surfaces Anchor errors (e.g. "invalid status") in
 * the TransactionStatus error display.
 */
export function CancelPaymentDialog({
  open,
  onOpenChange,
  paymentPDA,
  paymentDetails,
}: CancelPaymentDialogProps) {
  const cancelMutation = useCancelPayment();

  const refundAmount =
    paymentDetails.totalAmount - paymentDetails.releasedAmount;

  // Reset mutation state when dialog opens
  useEffect(() => {
    if (open) {
      cancelMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const canCancel =
    !cancelMutation.isPending && !cancelMutation.isSuccess;

  const handleCancel = useCallback(() => {
    console.log(
      "[GherkinPay] Cancel dialog: initiating cancel for payment:",
      paymentPDA.toBase58(),
    );
    cancelMutation.mutate({ paymentPDA });
  }, [cancelMutation, paymentPDA]);

  // Close dialog on success after a short delay
  useEffect(() => {
    if (cancelMutation.isSuccess && open) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [cancelMutation.isSuccess, open, onOpenChange]);

  // Map mutation state to TransactionStatus
  const txStatus = cancelMutation.isPending
    ? ("loading" as const)
    : cancelMutation.isSuccess
      ? ("success" as const)
      : cancelMutation.isError
        ? ("error" as const)
        : ("idle" as const);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        data-testid="cancel-payment-dialog"
      >
        <DialogHeader>
          <DialogTitle>Cancel Payment</DialogTitle>
          <DialogDescription>
            Cancel this payment agreement and refund USDC from escrow back to
            the payer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {/* Refund amount */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Refund Amount</span>
            <span className="font-medium">
              {formatUsdcAmount(refundAmount)} USDC
            </span>
          </div>

          {/* Total amount */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Agreement</span>
            <span className="text-xs text-muted-foreground">
              {formatUsdcAmount(paymentDetails.totalAmount)} USDC
            </span>
          </div>

          {/* Already released */}
          {paymentDetails.releasedAmount > 0n && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Already Released</span>
              <span className="text-xs text-yellow-400">
                {formatUsdcAmount(paymentDetails.releasedAmount)} USDC
                (non-refundable)
              </span>
            </div>
          )}

          {/* Type */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Type</span>
            <Badge variant="outline">
              {paymentDetails.isMilestone
                ? `Milestone (${paymentDetails.milestoneCount})`
                : "Simple"}
            </Badge>
          </div>

          <Separator />

          {/* Payer (refund recipient) */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Payer (refund to)</span>
            <span
              className="font-mono text-xs"
              title={paymentDetails.payer.toBase58()}
            >
              {truncateAddress(paymentDetails.payer.toBase58())}
            </span>
          </div>

          {/* Payee */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Payee</span>
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
          signature={cancelMutation.data?.signature}
          error={cancelMutation.error?.message ?? "Cancel transaction failed"}
        />

        <DialogFooter showCloseButton>
          <Button
            onClick={handleCancel}
            disabled={!canCancel}
            variant="destructive"
          >
            {cancelMutation.isPending
              ? "Cancelling…"
              : cancelMutation.isError
                ? "Retry"
                : "Cancel Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
