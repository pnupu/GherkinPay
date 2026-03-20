# S02: Fund Payment

**Goal:** Users can fund a created payment from their connected wallet's USDC token account, moving funds into escrow and changing the payment status to Active.
**Demo:** Navigate to Agreements page → see a Created payment → click "Fund" → confirmation dialog shows amount and escrow details → sign transaction → payment status changes to Active in the list.

## Must-Haves

- Fund button visible on Created payments with finalized conditions
- Confirmation dialog showing amount, escrow address, and payer token account
- Token-2022 ATA lookup for payer's USDC token account
- `useFundPayment()` mutation hook with cache invalidation
- Transaction status feedback (loading/success/error)
- Handle case where payer's token account doesn't exist (clear error message)

## Proof Level

- This slice proves: integration (real fund transaction on devnet)
- Real runtime required: yes (devnet, connected wallet with USDC balance)
- Human/UAT required: yes (wallet signing)

## Verification

- `bun run build` passes clean in `app/web`
- `bun run typecheck` passes clean in `app/web`
- Manual verification: fund a Created payment on devnet; payment status shows Active; escrow token account holds the USDC amount

## Tasks

- [ ] **T01: Fund payment mutation hook and ATA lookup** `est:30m`
  - Why: The fund flow needs a mutation hook that derives the payer's USDC ATA, builds the fundPayment instruction, signs, confirms, and invalidates cache. The ATA lookup pattern (Token-2022 program ID) is also needed for release in S03.
  - Files: `app/web/src/lib/mutations/fund-payment.ts`, `app/web/src/lib/token.ts`
  - Do: Create `lib/token.ts` with a `getUsdcAta(owner: PublicKey)` helper using `getAssociatedTokenAddressSync` with `TOKEN_2022_PROGRAM_ID`. Create `useFundPayment()` mutation hook: accepts paymentPDA, derives escrowPDA and conditionPDA, looks up payer ATA, calls `program.methods.fundPayment()` with correct accounts (payer = connected wallet), confirms, invalidates `["agreements"]` cache.
  - Verify: `bun run typecheck` passes
  - Done when: `useFundPayment()` compiles with correct types and `getUsdcAta()` returns correct Token-2022 ATA addresses

- [ ] **T02: Fund button and confirmation dialog on agreements page** `est:30m`
  - Why: Users need a UI surface to trigger funding — a button on Created payments that opens a confirmation dialog before signing.
  - Files: `app/web/src/components/fund-payment-dialog.tsx`, `app/web/src/app/(console)/agreements/page.tsx`
  - Do: Create `FundPaymentDialog` component: shadcn Dialog with payment summary (amount, payer, payee, escrow), "Fund" confirm button, and TransactionStatus display. On the agreements page, add a "Fund" action button to each row where `status === 'created'`. Clicking opens the FundPaymentDialog. The dialog checks if the payer's USDC token account exists and has sufficient balance — if not, show a clear error instead of the fund button.
  - Verify: `bun run build` passes; Fund button appears on Created payments
  - Done when: Fund button opens dialog, signs transaction, payment status updates to Active in the list

## Files Likely Touched

- `app/web/src/lib/mutations/fund-payment.ts`
- `app/web/src/lib/token.ts`
- `app/web/src/components/fund-payment-dialog.tsx`
- `app/web/src/app/(console)/agreements/page.tsx`
