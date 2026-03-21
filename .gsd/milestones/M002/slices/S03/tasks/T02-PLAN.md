---
estimated_steps: 6
estimated_files: 3
---

# T02: Release and cancel UI with action buttons

**Slice:** S03 — Release and Cancel
**Milestone:** M002

## Description

Add Release and Cancel action buttons to the agreements page with confirmation dialogs, completing the full payment lifecycle UI.

## Steps

1. Create `app/web/src/components/release-payment-dialog.tsx` — shadcn Dialog showing: payment summary, payee address, amount to release. For milestone payments, show "Releasing milestone X of Y" with the milestone amount. Submit button calls `useReleasePayment()`. Display TransactionStatus.
2. Create `app/web/src/components/cancel-payment-dialog.tsx` — shadcn Dialog showing: payment summary, refund amount (totalAmount - releasedAmount), payer address. Submit button calls `useCancelPayment()`. Display TransactionStatus.
3. On the agreements page actions column: add "Release" Button on Active payments, add "Cancel" Button on Created or Active payments (not Completed/Cancelled). Wire each to open its respective dialog.
4. After successful release/cancel: dialog auto-closes, agreements list refreshes via cache invalidation.
5. Handle edge cases: if release fails with "conditions not met", surface a clear error message. If cancel fails on a Completed payment, the button shouldn't have been shown.
6. Run `bun run build` to verify full compilation.

## Must-Haves

- [ ] Release button on Active payments only
- [ ] Cancel button on Created and Active payments only
- [ ] Both dialogs show TransactionStatus feedback
- [ ] List refreshes after successful operation
- [ ] Full lifecycle testable: create → fund → release, and create → fund → cancel

## Verification

- `cd app/web && bun run build` exits 0
- Manual: Release and Cancel buttons appear on eligible payments; full lifecycle works on devnet

## Inputs

- `app/web/src/lib/mutations/release-payment.ts` — useReleasePayment (from T01)
- `app/web/src/lib/mutations/cancel-payment.ts` — useCancelPayment (from T01)
- `app/web/src/components/transaction-status.tsx` — status display (from S01/T01)
- `app/web/src/app/(console)/agreements/page.tsx` — agreements page with existing Fund actions from S02

## Expected Output

- `app/web/src/components/release-payment-dialog.tsx` — release confirmation dialog
- `app/web/src/components/cancel-payment-dialog.tsx` — cancel confirmation dialog
- `app/web/src/app/(console)/agreements/page.tsx` — updated with Release and Cancel action buttons
