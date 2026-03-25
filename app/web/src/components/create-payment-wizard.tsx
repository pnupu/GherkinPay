"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Badge } from "~/components/ui/badge";

import {
  ConditionBuilder,
  type ConditionBuilderValue,
  type ConditionFormValue,
} from "~/components/condition-builder";
import { TransactionStatus } from "~/components/transaction-status";
import {
  useCreatePayment,
  type ConditionInput,
  type MilestoneInput,
} from "~/lib/mutations/create-payment";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Known token mints — displayed as selectable presets. */
const TOKEN_PRESETS = [
  { symbol: "USDC", label: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
  { symbol: "USDT", label: "USDT", mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" },
  { symbol: "USDG", label: "USDG", mint: "2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH" },
  { symbol: "custom", label: "Custom…", mint: "" },
] as const;

// Default to first token
const DEFAULT_TOKEN_SYMBOL = TOKEN_PRESETS[0].symbol;

const DEFAULT_CONDITION_VALUE: ConditionBuilderValue = {
  operator: "and",
  conditions: [{ type: "timeBased", unlockAt: "" }],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidPublicKey(value: string): boolean {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

/** Convert a ConditionFormValue (from the builder Zod schema) to a ConditionInput (for the mutation). */
function toConditionInput(c: ConditionFormValue): ConditionInput {
  switch (c.type) {
    case "timeBased":
      return {
        type: "timeBased",
        unlockAt: new BN(Math.floor(new Date(c.unlockAt).getTime() / 1000)),
      };
    case "multisig":
      return {
        type: "multisig",
        signers: c.signers.map((s) => new PublicKey(s.address)),
        threshold: c.threshold,
      };
    case "oracle":
      {
        const isHex = /^[0-9a-fA-F]{64}$/.test(c.feedAccount);
        const feedAccount = isHex
          ? new PublicKey(Buffer.from(c.feedAccount, "hex"))
          : new PublicKey(c.feedAccount);
        return {
          type: "oracle",
          feedAccount,
          operator: c.operator,
          targetValue: new BN(c.targetValue),
          decimals: c.decimals,
        };
      }
    case "webhook": {
      const bytes = c.eventHash.match(/.{2}/g)!.map((b) => parseInt(b, 16));
      return {
        type: "webhook",
        relayer: new PublicKey(c.relayer),
        eventHash: bytes,
      };
    }
    case "tokenGated":
      return {
        type: "tokenGated",
        requiredMint: new PublicKey(c.requiredMint),
        minAmount: new BN(c.minAmount),
        holder: new PublicKey(c.holder),
      };
  }
}

/** Format a condition type for display. */
function conditionTypeLabel(type: ConditionFormValue["type"]): string {
  const labels: Record<ConditionFormValue["type"], string> = {
    timeBased: "Time-Based",
    multisig: "Multisig",
    oracle: "Oracle",
    webhook: "Webhook",
    tokenGated: "Token-Gated",
  };
  return labels[type];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreatePaymentWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<"simple" | "milestone">("simple");
  const wallet = useWallet();
  const walletModal = useWalletModal();
  const mutation = useCreatePayment();

  // Step 1 fields
  const [payeeWallet, setPayeeWallet] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [metadataUri, setMetadataUri] = useState("");
  const [selectedToken, setSelectedToken] = useState<string>(DEFAULT_TOKEN_SYMBOL);
  const [customMint, setCustomMint] = useState("");
  const [milestoneCount, setMilestoneCount] = useState(2);
  const [milestoneAmounts, setMilestoneAmounts] = useState<string[]>(["", ""]);

  // Step 2 fields — simple mode gets one builder, milestone mode gets one per milestone
  const [simpleConditions, setSimpleConditions] =
    useState<ConditionBuilderValue>(DEFAULT_CONDITION_VALUE);
  const [simpleConditionsValid, setSimpleConditionsValid] = useState(false);

  // Expose condition validity setter for E2E testing (always expose in dev)
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as unknown as Record<string, unknown>).__TEST_WIZARD = {
        setConditionsValid: (valid: boolean) => setSimpleConditionsValid(valid),
      };
      return () => { delete (window as unknown as Record<string, unknown>).__TEST_WIZARD; };
    }
  }, []);

  const [milestoneConditions, setMilestoneConditions] = useState<
    ConditionBuilderValue[]
  >([DEFAULT_CONDITION_VALUE, DEFAULT_CONDITION_VALUE]);
  const [milestoneConditionsValid, setMilestoneConditionsValid] = useState<
    boolean[]
  >([false, false]);
  const [activeMilestoneTab, setActiveMilestoneTab] = useState("0");

  // Reset the wizard when dialog opens/closes
  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setStep(1);
      setMode("simple");
      setPayeeWallet("");
      setTotalAmount("");
      setMetadataUri("");
      setSelectedToken(DEFAULT_TOKEN_SYMBOL);
      setCustomMint("");
      setMilestoneCount(2);
      setMilestoneAmounts(["", ""]);
      setSimpleConditions(DEFAULT_CONDITION_VALUE);
      setSimpleConditionsValid(false);
      setMilestoneConditions([
        DEFAULT_CONDITION_VALUE,
        DEFAULT_CONDITION_VALUE,
      ]);
      setMilestoneConditionsValid([false, false]);
      setActiveMilestoneTab("0");
      mutation.reset();
    }
  }, [mutation]);

  // Milestone count change — resize arrays
  const handleMilestoneCountChange = useCallback(
    (count: number) => {
      setMilestoneCount(count);
      setMilestoneAmounts((prev) => {
        const next = [...prev];
        while (next.length < count) next.push("");
        return next.slice(0, count);
      });
      setMilestoneConditions((prev) => {
        const next = [...prev];
        while (next.length < count) next.push(DEFAULT_CONDITION_VALUE);
        return next.slice(0, count);
      });
      setMilestoneConditionsValid((prev) => {
        const next = [...prev];
        while (next.length < count) next.push(false);
        return next.slice(0, count);
      });
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const payerWalletAddress = wallet.publicKey?.toBase58() ?? "";
  const totalAmountNum = parseFloat(totalAmount);
  const totalAmountValid = !isNaN(totalAmountNum) && totalAmountNum > 0;

  /** Resolve the active token mint address. */
  const resolvedMint = useMemo(() => {
    const preset = TOKEN_PRESETS.find((t) => t.symbol === selectedToken);
    if (!preset || preset.symbol === "custom") return customMint;
    return preset.mint;
  }, [selectedToken, customMint]);

  const tokenMintValid = isValidPublicKey(resolvedMint);

  /** Resolved token label for display in review. */
  const tokenLabel = useMemo(() => {
    const preset = TOKEN_PRESETS.find((t) => t.symbol === selectedToken);
    if (!preset || preset.symbol === "custom") return "Custom";
    return preset.label;
  }, [selectedToken]);

  const milestoneSumValid = useMemo(() => {
    if (mode !== "milestone") return true;
    const sum = milestoneAmounts.reduce(
      (acc, val) => acc + (parseFloat(val) || 0),
      0
    );
    // Allow small floating-point tolerance
    return Math.abs(sum - totalAmountNum) < 0.01;
  }, [mode, milestoneAmounts, totalAmountNum]);

  const milestoneAmountsAllValid = useMemo(() => {
    if (mode !== "milestone") return true;
    return milestoneAmounts.every((a) => {
      const n = parseFloat(a);
      return !isNaN(n) && n > 0;
    });
  }, [mode, milestoneAmounts]);

  const step1Valid =
    isValidPublicKey(payeeWallet) &&
    totalAmountValid &&
    tokenMintValid &&
    (mode === "simple" ||
      (milestoneAmountsAllValid && milestoneSumValid));

  const step2Valid =
    mode === "simple"
      ? simpleConditionsValid
      : milestoneConditionsValid.every(Boolean);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    if (!wallet.publicKey) return;

    const tokenMint = new PublicKey(resolvedMint);
    const payee = new PublicKey(payeeWallet);
    // Convert to lamports (USDC has 6 decimals)
    const totalBN = new BN(Math.round(totalAmountNum * 1_000_000));

    if (mode === "simple") {
      mutation.mutate({
        totalAmount: totalBN,
        payerWallet: wallet.publicKey,
        payee,
        tokenMint,
        isMilestone: false,
        operator: simpleConditions.operator,
        conditions: simpleConditions.conditions.map(toConditionInput),
        metadataUri,
      });
    } else {
      const milestones: MilestoneInput[] = milestoneConditions.map(
        (mc, i) => ({
          amount: new BN(
            Math.round((parseFloat(milestoneAmounts[i]!) || 0) * 1_000_000)
          ),
          operator: mc.operator,
          conditions: mc.conditions.map(toConditionInput),
        })
      );
      mutation.mutate({
        totalAmount: totalBN,
        payerWallet: wallet.publicKey,
        payee,
        tokenMint,
        isMilestone: true,
        operator: "and", // top-level operator for milestone payments
        conditions: [], // conditions live inside milestones
        milestones,
        metadataUri,
      });
    }
  }, [
    wallet.publicKey,
    payeeWallet,
    totalAmountNum,
    mode,
    resolvedMint,
    simpleConditions,
    milestoneConditions,
    milestoneAmounts,
    metadataUri,
    mutation,
  ]);

  // Close dialog on success after a short delay
  const txStatus = mutation.isPending
    ? "loading" as const
    : mutation.isSuccess
      ? "success" as const
      : mutation.isError
        ? "error" as const
        : "idle" as const;

  const lastSignature = mutation.data?.signatures.at(-1);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="btn btn-primary">
          Create payment
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-2xl max-h-[85vh] overflow-y-auto"
        data-testid="create-payment-wizard"
      >
        <DialogHeader>
          <DialogTitle>Create Payment Agreement</DialogTitle>
          <DialogDescription>
            Step {step} of 3 —{" "}
            {step === 1
              ? "Payment Details"
              : step === 2
                ? "Conditions"
                : "Review & Submit"}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 px-1">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex size-7 items-center justify-center rounded-full text-xs font-medium ${
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : s < step
                      ? "bg-green-700/30 text-green-400"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? "✓" : s}
              </div>
              {s < 3 && (
                <div
                  className={`h-px w-8 ${
                    s < step ? "bg-green-700/40" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* ================================================================ */}
        {/* STEP 1: Payment Details                                         */}
        {/* ================================================================ */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Mode toggle */}
            <Tabs
              value={mode}
              onValueChange={(v) => setMode(v as "simple" | "milestone")}
            >
              <TabsList className="w-full">
                <TabsTrigger value="simple" className="flex-1">
                  Simple Payment
                </TabsTrigger>
                <TabsTrigger value="milestone" className="flex-1">
                  Milestone Payment
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Payer wallet (read-only, connected wallet) */}
            <div className="space-y-1.5">
              <Label htmlFor="payer-wallet">Payer Wallet</Label>
              {wallet.publicKey ? (
                <Input
                  id="payer-wallet"
                  value={payerWalletAddress}
                  readOnly
                  className="font-mono text-xs opacity-70"
                />
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-muted-foreground"
                  onClick={() => walletModal.setVisible(true)}
                >
                  Connect wallet to continue
                </Button>
              )}
            </div>

            {/* Payee wallet */}
            <div className="space-y-1.5">
              <Label htmlFor="payee-wallet">Payee Wallet</Label>
              <Input
                id="payee-wallet"
                value={payeeWallet}
                onChange={(e) =>
                  setPayeeWallet((e.target as HTMLInputElement).value)
                }
                placeholder="Solana address (base58)"
                className="font-mono text-xs"
              />
              {payeeWallet && !isValidPublicKey(payeeWallet) && (
                <p className="text-xs text-destructive">
                  Invalid Solana address
                </p>
              )}
            </div>

            {/* Token mint selector */}
            <div className="space-y-1.5">
              <Label>Token Mint</Label>
              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select token…" />
                </SelectTrigger>
                <SelectContent>
                  {TOKEN_PRESETS.map((t) => (
                    <SelectItem key={t.symbol} value={t.symbol}>
                      {t.label}
                      {t.mint && (
                        <span className="ml-2 text-muted-foreground text-xs font-mono">
                          {t.mint.slice(0, 4)}…{t.mint.slice(-4)}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedToken === "custom" && (
                <Input
                  value={customMint}
                  onChange={(e) => setCustomMint((e.target as HTMLInputElement).value)}
                  placeholder="Token mint address (base58)"
                  className="font-mono text-xs mt-1.5"
                />
              )}
              {selectedToken === "custom" && customMint && !isValidPublicKey(customMint) && (
                <p className="text-xs text-destructive">Invalid Solana address</p>
              )}
              {selectedToken !== "custom" && (
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {resolvedMint}
                </p>
              )}
            </div>

            {/* Total amount */}
            <div className="space-y-1.5">
              <Label htmlFor="total-amount">Total Amount</Label>
              <Input
                id="total-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={totalAmount}
                onChange={(e) =>
                  setTotalAmount((e.target as HTMLInputElement).value)
                }
                placeholder="0.00"
              />
              {totalAmount && !totalAmountValid && (
                <p className="text-xs text-destructive">
                  Amount must be greater than 0
                </p>
              )}
            </div>

            {/* Travel Rule Metadata URI (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="metadata-uri">Travel Rule Metadata URI</Label>
              <Input
                id="metadata-uri"
                value={metadataUri}
                onChange={(e) =>
                  setMetadataUri((e.target as HTMLInputElement).value)
                }
                placeholder="https://example.com/.well-known/travel-rule.json"
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Optional — link to Travel Rule identity metadata
              </p>
            </div>

            {/* Milestone-specific fields */}
            {mode === "milestone" && (
              <div className="space-y-4 rounded-lg border border-input p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="milestone-count">Number of Milestones</Label>
                  <Input
                    id="milestone-count"
                    type="number"
                    min={2}
                    max={8}
                    value={milestoneCount}
                    onChange={(e) => {
                      const val = parseInt(
                        (e.target as HTMLInputElement).value,
                        10
                      );
                      if (val >= 2 && val <= 8) {
                        handleMilestoneCountChange(val);
                      }
                    }}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Per-Milestone Amounts</Label>
                  {milestoneAmounts.map((amt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-24">
                        Milestone {i + 1}
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amt}
                        onChange={(e) => {
                          const next = [...milestoneAmounts];
                          next[i] = (e.target as HTMLInputElement).value;
                          setMilestoneAmounts(next);
                        }}
                        placeholder="0.00"
                        className="flex-1"
                      />
                    </div>
                  ))}
                  {totalAmountValid && !milestoneSumValid && (
                    <p className="text-xs text-destructive">
                      Milestone amounts must sum to total ({totalAmount} {tokenLabel}).
                      Current sum:{" "}
                      {milestoneAmounts
                        .reduce((s, v) => s + (parseFloat(v) || 0), 0)
                        .toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* STEP 2: Conditions                                              */}
        {/* ================================================================ */}
        {step === 2 && (
          <div className="space-y-4">
            {mode === "simple" ? (
              <div>
                <h3 className="text-sm font-medium mb-3">
                  Payment Conditions
                </h3>
                <ConditionBuilder
                  value={simpleConditions}
                  onChange={setSimpleConditions}
                  onValidChange={setSimpleConditionsValid}
                />
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-medium mb-3">
                  Milestone Conditions
                </h3>
                <Tabs
                  value={activeMilestoneTab}
                  onValueChange={setActiveMilestoneTab}
                >
                  <TabsList className="w-full flex-wrap">
                    {Array.from({ length: milestoneCount }, (_, i) => (
                      <TabsTrigger key={i} value={String(i)} className="flex-1">
                        <span>M{i + 1}</span>
                        {milestoneConditionsValid[i] && (
                          <span className="ml-1 text-green-400">✓</span>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {Array.from({ length: milestoneCount }, (_, i) => (
                    <TabsContent key={i} value={String(i)}>
                      <ConditionBuilder
                        value={milestoneConditions[i]!}
                        onChange={(val) => {
                          const next = [...milestoneConditions];
                          next[i] = val;
                          setMilestoneConditions(next);
                        }}
                        onValidChange={(valid) => {
                          const next = [...milestoneConditionsValid];
                          next[i] = valid;
                          setMilestoneConditionsValid(next);
                        }}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* STEP 3: Review & Submit                                         */}
        {/* ================================================================ */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Review Payment</h3>

            <div className="rounded-lg border border-input p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="outline">
                  {mode === "simple" ? "Simple" : "Milestone"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payer</span>
                <span className="font-mono text-xs truncate max-w-[200px]">
                  {payerWalletAddress}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payee</span>
                <span className="font-mono text-xs truncate max-w-[200px]">
                  {payeeWallet}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token</span>
                <span>{tokenLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-medium">{totalAmount} {tokenLabel}</span>
              </div>

              {metadataUri && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metadata URI</span>
                  <span className="font-mono text-xs truncate max-w-[200px]">
                    {metadataUri}
                  </span>
                </div>
              )}

              {mode === "milestone" && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <span className="text-muted-foreground text-xs uppercase tracking-wide">
                      Milestones
                    </span>
                    {milestoneAmounts.map((amt, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-xs"
                      >
                        <span>
                          Milestone {i + 1} —{" "}
                          {milestoneConditions[i]!.conditions.length} condition
                          {milestoneConditions[i]!.conditions.length !== 1
                            ? "s"
                            : ""}{" "}
                          ({milestoneConditions[i]!.operator.toUpperCase()})
                        </span>
                        <span>{amt} {tokenLabel}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {mode === "simple" && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs uppercase tracking-wide">
                      Conditions ({simpleConditions.operator.toUpperCase()})
                    </span>
                    {simpleConditions.conditions.map((c, i) => (
                      <div key={i} className="text-xs">
                        {i + 1}. {conditionTypeLabel(c.type)}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Transaction status */}
            <TransactionStatus
              status={txStatus}
              signature={lastSignature}
              error={
                mutation.error?.message ?? "Transaction failed"
              }
            />

            {/* Success: show done button */}
            {mutation.isSuccess && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* ================================================================ */}
        {/* Navigation Footer                                               */}
        {/* ================================================================ */}
        <div className="flex items-center justify-between">
          <div>
            {step > 1 && !mutation.isPending && !mutation.isSuccess && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step < 3 && (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={
                  (step === 1 && !step1Valid) ||
                  (step === 2 && !step2Valid)
                }
              >
                Next
              </Button>
            )}
            {step === 3 && !mutation.isSuccess && (
              <Button
                onClick={handleSubmit}
                disabled={
                  mutation.isPending || !wallet.publicKey
                }
              >
                {mutation.isPending
                  ? "Submitting…"
                  : mutation.isError
                    ? "Retry"
                    : "Submit Payment"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
