# S04: Milestones — Live Reads — Research

**Date:** 2026-03-19

## Summary

This is a straightforward pattern replication of S03. The milestones page needs a `useMilestones()` React Query hook that fetches all `conditionAccount` accounts (via `program.account.conditionAccount.all()`), joins them to the parent `PaymentAgreement` data from `useAgreements()`, and replaces the hardcoded mock array with a live table using the same shadcn components and four-state UI pattern (disconnected/loading/empty/populated).

The on-chain `ConditionAccount` struct has: `payment` (pubkey back-reference), `milestoneIndex` (u8), `amount` (u64), `milestoneStatus` (enum: pending/active/released), `operator` (enum: and/or), `conditions` (vec of condition variants), and `isFinalized` (bool). The join to `PaymentAgreement` uses the `payment` pubkey field on each condition account.

All infrastructure exists: PDA helpers in `lib/pda.ts` (including `getConditionPDA`), the `Program<GherkinPay>` cast pattern, `useAgreements()` for parent data, and shadcn Table/Badge/Skeleton components.

## Recommendation

Follow the S03 pattern exactly: one query hook file (`lib/queries/milestones.ts`), one page rewrite. The hook should fetch all `conditionAccount` accounts filtered by payment pubkeys from `useAgreements()`, not iterate per-payment — a single `getProgramAccounts` with no filter (or a memcmp on the `payment` field at offset 8) is more efficient than N separate calls. The page displays milestone index, parent agreement ID, amount, status badge, condition count, and operator.

## Implementation Landscape

### Key Files

- `app/web/src/lib/queries/milestones.ts` — **new**: `useMilestones()` React Query hook. Fetches `conditionAccount` accounts from devnet. Depends on `useAnchorProgram()` for the program client and `useAgreements()` for parent payment data (pubkeys and paymentIds for display).
- `app/web/src/app/(console)/milestones/page.tsx` — **rewrite**: Replace hardcoded mock array with live data consumption from `useMilestones()`. Four UI states matching agreements page pattern. shadcn Table/Badge/Skeleton.
- `app/web/src/lib/queries/agreements.ts` — **read-only reference**: Pattern source for hook structure, `Program<GherkinPay>` cast, query key convention.
- `app/web/src/app/(console)/agreements/page.tsx` — **read-only reference**: Pattern source for page structure, status config map, skeleton rows, amount formatting.
- `app/web/src/types/gherkin_pay.ts` — **read-only reference**: IDL types for `conditionAccount`, `milestoneStatus`, `conditionOperator`, `condition` enum variants.

### ConditionAccount Fields (from IDL)

```
payment: PublicKey        // back-reference to parent PaymentAgreement
milestoneIndex: u8        // 0-based index within the payment
amount: u64               // USDC amount for this milestone (6 decimals)
milestoneStatus: enum     // { pending, active, released }
operator: enum            // { and, or } — how conditions combine
conditions: Condition[]   // vec of condition variants (Multisig/TimeBased/Oracle/Webhook/TokenGated)
isFinalized: bool         // whether conditions are locked
bump: u8                  // PDA bump
```

### MilestoneStatus Enum

- `pending` — not yet active
- `active` — current milestone, conditions being evaluated  
- `released` — funds released

### Data Fetching Strategy

Two approaches for fetching condition accounts:

**Option A — Fetch all conditionAccounts for connected wallet's payments:** Use the payment pubkeys from `useAgreements()` and filter condition accounts by `payment` field. The `payment` field is at offset 8 (after the 8-byte discriminator). Can use memcmp filter per payment, but with multiple payments that's N RPC calls.

**Option B (recommended) — Fetch all conditionAccounts in one call, client-side join:** Call `program.account.conditionAccount.all()` with no filters (or with a set of memcmp filters if few payments). Then client-side join by matching `conditionAccount.payment` to agreement pubkeys. This is simpler and works well at devnet scale.

The hook should depend on `useAgreements()` data being loaded (use `enabled: !!agreements`). Query key: `["milestones", walletPubkey]`.

### Build Order

1. **T01: Query hook** — `lib/queries/milestones.ts` with `useMilestones()`. This is the data layer. Fetches conditionAccounts, joins to agreement data for display context (paymentId). Verify with typecheck.
2. **T02: Page rewrite** — `milestones/page.tsx` rewritten with live data, shadcn components, four UI states. Verify with build + no mock data remaining.

### Verification Approach

- `bun run build` passes (exit 0)
- `bun run typecheck` passes (exit 0)  
- `rg "M-01\|M-02\|M-03\|PAY-40" app/web/src/app/\(console\)/milestones/` returns no matches (no mock data)
- `rg "tRPC\|trpc\|HydrateClient" app/web/src/app/\(console\)/milestones/` returns no matches
- `lib/queries/milestones.ts` exports `useMilestones`
- Page imports from `~/lib/queries/milestones` and `~/components/ui/`

## Constraints

- `Program<GherkinPay>` cast required in the hook — same Anchor 0.32 issue as S03 (D008).
- All imports must use `~/` alias, not `@/`.
- Page must be `"use client"` — wallet hooks require client boundary.
- `conditionAccount.amount` is u64 in lamports (USDC 6 decimals) — same `/ 1e6` formatting as agreements.
