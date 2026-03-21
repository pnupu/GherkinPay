"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
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
import { useFundPayment } from "~/lib/mutations/fund-payment";
import { getUsdcAta } from "~/lib/token";
import { getEscrowPDA } from "~/lib/pda";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FundPaymentDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when open state should change */
  onOpenChange: (open: boolean) => void;
  /** PDA of the PaymentAgreement to fund */
  paymentPDA: PublicKey;
  /** Payment details for display */
  paymentDetails: {
    payer: PublicKey;
    payee: PublicKey;
    totalAmount: bigint;
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
 * FundPaymentDialog — confirmation dialog for funding a Created payment.
 *
 * Displays:
 * - Payment amount, payer, payee, escrow address
 * - Payer's USDC balance check (insufficient balance warning)
 * - TransactionStatus during processing
 *
 * Observability: logs balance check result and fund action to console
 * with [GherkinPay] prefix.
 */
export function FundPaymentDialog({
  open,
  onOpenChange,
  paymentPDA,
  paymentDetails,
}: FundPaymentDialogProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const fundMutation = useFundPayment();

  const [balance, setBalance] = useState<bigint | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Derive addresses for display
  const payerAtaAddress = getUsdcAta(paymentDetails.payer).toBase58();
  const [escrowPDA] = getEscrowPDA(paymentPDA);
  const escrowAddress = escrowPDA.toBase58();

  // Fetch payer's USDC balance when dialog opens
  useEffect(() => {
    if (!open) return;

    // Reset state
    setBalance(null);
    setBalanceError(null);
    fundMutation.reset();

    const fetchBalance = async () => {
      setBalanceLoading(true);
      try {
        const ata = getUsdcAta(paymentDetails.payer);
        const accountInfo = await connection.getAccountInfo(ata);

        if (!accountInfo) {
          setBalanceError("No USDC token account found for this wallet.");
          console.log(
            "[GherkinPay] Fund dialog: payer ATA not found:",
            ata.toBase58()
          );
          setBalanceLoading(false);
          return;
        }

        const tokenBalance = await connection.getTokenAccountBalance(ata);
        const lamports = BigInt(tokenBalance.value.amount);
        setBalance(lamports);
        console.log(
          "[GherkinPay] Fund dialog: payer USDC balance:",
          formatUsdcAmount(lamports)
        );
      } catch (err) {
        setBalanceError("Failed to fetch USDC balance.");
        console.error("[GherkinPay] Fund dialog: balance fetch error:", err);
      } finally {
        setBalanceLoading(false);
      }
    };

    void fetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, paymentDetails.payer.toBase58(), connection]);

  const totalAmount = paymentDetails.totalAmount;
  const hasSufficientBalance =
    balance !== null && balance >= totalAmount;
  const canFund =
    !balanceError &&
    !balanceLoading &&
    hasSufficientBalance &&
    !fundMutation.isPending &&
    !fundMutation.isSuccess &&
    !!wallet.publicKey;

  // Handle fund action
  const handleFund = useCallback(() => {
    console.log(
      "[GherkinPay] Fund dialog: initiating fund for payment:",
      paymentPDA.toBase58()
    );
    fundMutation.mutate({ paymentPDA });
  }, [fundMutation, paymentPDA]);

  // Close dialog on success after a short delay
  useEffect(() => {
    if (fundMutation.isSuccess && open) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [fundMutation.isSuccess, open, onOpenChange]);

  // Map mutation state to TransactionStatus
  const txStatus = fundMutation.isPending
    ? ("loading" as const)
    : fundMutation.isSuccess
      ? ("success" as const)
      : fundMutation.isError
        ? ("error" as const)
        : ("idle" as const);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        data-testid="fund-payment-dialog"
      >
        <DialogHeader>
          <DialogTitle>Fund Payment</DialogTitle>
          <DialogDescription>
            Transfer USDC from your wallet into escrow to activate this payment
            agreement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {/* Amount */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-medium">
              {formatUsdcAmount(totalAmount)} USDC
            </span>
          </div>

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

          {/* Escrow */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Escrow</span>
            <span className="font-mono text-xs" title={escrowAddress}>
              {truncateAddress(escrowAddress)}
            </span>
          </div>

          {/* Payer ATA */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Source ATA</span>
            <span className="font-mono text-xs" title={payerAtaAddress}>
              {truncateAddress(payerAtaAddress)}
            </span>
          </div>

          <Separator />

          {/* Balance check */}
          <div className="rounded-lg border border-input p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Your USDC Balance</span>
              {balanceLoading && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  Checking…
                </span>
              )}
              {balance !== null && (
                <span
                  className={
                    hasSufficientBalance
                      ? "text-green-400 font-medium"
                      : "text-red-400 font-medium"
                  }
                >
                  {formatUsdcAmount(balance)} USDC
                </span>
              )}
            </div>

            {balanceError && (
              <p className="text-xs text-red-400">{balanceError}</p>
            )}

            {balance !== null && !hasSufficientBalance && (
              <p className="text-xs text-red-400">
                Insufficient balance. You need{" "}
                {formatUsdcAmount(totalAmount)} USDC but only have{" "}
                {formatUsdcAmount(balance)} USDC.
              </p>
            )}
          </div>
        </div>

        {/* Transaction status */}
        <TransactionStatus
          status={txStatus}
          signature={fundMutation.data?.signature}
          error={fundMutation.error?.message ?? "Fund transaction failed"}
        />

        <DialogFooter showCloseButton>
          <Button onClick={handleFund} disabled={!canFund}>
            {fundMutation.isPending
              ? "Funding…"
              : fundMutation.isError
                ? "Retry"
                : "Fund Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
