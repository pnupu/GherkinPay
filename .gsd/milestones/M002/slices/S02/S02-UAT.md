# S02: Fund Payment — UAT

**Milestone:** M002
**Written:** 2026-03-20

## UAT Type

- UAT mode: live-runtime
- Why this mode is sufficient: Funding a payment requires a real on-chain transaction — signing with a wallet, moving USDC into escrow, and verifying the status change on devnet. Artifact-driven verification cannot prove the transaction actually works.

## Preconditions

- `app/web` dev server running (`bun run dev` in `app/web`)
- Browser open to `http://localhost:3000/agreements`
- Phantom or Solflare wallet connected to **devnet** with the payer address
- Payer wallet has USDC (Token-2022 mint `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`) balance ≥ the payment amount to fund
- At least one **Created** PaymentAgreement exists on devnet (created via the Create Payment wizard from S01)
- Browser DevTools console open, filtered by `[GherkinPay]`

## Smoke Test

Navigate to `/agreements` → verify the agreements table loads with real on-chain data (not mock data) → confirm at least one row shows status "created" with a visible "Fund" button in the actions column.

## Test Cases

### 1. Fund a simple Created payment

1. Navigate to `/agreements`
2. Locate a row with status badge showing "created" and type "simple"
3. Click the **Fund** button in the actions column
4. **Expected:** FundPaymentDialog opens showing:
   - Payment amount in USDC
   - Payer wallet address (truncated)
   - Payee wallet address (truncated)
   - Escrow token account address
   - Source (payer) ATA address
   - Current USDC balance of the payer
5. Click the **Fund** confirm button in the dialog
6. **Expected:** Wallet popup appears requesting transaction signature
7. Sign the transaction in the wallet
8. **Expected:** TransactionStatus shows loading state ("Processing…" or similar)
9. Wait for confirmation
10. **Expected:** TransactionStatus shows success; dialog auto-closes after ~2 seconds
11. **Expected:** The payment row in the table now shows status "active" (list refreshed automatically via cache invalidation)

### 2. Fund a milestone Created payment

1. Create a milestone payment via the Create Payment wizard (2 milestones, each with a condition)
2. Navigate to `/agreements`
3. Locate the newly created milestone payment with status "created"
4. Click **Fund** → confirm in dialog → sign wallet transaction
5. **Expected:** Transaction succeeds; payment status changes to "active" in the list

### 3. Verify on-chain state after funding

1. After successfully funding a payment (test case 1 or 2), note the transaction signature from the DevTools console (`[GherkinPay] fundPayment tx:` log)
2. Open Solana Explorer (devnet) and search for the transaction signature
3. **Expected:** Transaction shows a successful `fundPayment` instruction
4. Check the escrow token account address (logged in `[GherkinPay] fundPayment accounts:`)
5. **Expected:** Escrow token account holds the payment amount in USDC

### 4. Console observability verification

1. Open browser DevTools → Console, filter by `[GherkinPay]`
2. Open the Fund dialog for any Created payment
3. **Expected:** Console shows `[GherkinPay] Fund dialog: payer USDC balance:` with the balance amount
4. Click Fund and sign the transaction
5. **Expected:** Console shows in sequence:
   - `[GherkinPay] Fund dialog: initiating fund for payment:` with payment PDA
   - `[GherkinPay] Funding payment:` with payment PDA
   - `[GherkinPay] fundPayment accounts:` with all derived PDA addresses
   - `[GherkinPay] fundPayment tx:` with the transaction signature

## Edge Cases

### Payer has no USDC token account

1. Connect a wallet that has never held USDC (no ATA exists)
2. Navigate to `/agreements` and click **Fund** on a Created payment
3. **Expected:** Dialog shows a clear error message indicating the USDC token account was not found — the Fund confirm button is disabled or hidden. Console shows `[GherkinPay] Fund dialog: payer ATA not found:` with the derived ATA address.

### Insufficient USDC balance

1. Connect a wallet with USDC balance less than the payment amount
2. Click **Fund** on a Created payment
3. **Expected:** Dialog shows the current balance and indicates insufficient funds — the Fund confirm button is disabled or shows an error state.

### Wallet disconnected

1. Disconnect the wallet
2. Navigate to `/agreements`
3. **Expected:** The agreements table still renders (may be empty or show connection prompt). No Fund buttons should be actionable without a connected wallet.

### User rejects wallet signature

1. Click **Fund** on a Created payment, dialog opens
2. Click the Fund confirm button
3. When the wallet popup appears, click **Reject/Cancel**
4. **Expected:** TransactionStatus shows an error state. Dialog remains open (does not auto-close). The payment status remains "created" in the list.

### Attempt to fund an already Active payment

1. After successfully funding a payment, verify the row shows "active"
2. **Expected:** No Fund button appears for active payments — the button is conditionally rendered only for `status === 'created'`.

## Failure Signals

- Agreements table shows hardcoded mock data instead of on-chain accounts → AgreementsClient not wired correctly
- Fund button appears on Active or other non-Created payments → status filter logic broken
- Dialog opens but shows no balance or "NaN" → ATA lookup or balance parsing failed
- Transaction fails with `AccountNotInitialized` → escrow PDA derivation wrong or conditions not finalized
- Transaction fails with `ConstraintTokenMint` → USDC mint address mismatch between token.ts and on-chain account
- Payment status doesn't change after successful transaction → cache invalidation not working (check `["agreements"]` query key)
- Console shows no `[GherkinPay]` logs → observability logging stripped or component not mounted

## Not Proven By This UAT

- Release flow (S03 scope) — funded payments can't be released yet
- Cancel flow (S03 scope) — funded payments can't be cancelled yet
- Multi-user scenarios — only single-wallet funding tested
- Mainnet USDC (devnet only)
- Filtering agreements by connected wallet — all accounts are fetched regardless of payer/payee
- Performance at scale — `program.account.paymentAgreement.all()` fetches everything

## Notes for Tester

- WalletContext warnings in the build output and browser console during SSR/SSG are expected and benign — they occur because client components using wallet hooks have no provider during static page generation.
- The agreements table fetches ALL on-chain PaymentAgreement accounts (not filtered by wallet). You may see payments created by other testers.
- The 30-second refetch interval means external changes (payments created by others) may take up to 30s to appear, but your own fund actions trigger immediate cache invalidation.
- If you need to create a fresh payment to fund, use the Create Payment wizard from S01 first.
