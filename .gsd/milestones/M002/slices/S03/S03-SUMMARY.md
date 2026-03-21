---
id: S03
parent: M002
milestone: M002
provides:
  - useReleasePayment mutation hook with crankTime pre-flight and nextConditionAccount three-way branching
  - useCancelPayment mutation hook with escrow refund to payer
  - ReleasePaymentDialog component with milestone awareness and TransactionStatus feedback
  - CancelPaymentDialog component with refund amount calculation and TransactionStatus feedback
  - AgreementsClient component fetching real on-chain PaymentAgreement accounts with action buttons
  - Complete payment lifecycle UI (create → fund → release/cancel) from the browser on devnet
requires:
  - slice: S01
    provides: TransactionStatus component pattern, useMutation + queryClient.invalidateQueries pattern, shadcn form components
  - slice: S02
    provides: getUsdcAta() Token-2022 ATA helper, funded Active payments on devnet, token account lookup pattern
  - slice: M001/S02
    provides: useAnchorProgram hook, wallet adapter (useWallet, useConnection)
  - slice: M001/S03
    provides: useAgreements query hook, React Query queryClient, PDA helpers
affects:
  - none (final slice in M002)
key_files:
  - app/web/src/lib/mutations/release-payment.ts
  - app/web/src/lib/mutations/cancel-payment.ts
  - app/web/src/components/release-payment-dialog.tsx
  - app/web/src/components/cancel-payment-dialog.tsx
  - app/web/src/components/agreements-client.tsx
  - app/web/src/components/transaction-status.tsx
  - app/web/src/lib/anchor.ts
  - app/web/src/lib/pda.ts
  - app/web/src/lib/constants.ts
  - app/web/src/lib/token.ts
  - app/web/src/lib/utils.ts
  - app/web/src/types/gherkin_pay.ts
  - app/web/src/idl/gherkin_pay.json
  - app/web/src/app/(console)/agreements/page.tsx
key_decisions:
  - Recreated all S01/S02 prerequisite infrastructure (14 files) in T02 since prior slice code was never committed to the M002 worktree branch
  - Authority account omitted from cancelPayment accounts — Anchor auto-derives it via relations on the payment account
  - Used CSS-in-JSX (style jsx) for dialog and status components instead of external CSS
  - Mapped Anchor error names (ConditionsNotMet, CannotCancelCompleted) to user-readable messages
patterns_established:
  - crankTime pre-flight pattern: before evaluateAndRelease, iterate conditions and crank any unmet TimeBased conditions with past unlockAt
  - Dialog pattern: overlay + panel with info rows, TransactionStatus feedback, auto-close on success after 2s
  - Conditional action buttons: Release shown only for Active status, Cancel shown for Created or Active
  - On-chain data fetching via useQuery + program.account.paymentAgreement.all() with 30s polling
observability_surfaces:
  - "[GherkinPay] Releasing payment:" and "[GherkinPay] evaluateAndRelease tx:" on release flow
  - "[GherkinPay] Cancelling payment:" and "[GherkinPay] cancelPayment tx:" on cancel flow
  - "[GherkinPay] Cranking TimeBased condition index=N" when crankTime pre-flight fires
  - "[GherkinPay] Fetching payment agreements…" and "[GherkinPay] Fetched N payment agreements" on list load
  - TransactionStatus role="status" aria-live="polite" for programmatic observation
  - Status badges with CSS class names (status-created, status-active, status-completed, status-cancelled)
drill_down_paths:
  - .gsd/milestones/M002/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S03/tasks/T02-SUMMARY.md
duration: 33m
verification_result: passed
completed_at: 2026-03-20
---

# S03: Release and Cancel

**Release and cancel mutation hooks with confirmation dialogs and action buttons on the agreements page — completing the full payment lifecycle UI on devnet**

## What Happened

