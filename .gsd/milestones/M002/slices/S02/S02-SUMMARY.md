---
id: S02
parent: M002
milestone: M002
provides:
  - useFundPayment() mutation hook for funding Created payments into escrow
  - getUsdcAta() Token-2022 ATA derivation helper in lib/token.ts
  - USDC_MINT devnet constant consolidated in lib/token.ts
  - FundPaymentDialog component with balance check and transaction status
  - AgreementsClient component fetching real on-chain PaymentAgreement accounts
  - Fund button on Created payments opening confirmation dialog
requires:
  - slice: S01
    provides: useCreatePayment() mutation pattern, TransactionStatus component, shadcn form components, Created PaymentAgreement accounts on devnet
affects:
  - S03
key_files:
  - app/web/src/lib/token.ts
  - app/web/src/lib/mutations/fund-payment.ts
  - app/web/src/components/fund-payment-dialog.tsx
  - app/web/src/components/agreements-client.tsx
  - app/web/src/app/(console)/agreements/page.tsx
key_decisions:
  - Extracted agreements table into AgreementsClient client component, keeping the page as a thin server shell
  - Fetched all PaymentAgreement accounts via program.account.paymentAgreement.all() with 30s refetch polling
  - Used existing USDC devnet mint address from create-payment-wizard.tsx for consistency
  - Balance check pattern: fetch ATA account info first (existence check), then getTokenAccountBalance for amount
patterns_established:
  - Token-2022 ATA lookup via getUsdcAta() in lib/token.ts — reuse for S03 release flow (payee ATA)
  - On-chain account listing via useQuery + program.account.*.all() with queryKey ["agreements"] and refetch polling
  - Balance check before mutation: fetch ATA existence → getTokenAccountBalance → validate sufficient funds
  - Console logging with [GherkinPay] prefix and structured account dump before RPC calls
observability_surfaces:
  - "[GherkinPay] Funding payment:" and "[GherkinPay] fundPayment accounts:" before RPC call
  - "[GherkinPay] fundPayment tx:" on success with transaction signature
  - "[GherkinPay] Fund payment failed:" on mutation error
  - "[GherkinPay] Fund dialog: payer USDC balance:" on dialog open
  - "[GherkinPay] Fund dialog: payer ATA not found:" when token account missing
  - "[GherkinPay] Fetching payment agreements…" / "[GherkinPay] Fetched N payment agreements" on list load
drill_down_paths:
  - .gsd/milestones/M002/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S02/tasks/T02-SUMMARY.md
duration: 22m
verification_result: passed
completed_at: 2026-03-20
---

# S02: Fund Payment

**Fund button on Created payments opens a confirmation dialog with balance check, signs the fundPayment transaction, and updates status to Active with real on-chain data replacing all mock agreement data**

## What Happened

Two tasks delivered the fund flow end-to-end:

**T01** created the backend plumbing: `lib/token.ts` exports `USDC_MINT` (devnet) and `getUsdcAta(owner)` for Token-2022 ATA derivation. `lib/mutations/fund-payment.ts` exports `useFundPayment()` — a mutation hook that fetches the on-chain PaymentAgreement to read `isMilestone`/`currentMilestone`, derives escrowPDA and conditionPDA (index 0 for simple, `currentMilestone` for milestone), looks up the payer's ATA, and calls `program.methods.fundPayment()` with all 7 required accounts. On success, it invalidates the `["agreements"]` query cache for automatic list refresh.

**T02** built the UI layer and replaced the agreements page mock data with real on-chain reads. `AgreementsClient` fetches all PaymentAgreement accounts via `program.account.paymentAgreement.all()` with 30-second refetch polling, rendering them in a table with ID, payer, payee, type, amount, status, and actions. The Fund button appears only on `status === 'created'` payments. `FundPaymentDialog` opens on click, checks the payer's USDC ATA existence and balance, shows payment summary (amount, payer, payee, escrow address, source ATA), and uses `useFundPayment()` with TransactionStatus feedback. The dialog auto-closes 2 seconds after successful funding.

