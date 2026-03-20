---
id: T01
parent: S02
milestone: M002
provides:
  - getUsdcAta() Token-2022 ATA derivation helper
  - useFundPayment() mutation hook for funding Created payments
  - USDC_MINT devnet constant consolidated in lib/token.ts
key_files:
  - app/web/src/lib/token.ts
  - app/web/src/lib/mutations/fund-payment.ts
key_decisions:
  - Used the existing USDC devnet mint address (4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU) from create-payment-wizard.tsx for consistency
  - Mutation fetches PaymentAgreement on-chain to read isMilestone/currentMilestone for correct conditionPDA derivation
patterns_established:
  - Token-2022 ATA lookup via getUsdcAta() in lib/token.ts — reuse this for S03 release flow
  - Console logging with [GherkinPay] prefix and structured account dump before RPC calls
observability_surfaces:
  - "[GherkinPay] fundPayment accounts:" log with all derived PDAs before RPC call
  - "[GherkinPay] Fund payment failed:" error log on mutation failure
duration: 10m
verification_result: passed
completed_at: 2026-03-20
blocker_discovered: false
---

# T01: Fund payment mutation hook and ATA lookup

**Created Token-2022 ATA helper and useFundPayment() mutation hook with correct PDA derivation and cache invalidation**

## What Happened

Created two files:

1. `lib/token.ts` — exports `USDC_MINT` (devnet address matching `create-payment-wizard.tsx`) and `getUsdcAta(owner)` which derives the Token-2022 Associated Token Account address using `getAssociatedTokenAddressSync` with `TOKEN_2022_PROGRAM_ID`.

2. `lib/mutations/fund-payment.ts` — `useFundPayment()` hook that accepts a `paymentPDA`, fetches the on-chain `PaymentAgreement` to read `tokenMint`, `payer`, `isMilestone`, and `currentMilestone`, derives escrowPDA, conditionPDA (index 0 for simple, `currentMilestone` for milestone payments), and payer ATA, then calls `program.methods.fundPayment()` with all required accounts matching the test file's ground truth. On success, invalidates the `["agreements"]` query cache.

Also added the `## Observability / Diagnostics` section to `S02-PLAN.md` as required by the pre-flight check.

## Verification

- `bun run typecheck` in `app/web` — exits 0 (clean)
- `bun run build` in `app/web` — exits 0, production build successful
- Manual account comparison: all 7 account keys in the mutation's `.accounts()` call match the test file's `fundPayment()` call exactly (payer, payment, conditionAccount, tokenMint, payerTokenAccount, escrowTokenAccount, tokenProgram)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run typecheck` | 0 | ✅ pass | 3.7s |
| 2 | `cd app/web && bun run build` | 0 | ✅ pass | 16.0s |

## Diagnostics

- Filter browser DevTools console by `[GherkinPay]` to see fund flow logs
- Before the RPC call, all derived PDAs are logged as a structured object — compare against Solana Explorer
- Mutation errors surface as `[GherkinPay] Fund payment failed:` with the full error object

## Deviations

- Used the USDC devnet mint address already present in `create-payment-wizard.tsx` (`4zMMC9...`) instead of the placeholder in the task plan — ensures consistency across the app.

## Known Issues

- `USDC_MINT` is still duplicated in `create-payment-wizard.tsx` (hardcoded string) and `lib/token.ts` (exported constant). T02 or a follow-up should update the wizard to import from `lib/token.ts`.

## Files Created/Modified

- `app/web/src/lib/token.ts` — New file: USDC_MINT constant and getUsdcAta() Token-2022 ATA helper
- `app/web/src/lib/mutations/fund-payment.ts` — New file: useFundPayment() mutation hook with PDA derivation and cache invalidation
- `.gsd/milestones/M002/slices/S02/S02-PLAN.md` — Added Observability section, marked T01 done
