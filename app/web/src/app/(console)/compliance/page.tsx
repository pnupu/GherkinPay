"use client";

import { useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useComplianceEntry } from "~/lib/queries/compliance";
import { useSetCompliance } from "~/lib/mutations/set-compliance";
import { TransactionStatus } from "~/components/transaction-status";
import { decodeAnchorError } from "~/lib/errors";

/** Validate a string as a valid Solana base58 public key. */
function isValidPubkey(value: string): boolean {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

export default function CompliancePage() {
  const { connected } = useWallet();

  // --- Lookup state ---
  const [lookupAddress, setLookupAddress] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [activeLookup, setActiveLookup] = useState<string | null>(null);

  const { data: complianceEntry, isLoading: isLookupLoading } =
    useComplianceEntry(activeLookup);

  const handleLookup = useCallback(() => {
    setLookupError(null);
    if (!lookupAddress.trim()) {
      setLookupError("Enter a wallet address");
      return;
    }
    if (!isValidPubkey(lookupAddress.trim())) {
      setLookupError("Invalid Solana wallet address");
      return;
    }
    setActiveLookup(lookupAddress.trim());
  }, [lookupAddress]);

  // --- Set compliance state ---
  const [setAddress, setSetAddress] = useState("");
  const [isAllowed, setIsAllowed] = useState(true);
  const [setError, setSetError] = useState<string | null>(null);

  const mutation = useSetCompliance();

  const txStatus = mutation.isPending
    ? "pending" as const
    : mutation.isSuccess
      ? "success" as const
      : mutation.isError
        ? "error" as const
        : "idle" as const;

  const txSignature = mutation.isSuccess ? (mutation.data ?? undefined) : undefined;
  const txError = mutation.isError
    ? decodeAnchorError(mutation.error)
    : undefined;

  const handleSetCompliance = useCallback(() => {
    setSetError(null);
    if (!setAddress.trim()) {
      setSetError("Enter a wallet address");
      return;
    }
    if (!isValidPubkey(setAddress.trim())) {
      setSetError("Invalid Solana wallet address");
      return;
    }
    mutation.mutate({ walletAddress: setAddress.trim(), isAllowed });
  }, [setAddress, isAllowed, mutation]);

  // --- Wallet not connected ---
  if (!connected) {
    return (
      <>
        <header className="topbar">
          <div>
            <h1 className="page-title">KYC / AML</h1>
            <p className="page-subtitle">
              On-chain identity allowlist — KYC-verified wallets only
            </p>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            Connect your wallet to manage KYC status
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the wallet button in the sidebar to get started.
          </p>
        </div>
      </>
    );
  }

  // --- Render lookup status ---
  function renderLookupResult() {
    if (!activeLookup) return null;

    if (isLookupLoading) {
      return (
        <p className="mt-3 text-sm text-muted-foreground">
          Loading KYC status…
        </p>
      );
    }

    if (complianceEntry === null || complianceEntry === undefined) {
      return (
        <p className="mt-3 text-sm text-muted-foreground">
          Not registered — no KYC entry exists for this wallet.
        </p>
      );
    }

    return (
      <p className="mt-3 text-sm">
        Status:{" "}
        <span
          className={
            complianceEntry.isAllowed
              ? "font-semibold text-green-700 dark:text-green-400"
              : "font-semibold text-red-700 dark:text-red-400"
          }
        >
          {complianceEntry.isAllowed ? "Allowed" : "Blocked"}
        </span>
      </p>
    );
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">KYC / AML</h1>
          <p className="page-subtitle">
            On-chain identity allowlist — KYC-verified wallets only
          </p>
        </div>
      </header>

      {/* Lookup section */}
      <section className="panel">
        <h2 className="panel-title">Check KYC status</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="lookup-address"
              className="mb-1 block text-sm font-medium"
            >
              Wallet address
            </label>
            <input
              id="lookup-address"
              type="text"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter Solana wallet address"
              value={lookupAddress}
              onChange={(e) => {
                setLookupAddress(e.target.value);
                setLookupError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLookup();
              }}
            />
            {lookupError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {lookupError}
              </p>
            )}
          </div>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            onClick={handleLookup}
          >
            Check Status
          </button>
        </div>
        {renderLookupResult()}
      </section>

      {/* Set compliance section */}
      <section className="panel mt-4">
        <h2 className="panel-title">Set KYC status</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label
              htmlFor="set-address"
              className="mb-1 block text-sm font-medium"
            >
              Wallet address
            </label>
            <input
              id="set-address"
              type="text"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter Solana wallet address"
              value={setAddress}
              onChange={(e) => {
                setSetAddress(e.target.value);
                setSetError(null);
              }}
            />
            {setError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {setError}
              </p>
            )}
          </div>

          <fieldset>
            <legend className="mb-1 text-sm font-medium">Action</legend>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="compliance-action"
                  checked={isAllowed}
                  onChange={() => setIsAllowed(true)}
                  className="accent-primary"
                />
                Allow
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="compliance-action"
                  checked={!isAllowed}
                  onChange={() => setIsAllowed(false)}
                  className="accent-primary"
                />
                Block
              </label>
            </div>
          </fieldset>

          <div>
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              disabled={mutation.isPending}
              onClick={handleSetCompliance}
            >
              {mutation.isPending ? "Submitting…" : "Submit"}
            </button>
          </div>

          <TransactionStatus
            status={txStatus}
            signature={txSignature}
            error={txError}
          />
        </div>
      </section>
    </>
  );
}
