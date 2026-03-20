"use client";

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return */
// Anchor's Program<Idl> returns untyped account accessors — safe-member-access is unavoidable here.

import { useQuery } from "@tanstack/react-query";
import { useAnchorProgram } from "~/lib/anchor";

/* ── helpers ──────────────────────────── */

/** Extract status key from Anchor enum object, e.g. { active: {} } → "active" */
function extractStatus(status: Record<string, unknown>): string {
  return Object.keys(status)[0] ?? "unknown";
}

/** Truncate a base58 pubkey to first4…last4 */
export function truncatePubkey(pubkey: string): string {
  if (pubkey.length <= 8) return pubkey;
  return `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`;
}

/** Format a BN/number token amount with USDC decimals (6) */
export function formatTokenAmount(amount: { toNumber?: () => number; toString: () => string }): string {
  const raw = typeof amount === "number"
    ? amount
    : amount.toNumber
      ? amount.toNumber()
      : Number(amount.toString());
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(raw / 1e6);
}

/* ── parsed type ──────────────────────── */

export interface ParsedAgreement {
  pubkey: string;
  authority: string;
  payer: string;
  payee: string;
  tokenMint: string;
  totalAmount: number;
  releasedAmount: number;
  status: string;
  isMilestone: boolean;
  milestoneCount: number;
  currentMilestone: number;
  createdAt: number;
}

/* ── hook ──────────────────────────────── */

export function useAgreements() {
  const { program } = useAnchorProgram();

  return useQuery({
    queryKey: ["agreements"],
    queryFn: async (): Promise<ParsedAgreement[]> => {
      if (!program) throw new Error("Program not initialized");
      const accounts = await (program.account as any).paymentAgreement.all();
      return accounts.map((acc: any) => {
        const data = acc.account;
        return {
          pubkey: acc.publicKey.toBase58(),
          authority: data.authority.toBase58(),
          payer: data.payer.toBase58(),
          payee: data.payee.toBase58(),
          tokenMint: data.tokenMint.toBase58(),
          totalAmount: data.totalAmount.toNumber ? data.totalAmount.toNumber() : Number(data.totalAmount),
          releasedAmount: data.releasedAmount.toNumber ? data.releasedAmount.toNumber() : Number(data.releasedAmount),
          status: extractStatus(data.status as Record<string, unknown>),
          isMilestone: data.isMilestone,
          milestoneCount: data.milestoneCount,
          currentMilestone: data.currentMilestone,
          createdAt: data.createdAt.toNumber ? data.createdAt.toNumber() : Number(data.createdAt),
        };
      });
    },
    enabled: !!program,
    staleTime: 30_000,
  });
}
