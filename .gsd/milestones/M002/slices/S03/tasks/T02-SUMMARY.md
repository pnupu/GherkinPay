---
id: T02
parent: S03
milestone: M002
provides:
  - ReleasePaymentDialog component with milestone awareness and TransactionStatus
  - CancelPaymentDialog component with refund amount calculation and TransactionStatus
  - AgreementsClient component fetching real on-chain PaymentAgreement accounts
  - Release button on Active payments only; Cancel button on Created/Active payments only
  - Agreements page updated as thin server shell
key_files:
  - app/web/src/components/release-payment-dialog.tsx
  - app/web/src/components/cancel-payment-dialog.tsx
  - app/web/src/components/agreements-client.tsx
  - app/web/src/app/(console)/agreements/page.tsx
  - app/web/src/lib/mutations/release-payment.ts
  - app/web/src/lib/mutations/cancel-payment.ts
  - app/web/src/components/transaction-status.tsx
  - app/web/src/lib/anchor.ts
  - app/web/src/lib/pda.ts
  - app/web/src/lib/constants.ts
  - app/web/src/lib/token.ts
  - app/web/src/lib/utils.ts
  - app/web/src/types/gherkin_pay.ts
  - app/web/src/idl/gherkin_pay.json
key_decisions:
  - Created all prerequisite infrastructure (Anchor hooks, PDA helpers, IDL, mutation hooks, TransactionStatus) in this task since prior slice code was never committed to the M002 worktree branch
  - Used CSS-in-JSX (style jsx) for dialog and status components instead of external CSS — keeps component styles co-located and avoids modifying the global stylesheet
  - Mapped Anchor error names (ConditionsNotMet, CannotCancelCompleted) to user-readable messages in dialog error handlers
patterns_established:
  - Dialog pattern: overlay + panel with info rows, TransactionStatus feedback, auto-close on success after 2s
  - Conditional action buttons pattern: Release shown only for Active status, Cancel shown for Created or Active
  - On-chain data fetching via useQuery + program.account.paymentAgreement.all() with 30s polling
observability_surfaces:
  - "[GherkinPay] Fetching payment agreements…" and "[GherkinPay] Fetched N payment agreements" on list load
  - "[GherkinPay] Releasing payment:" and "[GherkinPay] evaluateAndRelease tx:" on release flow
  - "[GherkinPay] Cancelling payment:" and "[GherkinPay] cancelPayment tx:" on cancel flow
  - "[GherkinPay] Cranking TimeBased condition index=N" when crankTime pre-flight fires
  - TransactionStatus role="status" aria-live="polite" for programmatic observation
  - Status badges with CSS class names (status-created, status-active, etc.) for selector-based querying
duration: 18m
verification_result: passed
completed_at: 2026-03-20
blocker_discovered: false
---

# T02: Release and cancel UI with action buttons

**Added Release and Cancel action buttons to agreements page with confirmation dialogs, TransactionStatus feedback, and real on-chain data fetching — completing the full payment lifecycle UI**

## What Happened

Created the full UI layer for release and cancel operations, plus all prerequisite infrastructure that prior slices had documented but never committed to this worktree branch.

**ReleasePaymentDialog** — Shows payment summary with payee address, release amount, and total payment amount. For milestone payments, displays "Milestone X of Y" context. Handles crankTime pre-flight for unmet TimeBased conditions automatically. Maps Anchor's `ConditionsNotMet` error to a clear user message. Auto-closes 2 seconds after success.

**CancelPaymentDialog** — Shows payment summary with payer address (refund recipient), refund amount (totalAmount − releasedAmount), and total amount. Red destructive button styling. Maps Anchor's `CannotCancelCompleted` error to clear message. Auto-closes on success.

**AgreementsClient** — Replaces hardcoded mock data with real on-chain PaymentAgreement account fetching via `program.account.paymentAgreement.all()` with 30-second polling. Renders table with ID, payer, payee, type, amount, status badge, and action buttons. Release button appears only on Active payments. Cancel button appears on Created and Active payments. Neither appears on Completed or Cancelled.

