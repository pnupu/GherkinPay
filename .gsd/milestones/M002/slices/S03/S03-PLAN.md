# S03: Release and Cancel

**Goal:** Users can release funds from a payment where conditions are met and cancel a payment for refund, completing the full payment lifecycle.
**Demo:** On devnet: click "Release" on an Active payment with met conditions → funds move to payee → status shows Completed. Click "Cancel" on an Active payment → funds refund to payer → status shows Cancelled. For time-based conditions, a `crankTime` call is issued before release to mark the condition as met.

## Must-Haves

- Release button on Active payments; confirmation dialog with payee token account lookup
- Cancel button on Created/Active payments; confirmation dialog with refund details
- `useReleasePayment()` mutation hook with correct `nextConditionAccount` logic (same PDA for simple/last milestone, next milestone PDA otherwise)
- `useCancelPayment()` mutation hook
- Minimal `crankTime` utility: for time-based conditions with past timestamps, call crankTime before evaluateAndRelease
- Payee Token-2022 ATA lookup (reuses `getUsdcAta()` from S02)
- Transaction status feedback for both operations
- Agreements list updates after release or cancel

## Proof Level

- This slice proves: integration (real release/cancel transactions on devnet)
- Real runtime required: yes (devnet, connected wallet, funded payment with met conditions)
- Human/UAT required: yes (wallet signing, visual verification of status changes)

## Verification

- `bun run build` passes clean in `app/web`
- `bun run typecheck` passes clean in `app/web`
- Manual verification: create a simple payment with past TimeBased condition → fund → crankTime → release → status Completed, payee balance increased
- Manual verification: create a payment → fund → cancel → status Cancelled, payer balance restored

## Observability / Diagnostics

- Runtime signals: transaction signatures logged; release amount and milestone index logged; cancel refund amount logged
- Inspection surfaces: agreements list status badges; Solana Explorer for escrow/token account balances
- Failure visibility: Anchor error messages (e.g. "conditions not met", "invalid status") surfaced in UI
- Redaction constraints: none

## Integration Closure

- Upstream surfaces consumed: S01 TransactionStatus component, mutation pattern, shadcn components; S02 `getUsdcAta()` helper, funded Active payments on devnet; M001 useAnchorProgram, PDA helpers, wallet adapter, query hooks
- New wiring introduced: Release and Cancel action buttons on agreements page; crankTime helper for testing time conditions
- What remains before the milestone is truly usable end-to-end: nothing — this is the final slice

## Tasks

- [ ] **T01: Release and cancel mutation hooks** `est:45m`
  - Why: Both operations are single-instruction but release has the tricky `nextConditionAccount` logic — for simple payments or the last milestone, pass the same conditionPDA; for milestone payments with remaining milestones, derive the next milestone's conditionPDA. Cancel is straightforward but requires authority signer. A `crankTime` helper is needed so release can be tested with time-based conditions.
  - Files: `app/web/src/lib/mutations/release-payment.ts`, `app/web/src/lib/mutations/cancel-payment.ts`
  - Do: Create `useReleasePayment()`: accepts paymentPDA, fetches the PaymentAgreement account to determine `isMilestone`, `currentMilestone`, `milestoneCount`. Derives conditionPDA for currentMilestone. Determines nextConditionPDA: if `!isMilestone || currentMilestone === milestoneCount - 1`, use same conditionPDA; else derive conditionPDA for `currentMilestone + 1`. Looks up payee ATA via `getUsdcAta()`. Before calling evaluateAndRelease, check if any conditions are TimeBased with past `unlockAt` — if so, call `crankTime(conditionIndex)` first. Then call `evaluateAndRelease()` with correct accounts. Invalidate `["agreements"]` and `["milestones"]` cache. Create `useCancelPayment()`: accepts paymentPDA, derives escrowPDA, looks up payer ATA, calls `cancelPayment()` with authority = connected wallet, invalidates cache.
  - Verify: `bun run typecheck` passes
  - Done when: Both hooks compile with correct types; nextConditionAccount logic handles simple, milestone-in-progress, and last-milestone cases

- [ ] **T02: Release and cancel UI with action buttons** `est:45m`
  - Why: Users need buttons on the agreements list/detail to trigger release and cancel, with confirmation dialogs that show relevant details before signing.
  - Files: `app/web/src/components/release-payment-dialog.tsx`, `app/web/src/components/cancel-payment-dialog.tsx`, `app/web/src/app/(console)/agreements/page.tsx`
  - Do: Create `ReleasePaymentDialog`: shows payment summary, payee address, amount to release (milestone amount or total), TransactionStatus. For milestone payments, show which milestone is being released. Create `CancelPaymentDialog`: shows payment summary, refund amount (totalAmount - releasedAmount), payer address, TransactionStatus. On the agreements page, add "Release" action button on Active payments and "Cancel" action button on Created/Active payments (not on Completed/Cancelled). Both open their respective dialogs. After successful release/cancel, the dialog closes and the list refreshes.
  - Verify: `bun run build` passes; Release and Cancel buttons appear on eligible payments
  - Done when: Full lifecycle works: create → fund → release on devnet, and create → fund → cancel on devnet, all from the browser

## Files Likely Touched

- `app/web/src/lib/mutations/release-payment.ts`
- `app/web/src/lib/mutations/cancel-payment.ts`
- `app/web/src/components/release-payment-dialog.tsx`
- `app/web/src/components/cancel-payment-dialog.tsx`
- `app/web/src/app/(console)/agreements/page.tsx`
