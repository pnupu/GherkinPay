"use client";

import { cn } from "~/lib/utils";

type TxStatus = "idle" | "pending" | "success" | "error";

interface TransactionStatusProps {
  status: TxStatus;
  signature: string | null;
  error: string | null;
}

function explorerUrl(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}

export function TransactionStatus({
  status,
  signature,
  error,
}: TransactionStatusProps) {
  if (status === "idle") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "mt-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm",
        status === "pending" && "bg-muted text-muted-foreground",
        status === "success" &&
          "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300",
        status === "error" &&
          "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300",
      )}
    >
      {status === "pending" && (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              className="opacity-25"
            />
            <path
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              className="opacity-75"
            />
          </svg>
          <span>Submitting transaction…</span>
        </>
      )}

      {status === "success" && (
        <>
          <svg
            className="h-4 w-4 text-green-600 dark:text-green-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Transaction confirmed</span>
          {signature && (
            <a
              href={explorerUrl(signature)}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs underline underline-offset-2 hover:text-green-600"
            >
              View on Explorer ↗
            </a>
          )}
        </>
      )}

      {status === "error" && (
        <>
          <svg
            className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span className="break-all">{error ?? "Transaction failed"}</span>
        </>
      )}
    </div>
  );
}
