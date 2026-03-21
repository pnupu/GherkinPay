---
estimated_steps: 5
estimated_files: 2
---

# T02: Fund button and confirmation dialog on agreements page

**Slice:** S02 — Fund Payment
**Milestone:** M002

## Description

Add a "Fund" action button to Created payments on the agreements page that opens a confirmation dialog showing payment details, then signs and submits the fund transaction.

## Steps

1. Create `app/web/src/components/fund-payment-dialog.tsx` — shadcn Dialog showing: payment amount, payer wallet, payee wallet, escrow address. Includes a balance check: fetch payer's USDC token account balance and compare to payment amount. If insufficient, show error. If token account doesn't exist, show "No USDC token account found" message.
2. "Fund Payment" button in dialog calls `useFundPayment()` mutation. Display TransactionStatus during processing.
3. On success: close dialog, list refreshes automatically via cache invalidation.
4. On agreements page: add an actions column to the table. For payments with `status === 'created'`, show a "Fund" Button. Wire it to open FundPaymentDialog with the payment's PDA.
5. Run `bun run build` to verify.

## Must-Haves

- [ ] Fund button appears only on Created payments
- [ ] Balance check before allowing fund
- [ ] TransactionStatus feedback
- [ ] Dialog closes and list refreshes on success

## Verification

- `cd app/web && bun run build` exits 0
- Manual: Fund button visible on Created payment; clicking opens dialog with payment details

## Inputs

- `app/web/src/lib/mutations/fund-payment.ts` — useFundPayment hook (from T01)
- `app/web/src/lib/token.ts` — getUsdcAta (from T01)
- `app/web/src/components/transaction-status.tsx` — status display (from S01/T01)
- `app/web/src/app/(console)/agreements/page.tsx` — agreements page to modify

## Expected Output

- `app/web/src/components/fund-payment-dialog.tsx` — fund confirmation dialog
- `app/web/src/app/(console)/agreements/page.tsx` — updated with Fund action buttons
