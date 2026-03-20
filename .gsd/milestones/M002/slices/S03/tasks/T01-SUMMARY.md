---
id: T01
parent: S03
milestone: M002
provides:
  - useReleasePayment mutation hook with crankTime + nextConditionAccount logic
  - useCancelPayment mutation hook
key_files:
  - app/web/src/lib/mutations/release-payment.ts
  - app/web/src/lib/mutations/cancel-payment.ts
key_decisions:
  - authority account omitted from cancelPayment accounts object — Anchor auto-derives it via the payment relation
patterns_established:
  - crankTime pre-flight pattern: before evaluateAndRelease, iterate conditions and crank any unmet TimeBased conditions with past unlockAt
observability_surfaces:
  - Console logs: "[GherkinPay] Releasing payment:", "[GherkinPay] Cranking TimeBased condition index=N", "[GherkinPay] evaluateAndRelease tx:", "[GherkinPay] cancelPayment tx:"
  - Error logs: "[GherkinPay] Release payment failed:" and "[GherkinPay] Cancel payment failed:" with full error
duration: 15m
verification_result: passed
completed_at: 2026-03-20
blocker_discovered: false
---

# T01: Release and cancel mutation hooks

**Built useReleasePayment (with crankTime pre-flight and nextConditionAccount branching) and useCancelPayment mutation hooks**

## What Happened

Created two mutation hooks following the established pattern from `useFundPayment`:

**`useReleasePayment`** — Accepts a `paymentPDA`, fetches the on-chain `PaymentAgreement` to read `isMilestone`, `currentMilestone`, `milestoneCount`, `payee`, and `tokenMint`. Derives the current milestone's `conditionPDA`. Resolves `nextConditionPDA` with three-way branching: simple payment → same PDA; last milestone (`currentMilestone === milestoneCount - 1`) → same PDA; mid-milestone → derives next milestone's conditionPDA. Before calling `evaluateAndRelease`, fetches the `conditionAccount` and iterates its conditions array, calling `crankTime(index)` for any `TimeBased` condition whose `unlockAt` is in the past and `met` is false. Then calls `evaluateAndRelease` with all required accounts. Invalidates both `["agreements"]` and `["milestones"]` caches.

**`useCancelPayment`** — Accepts a `paymentPDA`, fetches the account for `tokenMint` and `payer`, derives `escrowPDA` and `payerAta`, calls `cancelPayment`. The `authority` account is auto-derived by Anchor from the payment relation (has `relations: ["payment"]` in the IDL), so it is not passed explicitly. Invalidates `["agreements"]` cache.

## Verification

- `bun run typecheck` passes clean (exit 0, no errors)
- `bun run build` passes clean (exit 0, all routes built)
- Account structures match the test file's `evaluateAndRelease` and `cancelPayment` calls
- nextConditionAccount logic covers all three cases from the test: simple (same PDA), milestone 0→1 (next PDA), last milestone (same PDA)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run typecheck` | 0 | ✅ pass | ~5s |
| 2 | `cd app/web && bun run build` | 0 | ✅ pass | ~15s |

## Diagnostics

- Console logs with `[GherkinPay]` prefix trace the full release/cancel flow: account derivation, crank operations, and final transaction signatures
- Errors surface the full Anchor error (e.g. "conditions not met", "invalid status") via `onError` console.error

## Deviations

- Removed explicit `authority` from `cancelPayment` accounts — the IDL marks it as auto-derived via `relations: ["payment"]`, and TypeScript rejected the explicit property. The connected wallet still signs as authority through the Anchor provider.

## Known Issues

None.

## Files Created/Modified

- `app/web/src/lib/mutations/release-payment.ts` — useReleasePayment hook with crankTime pre-flight and nextConditionAccount three-way logic
- `app/web/src/lib/mutations/cancel-payment.ts` — useCancelPayment hook with escrow refund to payer