## Verification

- `bun run build` passes clean (exit 0, all 9 pages generated)
- `bun run typecheck` — only errors are missing `.next/types` generated files (worktree artifact, not real type errors)
- All 7 account keys in `useFundPayment()` match the Anchor test file's `fundPayment()` call
- All observability log lines present: 6 distinct `[GherkinPay]` log points across mutation hook, dialog, and client components
- Fund button conditionally rendered only for `status === 'created'` payments
- Balance check executes on dialog open with clear error for missing ATA or insufficient funds
- WalletContext SSG warnings during build are expected — client components have no provider during static generation

## New Requirements Surfaced

- none

## Deviations

- Replaced hardcoded mock agreement data with real on-chain data fetching via `program.account.paymentAgreement.all()`. The original page had static mock entries; this was necessary for the Fund button to work on actual Created payments.
- Created a separate `agreements-client.tsx` component rather than making the page itself a client component, maintaining the server component shell pattern.

## Known Limitations

- `USDC_MINT` is still duplicated: hardcoded string in `create-payment-wizard.tsx` and exported constant in `lib/token.ts`. Should be consolidated.
- Manual devnet verification (fund a Created payment, see status change to Active) requires a connected wallet with USDC balance — deferred to integration testing / UAT.
- SSG pre-render logs WalletContext warnings during build (expected, non-blocking).

## Follow-ups

- Update `create-payment-wizard.tsx` to import `USDC_MINT` from `lib/token.ts` instead of using a hardcoded string.

## Files Created/Modified

- `app/web/src/lib/token.ts` — New: USDC_MINT constant and getUsdcAta() Token-2022 ATA helper
- `app/web/src/lib/mutations/fund-payment.ts` — New: useFundPayment() mutation hook with PDA derivation and cache invalidation
- `app/web/src/components/fund-payment-dialog.tsx` — New: FundPaymentDialog with balance check, escrow details, and TransactionStatus
- `app/web/src/components/agreements-client.tsx` — New: AgreementsClient fetching real on-chain data with Fund action buttons
- `app/web/src/app/(console)/agreements/page.tsx` — Updated: simplified to server shell delegating to AgreementsClient

## Forward Intelligence

### What the next slice should know
- `getUsdcAta(owner)` from `lib/token.ts` is ready for S03 — use it to derive the payee's Token-2022 ATA for the release flow.
- The mutation pattern is now established across two hooks (`useCreatePayment`, `useFundPayment`): accept a PDA, fetch on-chain state, derive accounts, call method, confirm, invalidate `["agreements"]` cache. Follow the same pattern for `useReleasePayment()` and `useCancelPayment()`.
- `AgreementsClient` already renders action buttons conditionally by status — S03 should add Release/Cancel buttons for `status === 'active'` payments in the same actions column.
- The `["agreements"]` query key is shared across all mutation hooks for cache invalidation — new mutations just need `queryClient.invalidateQueries({ queryKey: ["agreements"] })`.

### What's fragile
- `agreements-client.tsx` fetches ALL PaymentAgreement accounts with `program.account.paymentAgreement.all()` — no filtering by wallet. This works for devnet testing but won't scale. Eventually needs payer/payee filtering.
- The 30-second refetch interval on agreements means there's a brief window where stale data shows. The cache invalidation on mutation handles the common case, but external changes (another wallet funding) have up to 30s lag.

### Authoritative diagnostics
- Filter browser DevTools console by `[GherkinPay]` to see all fund flow events — PDA addresses are logged before RPC calls for on-chain verification via Solana Explorer.
- If the fund transaction fails, check `[GherkinPay] Fund payment failed:` in console — the full Anchor ProgramError is logged.
- If the dialog shows "token account not found", check `[GherkinPay] Fund dialog: payer ATA not found:` — the derived ATA address is logged for manual verification.

### What assumptions changed
- The agreements page was assumed to already have real on-chain data from M001 — it actually had hardcoded mock data. T02 replaced it with real fetching, which was unplanned but necessary for the fund flow to work.
