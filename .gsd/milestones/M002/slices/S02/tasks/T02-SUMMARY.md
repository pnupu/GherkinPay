---
id: T02
parent: S02
milestone: M002
provides:
  - FundPaymentDialog component with balance check and transaction status
  - AgreementsClient component fetching real on-chain PaymentAgreement accounts
  - Fund button on Created payments opening confirmation dialog
key_files:
  - app/web/src/components/fund-payment-dialog.tsx
  - app/web/src/components/agreements-client.tsx
  - app/web/src/app/(console)/agreements/page.tsx
key_decisions:
  - Extracted agreements table into a separate AgreementsClient component to keep the page component as a thin server-rendered shell while the client component handles wallet-dependent data fetching
  - Fetched all PaymentAgreement accounts via program.account.paymentAgreement.all() with a 30s refetch interval for near-real-time updates
patterns_established:
  - On-chain account listing via useQuery + program.account.*.all() with queryKey ["agreements"] and refetch polling
  - Balance check pattern: fetch ATA account info first (existence check), then getTokenAccountBalance for amount
observability_surfaces:
  - "[GherkinPay] Fetching payment agreements…" and "[GherkinPay] Fetched N payment agreements" on list load
  - "[GherkinPay] Fund dialog: payer USDC balance:" logged on dialog open
  - "[GherkinPay] Fund dialog: initiating fund for payment:" logged on fund button click
  - "[GherkinPay] Fund dialog: payer ATA not found:" when token account doesn't exist
duration: 12m
verification_result: passed
completed_at: 2026-03-20
blocker_discovered: false
---

# T02: Fund button and confirmation dialog on agreements page

**Added Fund button on Created payments that opens a confirmation dialog with balance check, escrow details, and TransactionStatus feedback using real on-chain data**

## What Happened

Created three files:

1. `components/fund-payment-dialog.tsx` — FundPaymentDialog component that displays payment amount, payer/payee addresses, escrow address, and source ATA. On open, it fetches the payer's USDC Token-2022 ATA balance via `connection.getTokenAccountBalance()`. Shows clear errors for missing token accounts or insufficient balance. Uses `useFundPayment()` mutation from T01 with TransactionStatus feedback. Auto-closes 2 seconds after successful funding.

2. `components/agreements-client.tsx` — AgreementsClient component that replaces the hardcoded mock data on the agreements page. Fetches all on-chain PaymentAgreement accounts via `program.account.paymentAgreement.all()` with a 30-second refetch interval. Renders them in a table with ID, payer, payee, type, amount, status badge, and an actions column. The Fund button appears only for payments with `status === 'created'`.

3. Updated `app/(console)/agreements/page.tsx` — Simplified to a server component shell that renders the header and delegates the table to `<AgreementsClient />`.

## Verification

- `bun run typecheck` passes clean (exit 0)
- `bun run build` passes clean (exit 0, all pages generated)
- Fund button rendered only for `status === 'created'` payments (conditional in JSX)
- Balance check executes on dialog open (fetches ATA info and token balance)
- TransactionStatus component integrated for loading/success/error feedback
- Dialog auto-closes on success, list refreshes via cache invalidation from T01's mutation

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run build` | 0 | ✅ pass | 15.1s |
| 2 | `cd app/web && bun run typecheck` | 0 | ✅ pass | 4.2s |

## Diagnostics

- Filter browser DevTools console by `[GherkinPay]` to see agreement fetch and fund dialog events
- On dialog open: balance check result logged with payer ATA address
- On fund initiation: payment PDA logged before calling useFundPayment()
- Missing token account: "[GherkinPay] Fund dialog: payer ATA not found:" with ATA address
- Balance fetch errors: "[GherkinPay] Fund dialog: balance fetch error:" with error object

## Deviations

- Replaced hardcoded mock agreement data with real on-chain data fetching via `program.account.paymentAgreement.all()`. The original page had static mock entries; the new implementation queries the Anchor program for all PaymentAgreement accounts. This is necessary for the Fund button to work on real payments.
- Created a separate `agreements-client.tsx` component rather than making the page itself a client component, keeping the page as a server component shell.

## Known Issues

- SSG pre-render logs WalletContext warnings during build (expected — client components using wallet hooks have no provider during static generation). These are warnings only and don't affect runtime behavior.
- Manual devnet verification (fund a Created payment, see status change to Active) requires a connected wallet with USDC balance — deferred to integration testing.

## Files Created/Modified

- `app/web/src/components/fund-payment-dialog.tsx` — New: FundPaymentDialog with balance check, escrow details, and TransactionStatus
- `app/web/src/components/agreements-client.tsx` — New: AgreementsClient fetching real on-chain data with Fund action buttons
- `app/web/src/app/(console)/agreements/page.tsx` — Updated: simplified to server shell delegating to AgreementsClient
