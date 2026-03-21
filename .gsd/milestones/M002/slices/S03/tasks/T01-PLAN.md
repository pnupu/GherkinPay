---
estimated_steps: 7
estimated_files: 2
---

# T01: Release and cancel mutation hooks

**Slice:** S03 — Release and Cancel
**Milestone:** M002

## Description

Build `useReleasePayment()` and `useCancelPayment()` mutation hooks. Release includes the tricky nextConditionAccount logic for milestone payments and a crankTime helper for testing time-based conditions.

## Steps

1. Create `app/web/src/lib/mutations/release-payment.ts` with `useReleasePayment()` mutation hook
2. The mutation accepts `paymentPDA: PublicKey`. Fetches PaymentAgreement to get `isMilestone`, `currentMilestone`, `milestoneCount`, `payee`, `tokenMint`. Derives conditionPDA for currentMilestone. Determines nextConditionPDA: if simple payment or `currentMilestone === milestoneCount - 1`, use same conditionPDA; else derive conditionPDA for `currentMilestone + 1`.
3. Before evaluateAndRelease: fetch conditionAccount, check for TimeBased conditions with past `unlockAt` that are not yet met. For each, call `program.methods.crankTime(conditionIndex).accounts({ payment: paymentPDA, conditionAccount: conditionPDA }).rpc()` and await confirmation.
4. Look up payee ATA via `getUsdcAta(payee)`. Call `program.methods.evaluateAndRelease().accounts({ payment: paymentPDA, conditionAccount: conditionPDA, nextConditionAccount: nextConditionPDA, tokenMint, escrowTokenAccount: escrowPDA, payeeTokenAccount: payeeAta, tokenProgram: TOKEN_2022_PROGRAM_ID }).rpc()`
5. Invalidate `["agreements"]` and `["milestones"]` cache on success.
6. Create `app/web/src/lib/mutations/cancel-payment.ts` with `useCancelPayment()`. Accepts paymentPDA. Derives escrowPDA. Looks up payer ATA. Calls `program.methods.cancelPayment().accounts({ authority: wallet.publicKey, payment: paymentPDA, tokenMint, escrowTokenAccount: escrowPDA, payerTokenAccount: payerAta, tokenProgram: TOKEN_2022_PROGRAM_ID }).rpc()`.
7. Invalidate `["agreements"]` cache on success.

## Must-Haves

- [ ] nextConditionAccount logic correct for simple, milestone-in-progress, and last-milestone
- [ ] crankTime called for unmet TimeBased conditions before release
- [ ] Cancel uses authority (connected wallet) as signer
- [ ] Cache invalidated for both operations

## Verification

- `cd app/web && bun run typecheck` exits 0
- Instruction accounts match `tests/gherkin-pay.ts` evaluateAndRelease and cancelPayment calls

## Inputs

- `app/web/src/lib/anchor.ts` — useAnchorProgram
- `app/web/src/lib/pda.ts` — PDA helpers
- `app/web/src/lib/token.ts` — getUsdcAta (from S02)
- `tests/gherkin-pay.ts` — evaluateAndRelease + cancelPayment account contexts

## Expected Output

- `app/web/src/lib/mutations/release-payment.ts` — useReleasePayment with crankTime + nextConditionAccount logic
- `app/web/src/lib/mutations/cancel-payment.ts` — useCancelPayment mutation hook