T01 built two mutation hooks. `useReleasePayment` accepts a payment PDA, fetches the on-chain PaymentAgreement to determine milestone state, derives the current conditionPDA and nextConditionPDA with three-way branching (simple → same PDA, last milestone → same PDA, mid-milestone → next milestone's conditionPDA). Before calling `evaluateAndRelease`, it iterates the condition account's conditions array and calls `crankTime(index)` for any unmet TimeBased condition whose `unlockAt` is in the past. `useCancelPayment` derives escrowPDA and payer ATA, calls `cancelPayment`, and lets Anchor auto-derive the authority from the payment relation. Both hooks invalidate the `["agreements"]` and `["milestones"]` query caches on success.

T02 built the UI layer: `ReleasePaymentDialog` shows payment summary, payee address, release amount, and milestone context (X of Y for milestone payments). `CancelPaymentDialog` shows refund amount (totalAmount − releasedAmount) and payer address with destructive-action styling. Both integrate `TransactionStatus` for loading/success/error feedback and auto-close 2s after success. `AgreementsClient` replaces hardcoded data with real on-chain fetching via `program.account.paymentAgreement.all()` with 30s polling, rendering a table with conditional action buttons — Release on Active payments only, Cancel on Created/Active payments only. Because S01/S02 code was never committed to the worktree branch, T02 also recreated all 14 prerequisite files (Anchor hooks, PDA helpers, IDL, token utils, constants, types, and both mutation hooks from T01).

## Verification

- `bun run typecheck` passes clean (exit 0) — strict mode with noUncheckedIndexedAccess
- `bun run build` passes clean (exit 0) — agreements page bundles at 146 kB first load JS, all routes compile
- All 17 deliverable + infrastructure files exist and compile
- Release button conditionally rendered only on Active status; Cancel button on Created or Active; neither on Completed/Cancelled
- Both dialogs integrate TransactionStatus with idle/loading/success/error states
- Cache invalidation wired on both success paths
- nextConditionAccount logic covers simple, milestone-in-progress, and last-milestone cases

## New Requirements Surfaced

- none

## Deviations

- T02 recreated all S01/S02 prerequisite infrastructure (14 files plus npm dependencies) because prior slice code was never committed to the M002 worktree branch. This was unplanned but necessary for compilation.
- Installed Solana/Anchor npm dependencies (@coral-xyz/anchor, @solana/web3.js, wallet-adapter-react, wallet-adapter-base, spl-token, clsx) in T02 since they weren't present.
- Built Anchor IDL from source via `anchor build` in T02 since target/ directory was missing.

## Known Limitations

- Full devnet integration testing (create → fund → crank → release, and create → fund → cancel) requires a connected wallet with USDC balance and a wallet adapter provider wrapping the app — deferred to manual UAT.
- SSG pre-render warnings for wallet-dependent client components are expected and don't affect runtime.
- crankTime pre-flight only handles TimeBased conditions; Oracle, TokenGate, Multisig, and Webhook cranks are M003 scope.

## Follow-ups

- none — this is the final slice in M002. All remaining condition crank types are M003/S01 scope.

## Files Created/Modified

- `app/web/src/lib/mutations/release-payment.ts` — useReleasePayment hook with crankTime pre-flight and nextConditionAccount three-way logic
- `app/web/src/lib/mutations/cancel-payment.ts` — useCancelPayment hook with escrow refund to payer
- `app/web/src/components/release-payment-dialog.tsx` — Release confirmation dialog with milestone awareness and TransactionStatus
- `app/web/src/components/cancel-payment-dialog.tsx` — Cancel confirmation dialog with refund calculation and TransactionStatus
- `app/web/src/components/agreements-client.tsx` — Agreements table with on-chain data fetching and conditional action buttons
- `app/web/src/components/transaction-status.tsx` — Reusable transaction status display (idle/loading/success/error)
- `app/web/src/app/(console)/agreements/page.tsx` — Simplified to server shell delegating to AgreementsClient
- `app/web/src/lib/anchor.ts` — useAnchorProgram hook with typed GherkinPay program
- `app/web/src/lib/pda.ts` — PDA derivation helpers (payment, escrow, condition)
- `app/web/src/lib/constants.ts` — PROGRAM_ID, SOLANA_RPC_URL, USDC_MINT
- `app/web/src/lib/token.ts` — Token-2022 ATA derivation helper
- `app/web/src/lib/utils.ts` — cn, truncateAddress, formatTokenAmount utilities
- `app/web/src/types/gherkin_pay.ts` — Anchor-generated TypeScript IDL types
- `app/web/src/idl/gherkin_pay.json` — Anchor IDL JSON (built from source)
- `app/web/package.json` — Added Solana/Anchor runtime dependencies

## Forward Intelligence

### What the next slice should know
- The full M002 lifecycle is wired: create → fund → release/cancel. M003 slices can assume all mutation patterns are established and the agreements page shows real data with action buttons.
- The crankTime pre-flight pattern in useReleasePayment is the template for adding Oracle/TokenGate/Multisig/Webhook cranks in M003/S01.
- All infrastructure files (anchor.ts, pda.ts, constants.ts, token.ts, utils.ts, types, IDL) are now committed and available for M003 slices.

### What's fragile
- The S01/S02 code was recreated in this slice's T02, not carried forward from prior tasks. If S01/S02 are re-executed on this branch, there may be file conflicts with the versions T02 created.
- nextConditionAccount derivation assumes the Anchor IDL's account structure for PaymentAgreement has `isMilestone`, `currentMilestone`, and `milestoneCount` fields — if the contract changes these, the three-way branching breaks.

### Authoritative diagnostics
- Filter browser console by `[GherkinPay]` to trace all release/cancel/crank operations with transaction signatures
- TransactionStatus components have `role="status"` and `aria-live="polite"` — observable programmatically
- Status badges use `.status-created`, `.status-active`, `.status-completed`, `.status-cancelled` CSS classes

### What assumptions changed
- Assumed S01/S02 code would be on disk — it wasn't; T02 had to recreate 14 prerequisite files plus install npm dependencies. This is now documented in KNOWLEDGE.md.
- Assumed `authority` must be passed explicitly to `cancelPayment` — Anchor auto-derives it via `relations: ["payment"]` on the IDL, and TypeScript rejects the explicit property.