**Infrastructure** — Created lib/anchor.ts (useAnchorProgram with typed GherkinPay program), lib/pda.ts (PDA derivation), lib/constants.ts (PROGRAM_ID, RPC URL, USDC mint), lib/token.ts (Token-2022 ATA helper), lib/utils.ts (cn, truncateAddress, formatTokenAmount), types/gherkin_pay.ts (Anchor generated types), idl/gherkin_pay.json (built from Anchor), and components/transaction-status.tsx. Also created both mutation hooks from T01: useReleasePayment (with crankTime pre-flight) and useCancelPayment.

## Verification

- `bun run build` exits 0 — all pages compile, agreements page bundles at 146 kB first load JS
- `bun run typecheck` exits 0 — no type errors with strict mode + noUncheckedIndexedAccess
- Release button conditionally rendered only when status is Active (JSX conditional)
- Cancel button conditionally rendered only when status is Created or Active (JSX conditional)
- Both dialogs integrate TransactionStatus with loading/success/error states
- Dialog auto-close on success with 2-second delay
- Cache invalidation on success: ["agreements"] and ["milestones"] query keys

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run build` | 0 | ✅ pass | ~11s |
| 2 | `cd app/web && bun run typecheck` | 0 | ✅ pass | ~3s |

## Diagnostics

- Filter browser console by `[GherkinPay]` to trace agreement fetching, release flow (crank + evaluateAndRelease), and cancel flow
- TransactionStatus components render `role="status"` with `aria-live="polite"` — observable programmatically
- Status badges use class names `status-created`, `status-active`, `status-completed`, `status-cancelled` for selector-based querying
- Release errors: "Conditions not met — all conditions must be satisfied before release."
- Cancel errors: "Cannot cancel a completed payment." / "Payment cannot be cancelled in its current status."

## Deviations

- Created all prerequisite infrastructure (14 files) that S01 and S02 tasks documented but never committed to the M002 worktree branch. This was necessary for the T02 components to compile.
- Installed Solana/Anchor npm dependencies (@coral-xyz/anchor, @solana/web3.js, wallet-adapter-react, wallet-adapter-base, spl-token, clsx) in app/web since they weren't present.
- Built Anchor IDL from source via `anchor build` since target/ directory was missing.

## Known Issues

- Manual devnet verification (full lifecycle: create → fund → release / cancel) requires a connected wallet with USDC balance and a wallet adapter provider wrapping the app — deferred to integration testing.
- SSG pre-render warnings for wallet-dependent client components are expected and don't affect runtime.

## Files Created/Modified

- `app/web/src/components/release-payment-dialog.tsx` — Release confirmation dialog with milestone awareness and TransactionStatus
- `app/web/src/components/cancel-payment-dialog.tsx` — Cancel confirmation dialog with refund calculation and TransactionStatus
- `app/web/src/components/agreements-client.tsx` — Agreements table with on-chain data fetching and action buttons
- `app/web/src/components/transaction-status.tsx` — Reusable transaction status display (idle/loading/success/error)
- `app/web/src/app/(console)/agreements/page.tsx` — Simplified to server shell delegating to AgreementsClient
- `app/web/src/lib/mutations/release-payment.ts` — useReleasePayment hook with crankTime pre-flight
- `app/web/src/lib/mutations/cancel-payment.ts` — useCancelPayment hook
- `app/web/src/lib/anchor.ts` — useAnchorProgram hook with typed GherkinPay program
- `app/web/src/lib/pda.ts` — PDA derivation helpers (payment, escrow, condition)
- `app/web/src/lib/constants.ts` — PROGRAM_ID, SOLANA_RPC_URL, USDC_MINT
- `app/web/src/lib/token.ts` — Token-2022 ATA derivation helper
- `app/web/src/lib/utils.ts` — cn, truncateAddress, formatTokenAmount utilities
- `app/web/src/types/gherkin_pay.ts` — Anchor-generated TypeScript IDL types
- `app/web/src/idl/gherkin_pay.json` — Anchor IDL JSON (built from source)
- `app/web/package.json` — Added Solana/Anchor runtime dependencies
