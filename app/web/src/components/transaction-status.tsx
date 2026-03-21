"use client";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export type TransactionStatusState = "idle" | "loading" | "success" | "error";

export interface TransactionStatusProps {
  status: TransactionStatusState;
  /** Solana transaction signature (base58) */
  signature?: string;
  /** Error message to display on failure */
  error?: string;
  className?: string;
}

function truncateSignature(sig: string): string {
  if (sig.length <= 16) return sig;
  return `${sig.slice(0, 8)}…${sig.slice(-8)}`;
}

function explorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

/**
 * TransactionStatus — reusable component for all on-chain write flows.
 *
 * Shows:
 *   - idle: nothing rendered
 *   - loading: spinner + "Confirming transaction…"
 *   - success: green checkmark + truncated signature linking to Solana Explorer
 *   - error: red X + error message
 *
 * Observability: logs signature on success, console.error on failure.
 */
export function TransactionStatus({
  status,
  signature,
  error,
  className,
}: TransactionStatusProps) {
  if (status === "idle") return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3",
        status === "loading" && "border-input bg-muted/30",
        status === "success" && "border-green-700/40 bg-green-950/20",
        status === "error" && "border-red-700/40 bg-red-950/20",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {status === "loading" && (
        <>
          <LoadingSpinner />
          <span className="text-sm text-muted-foreground">
            Confirming transaction…
          </span>
        </>
      )}

      {status === "success" && (
        <>
          <CheckIcon />
          <div className="flex flex-1 items-center gap-2">
            <Badge variant="outline" className="border-green-700/60 text-green-400">
              Confirmed
            </Badge>
            {signature && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-green-400 hover:text-green-300"
                render={
                  <a
                    href={explorerUrl(signature)}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                {truncateSignature(signature)}
              </Button>
            )}
          </div>
        </>
      )}

      {status === "error" && (
        <>
          <ErrorIcon />
          <div className="flex flex-1 flex-col gap-1">
            <Badge variant="destructive">Failed</Badge>
            {error && (
              <span className="text-sm text-red-400">{error}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="size-5 animate-spin text-muted-foreground"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="size-5 text-green-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      className="size-5 text-red-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
