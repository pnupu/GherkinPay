/**
 * Program-level TypeScript types derived from the gherkin_pay Anchor IDL.
 * These mirror the on-chain account and enum structures.
 */
import type { PublicKey } from "@solana/web3.js";

/* ── Enums ────────────────────────────── */

export type PaymentStatus =
  | { created: Record<string, never> }
  | { active: Record<string, never> }
  | { completed: Record<string, never> }
  | { cancelled: Record<string, never> };

export type MilestoneStatus =
  | { pending: Record<string, never> }
  | { active: Record<string, never> }
  | { released: Record<string, never> };

export type ConditionOperator =
  | { and: Record<string, never> }
  | { or: Record<string, never> };

export type ComparisonOperator =
  | { gt: Record<string, never> }
  | { gte: Record<string, never> }
  | { lt: Record<string, never> }
  | { lte: Record<string, never> }
  | { eq: Record<string, never> };

export type Condition =
  | {
      multisig: {
        signers: PublicKey[];
        threshold: number;
        approvals: boolean[];
        met: boolean;
      };
    }
  | {
      timeBased: {
        unlockAt: bigint;
        met: boolean;
      };
    }
  | {
      oracle: {
        feedAccount: PublicKey;
        operator: ComparisonOperator;
        targetValue: bigint;
        decimals: number;
        met: boolean;
      };
    }
  | {
      webhook: {
        relayer: PublicKey;
        eventHash: number[];
        met: boolean;
      };
    }
  | {
      tokenGated: {
        requiredMint: PublicKey;
        minAmount: bigint;
        holder: PublicKey;
        met: boolean;
      };
    };

/* ── Accounts ─────────────────────────── */

export interface PaymentAgreement {
  paymentId: bigint;
  authority: PublicKey;
  payer: PublicKey;
  payee: PublicKey;
  tokenMint: PublicKey;
  escrowTokenAccount: PublicKey;
  totalAmount: bigint;
  releasedAmount: bigint;
  status: PaymentStatus;
  isMilestone: boolean;
  milestoneCount: number;
  currentMilestone: number;
  createdAt: bigint;
  bump: number;
  escrowBump: number;
}

export interface ConditionAccount {
  payment: PublicKey;
  milestoneIndex: number;
  amount: bigint;
  milestoneStatus: MilestoneStatus;
  operator: ConditionOperator;
  conditions: Condition[];
  isFinalized: boolean;
  bump: number;
}

/* ── Error codes (offset from Anchor custom error base 6000) ── */

export enum GherkinPayErrorCode {
  InvalidPaymentStatus = 6000,
  ConditionsAlreadyFinalized = 6001,
  ConditionsNotFinalized = 6002,
  MaxConditionsReached = 6003,
  MaxSignersReached = 6004,
  SignerNotInList = 6005,
  AlreadyApproved = 6006,
  ConditionTypeMismatch = 6007,
  ConditionIndexOutOfBounds = 6008,
  ConditionsNotMet = 6009,
  MilestoneNotActive = 6010,
  AllMilestonesReleased = 6011,
  MilestoneIndexMismatch = 6012,
  MilestoneAmountMismatch = 6013,
  NotAllConditionsFinalized = 6014,
  NotMilestonePayment = 6015,
  IsMilestonePayment = 6016,
  OraclePriceStale = 6017,
  OracleConfidenceTooWide = 6018,
  RelayerMismatch = 6019,
  EventHashMismatch = 6020,
  TokenBalanceInsufficient = 6021,
  ArithmeticOverflow = 6022,
  CannotCancelCompleted = 6023,
  NothingToRefund = 6024,
  ZeroMilestones = 6025,
  MaxMilestonesExceeded = 6026,
}
