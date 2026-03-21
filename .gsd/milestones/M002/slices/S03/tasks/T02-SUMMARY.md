---
id: T02
parent: S03
milestone: M002
provides:
  - ReleasePaymentDialog component with milestone-aware release amount display
  - CancelPaymentDialog component with refund amount calculation
  - Release button on Active payments, Cancel button on Created/Active payments
key_files:
  - app/web/src/components/release-payment-dialog.tsx
  - app/web/src/components/cancel-payment-dialog.tsx
  - app/web/src/components/agreements-client.tsx
key_decisions:
  - Cancel button uses destructive ghost variant to visually distinguish from positive actions (Fund, Release)
  - Release amount for milestone payments computed as totalAmount / milestoneCount (uniform distribution)
patterns_established:
  - Shared dialog pattern: selectedPayment state drives all three dialogs (Fund, Release, Cancel) with independent open flags
observability_surfaces:
  - Console logs: "[GherkinPay] Release dialog: initiating release for payment:" and "[GherkinPay] Cancel dialog: initiating cancel for payment:"
  - data-testid: release-payment-dialog, cancel-payment-dialog
  - Error visibility: Anchor errors surfaced in TransactionStatus within each dialog
duration: 10m
verification_result: passed
completed_at: 2026-03-20
blocker_discovered: false
---

# T02: Release and cancel UI with action buttons

**Added Release and Cancel action buttons with confirmation dialogs to the agreements page, completing the full payment lifecycle UI**

## What Happened

Created two new dialog components following the established FundPaymentDialog pattern:

**`ReleasePaymentDialog`** — Shows the release amount (per-milestone for milestone payments, full amount for simple), milestone progress ("Releasing milestone X of Y"), payer/payee addresses, and already-released amount. The Submit button calls `useReleasePayment()` and displays TransactionStatus feedback. Auto-closes on success after 2s.

**`CancelPaymentDialog`** — Shows the refund amount (totalAmount - releasedAmount), marks already-released amounts as non-refundable, payer/payee addresses. Uses a destructive-styled button calling `useCancelPayment()`. Auto-closes on success after 2s.

**Agreements table updates** — Added Release button (outline variant) on Active payments and Cancel button (destructive ghost variant) on Created and Active payments. Completed/Cancelled payments show no action buttons. Both buttons open their respective confirmation dialogs. All three dialogs (Fund, Release, Cancel) share the `selectedPayment` state with independent open flags.

## Verification

- `bun run build` exits 0 — all routes compile and generate successfully
- `bun run typecheck` exits 0 — no type errors
- Release button only renders when `payment.status === "active"`
- Cancel button renders when status is "created" or "active", not on "completed" or "cancelled"
- Both dialogs display TransactionStatus component for feedback
- Cache invalidation in mutation hooks ensures list refreshes after operations

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run build` | 0 | ✅ pass | ~12s |
| 2 | `cd app/web && bun run typecheck` | 0 | ✅ pass | ~4s |

## Diagnostics

- Console logs with `[GherkinPay]` prefix trace dialog open actions
- Anchor errors (e.g. "conditions not met", "invalid status") display in the TransactionStatus error section within each dialog
- `data-testid="release-payment-dialog"` and `data-testid="cancel-payment-dialog"` available for automated testing
- Failed transactions show retry button without requiring dialog reopen

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `app/web/src/components/release-payment-dialog.tsx` — Release confirmation dialog with milestone-aware amount display and TransactionStatus
- `app/web/src/components/cancel-payment-dialog.tsx` — Cancel confirmation dialog with refund amount calculation and destructive styling
- `app/web/src/components/agreements-client.tsx` — Added Release and Cancel buttons in actions column, wired to respective dialogs
- `.gsd/milestones/M002/slices/S03/tasks/T02-PLAN.md` — Added Observability Impact section per pre-flight requirement
