"use client";

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
// Anchor's Program<Idl> returns untyped account accessors — safe-member-access is unavoidable here.

import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { useAnchorProgram } from "~/lib/anchor";

/* ── parsed types ─────────────────────── */

export interface ParsedCondition {
  type: "timeBased" | "oracle" | "tokenGated" | "multisig" | "webhook";
  met: boolean;
  data: TimeBasedData | OracleData | TokenGatedData | MultisigData | WebhookData;
}

export interface TimeBasedData {
  unlockAt: number; // unix seconds
  met: boolean;
}

export interface OracleData {
  feedAccount: string;
  operator: string; // ">", ">=", "<", "<=", "=="
  targetValue: number;
  decimals: number;
  met: boolean;
}

export interface TokenGatedData {
  requiredMint: string;
  minAmount: number;
  holder: string;
  met: boolean;
}

export interface MultisigData {
  signers: string[];
  threshold: number;
  approvals: boolean[];
  met: boolean;
}

export interface WebhookData {
  relayer: string;
  eventHash: string; // hex string
  met: boolean;
}

export interface ParsedConditionAccount {
  pubkey: string;
  payment: string;
  milestoneIndex: number;
  amount: number;
  milestoneStatus: string;
  operator: string;
  conditions: ParsedCondition[];
  isFinalized: boolean;
}

/* ── helpers ───────────────────────────── */

function toNumber(val: any): number {
  if (typeof val === "number") return val;
  if (val?.toNumber) return val.toNumber();
  return Number(val?.toString() ?? "0");
}

function extractEnumKey(obj: Record<string, unknown>): string {
  return Object.keys(obj)[0] ?? "unknown";
}

const COMPARISON_SYMBOLS: Record<string, string> = {
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  eq: "==",
};

function parseCondition(raw: any): ParsedCondition {
  // Anchor deserializes enum as { variantName: { field1, field2 } }
  const key = Object.keys(raw)[0]!;
  const fields = raw[key];

  switch (key) {
    case "timeBased":
      return {
        type: "timeBased",
        met: fields.met,
        data: {
          unlockAt: toNumber(fields.unlockAt),
          met: fields.met,
        } as TimeBasedData,
      };
    case "oracle":
      return {
        type: "oracle",
        met: fields.met,
        data: {
          feedAccount: fields.feedAccount.toBase58(),
          operator: COMPARISON_SYMBOLS[extractEnumKey(fields.operator)] ?? "?",
          targetValue: toNumber(fields.targetValue),
          decimals: fields.decimals,
          met: fields.met,
        } as OracleData,
      };
    case "tokenGated":
      return {
        type: "tokenGated",
        met: fields.met,
        data: {
          requiredMint: fields.requiredMint.toBase58(),
          minAmount: toNumber(fields.minAmount),
          holder: fields.holder.toBase58(),
          met: fields.met,
        } as TokenGatedData,
      };
    case "multisig":
      return {
        type: "multisig",
        met: fields.met,
        data: {
          signers: fields.signers.map((s: any) => s.toBase58()),
          threshold: fields.threshold,
          approvals: fields.approvals,
          met: fields.met,
        } as MultisigData,
      };
    case "webhook":
      return {
        type: "webhook",
        met: fields.met,
        data: {
          relayer: fields.relayer.toBase58(),
          eventHash: Array.from(fields.eventHash as number[])
            .map((b: number) => b.toString(16).padStart(2, "0"))
            .join(""),
          met: fields.met,
        } as WebhookData,
      };
    default:
      throw new Error(`Unknown condition type: ${key}`);
  }
}

/* ── useConditions ─────────────────────── */

export function useConditions(paymentPubkey: string | undefined) {
  const { program } = useAnchorProgram();

  return useQuery({
    queryKey: ["conditions", paymentPubkey],
    queryFn: async (): Promise<ParsedConditionAccount[]> => {
      if (!program || !paymentPubkey) throw new Error("Not ready");

      const paymentKey = new PublicKey(paymentPubkey);
      // memcmp filter: payment field is at offset 8 (after discriminator), 32 bytes
      const accounts = await (program.account as any).conditionAccount.all([
        {
          memcmp: {
            offset: 8,
            bytes: paymentKey.toBase58(),
          },
        },
      ]);

      return accounts.map((acc: any) => {
        const d = acc.account;
        return {
          pubkey: acc.publicKey.toBase58(),
          payment: d.payment.toBase58(),
          milestoneIndex: d.milestoneIndex,
          amount: toNumber(d.amount),
          milestoneStatus: extractEnumKey(d.milestoneStatus as Record<string, unknown>),
          operator: extractEnumKey(d.operator as Record<string, unknown>),
          conditions: d.conditions.map(parseCondition),
          isFinalized: d.isFinalized,
        };
      });
    },
    enabled: !!program && !!paymentPubkey,
    staleTime: 15_000,
  });
}

/* ── usePaymentDetail ──────────────────── */

export interface ParsedPaymentDetail {
  pubkey: string;
  paymentId: number;
  authority: string;
  payer: string;
  payee: string;
  tokenMint: string;
  escrowTokenAccount: string;
  totalAmount: number;
  releasedAmount: number;
  status: string;
  isMilestone: boolean;
  milestoneCount: number;
  currentMilestone: number;
  createdAt: number;
}

export function usePaymentDetail(paymentPubkey: string | undefined) {
  const { program } = useAnchorProgram();

  return useQuery({
    queryKey: ["payment", paymentPubkey],
    queryFn: async (): Promise<ParsedPaymentDetail> => {
      if (!program || !paymentPubkey) throw new Error("Not ready");

      const key = new PublicKey(paymentPubkey);
      const data = await (program.account as any).paymentAgreement.fetch(key);

      return {
        pubkey: paymentPubkey,
        paymentId: toNumber(data.paymentId),
        authority: data.authority.toBase58(),
        payer: data.payer.toBase58(),
        payee: data.payee.toBase58(),
        tokenMint: data.tokenMint.toBase58(),
        escrowTokenAccount: data.escrowTokenAccount.toBase58(),
        totalAmount: toNumber(data.totalAmount),
        releasedAmount: toNumber(data.releasedAmount),
        status: extractEnumKey(data.status as Record<string, unknown>),
        isMilestone: data.isMilestone,
        milestoneCount: data.milestoneCount,
        currentMilestone: data.currentMilestone,
        createdAt: toNumber(data.createdAt),
      };
    },
    enabled: !!program && !!paymentPubkey,
    staleTime: 15_000,
  });
}
