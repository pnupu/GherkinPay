# S03: Release and Cancel — UAT

**Milestone:** M002
**Written:** 2026-03-20

## UAT Type

- UAT mode: live-runtime
- Why this mode is sufficient: Release and cancel are on-chain transactions requiring a connected wallet, funded payments, and real devnet state. Artifact-driven verification (build + typecheck) is already passed; this UAT proves the runtime lifecycle.

## Preconditions

- Next.js dev server running (`cd app/web && bun run dev`)
- Browser with Phantom or Solflare wallet extension installed
- Wallet connected to **Solana devnet** with ≥1 SOL for fees
- Wallet has devnet USDC balance (Token-2022 mint) — at least 10 USDC recommended
- Wallet address is allowlisted in the compliance hook program (for Token-2022 transfers)
- At least one PaymentAgreement already created and funded (Active status) with a **past** TimeBased condition for release testing
- At least one PaymentAgreement in Created or Active status for cancel testing

## Smoke Test

Navigate to `/agreements`. Verify the table loads real on-chain data (not hardcoded). Active payments should show both "Release" and "Cancel" buttons. Created payments should show only "Cancel". Completed/Cancelled payments should show no action buttons.

## Test Cases

### 1. Release a simple payment with TimeBased condition

1. Create a simple payment with a single TimeBased condition whose `unlockAt` is in the past (e.g. 5 minutes ago)
2. Fund the payment — status changes to Active
3. On the agreements page, click **"Release"** on the now-Active payment
4. Verify the Release dialog opens showing:
   - Payee address (truncated)
   - Release amount matching the payment's total amount
   - "Simple Payment" type indicator
5. Click **"Confirm Release"**
6. Wallet popup appears — sign the transaction(s)
7. **Expected:** TransactionStatus shows "Processing…" then "Success". Console logs show `[GherkinPay] Cranking TimeBased condition index=0` followed by `[GherkinPay] evaluateAndRelease tx: <signature>`. Dialog auto-closes after ~2 seconds. Payment status in the table updates to **Completed**.
8. Verify on Solana Explorer that the payee's USDC token account balance increased by the release amount.

### 2. Cancel a funded (Active) payment

1. Create and fund a payment (any condition type) — status is Active
2. Note the payer's USDC balance before cancellation
3. On the agreements page, click **"Cancel"** on the Active payment
4. Verify the Cancel dialog opens showing:
   - Payer address (refund recipient, truncated)
   - Refund amount = totalAmount − releasedAmount
   - Red destructive "Cancel Payment" button
5. Click **"Cancel Payment"**
6. Wallet popup appears — sign the transaction
7. **Expected:** TransactionStatus shows "Processing…" then "Success". Console logs show `[GherkinPay] cancelPayment tx: <signature>`. Dialog auto-closes after ~2 seconds. Payment status updates to **Cancelled**.
8. Verify on Solana Explorer that the payer's USDC balance increased by the refund amount.

### 3. Cancel a Created (unfunded) payment

1. Create a payment but do NOT fund it — status is Created
2. On the agreements page, verify only **"Cancel"** button is visible (no "Release")
3. Click **"Cancel"**
4. Confirm in the dialog
5. **Expected:** Payment status changes to Cancelled. No USDC transfer occurs (nothing was escrowed).

### 4. Release a milestone payment (milestone 0)

1. Create a 2-milestone payment with TimeBased conditions (past timestamps) on both milestones
2. Fund the payment
3. Click **"Release"** on the Active payment
4. Verify the Release dialog shows "Milestone 1 of 2" and the amount for milestone 0 only
5. Confirm and sign
6. **Expected:** Milestone 0 releases. Payment remains Active (milestone 1 still pending). Console logs show crankTime for milestone 0's conditions, then evaluateAndRelease with nextConditionPDA pointing to milestone 1's conditionAccount. Agreements list refreshes showing updated state.

### 5. Release last milestone of a milestone payment

1. After test case 4, click **"Release"** again on the same payment
2. Verify dialog shows "Milestone 2 of 2" and the amount for milestone 1
3. Confirm and sign
4. **Expected:** Milestone 1 releases. Payment status changes to **Completed**. Console shows evaluateAndRelease with nextConditionPDA = same as current conditionPDA (last milestone case).

### 6. Agreements list auto-refresh after mutations

1. After any release or cancel operation, observe the agreements table
2. **Expected:** The table updates within a few seconds without manual page refresh. Status badges change color and text. Action buttons appear/disappear based on new status.

## Edge Cases

### Release with conditions not yet met

1. Create and fund a payment with a TimeBased condition set far in the future (e.g. 1 year from now)
2. Click "Release" on the Active payment
3. Confirm in the dialog
4. **Expected:** Transaction fails. TransactionStatus shows error: "Conditions not met — all conditions must be satisfied before release." Payment remains Active.

### Cancel a completed payment

1. This should be impossible from the UI — Completed payments should NOT show a Cancel button
2. **Expected:** No Cancel button visible on Completed payments. If somehow triggered, the Anchor program returns "Cannot cancel a completed payment."

### Release on a Created (unfunded) payment

1. This should be impossible from the UI — Created payments should NOT show a Release button
2. **Expected:** No Release button visible on Created payments.

### Wallet disconnected during operation

1. Start a release or cancel flow, then disconnect wallet before signing
2. **Expected:** Transaction fails gracefully. TransactionStatus shows an error. No partial state corruption.

## Failure Signals

- Agreements table shows no data or "Loading…" indefinitely → wallet not connected or RPC endpoint unreachable
- Release button visible on non-Active payments → conditional rendering broken
- Cancel button visible on Completed/Cancelled payments → conditional rendering broken
- "Conditions not met" error on a payment with past TimeBased condition → crankTime pre-flight not firing
- Dialog does not auto-close after success → success callback or timer broken
- Table doesn't refresh after mutation → cache invalidation (`["agreements"]`) not wired
- Wallet popup does not appear → Anchor provider or wallet adapter not configured

## Not Proven By This UAT

- Oracle, TokenGate, Multisig, or Webhook condition cranking (M003/S01 scope)
- Create Payment wizard flow (proven in S01 UAT)
- Fund Payment flow (proven in S02 UAT)
- Mobile wallet adapter support (R019 deferred)
- Multi-token support (R020 out of scope)
- Mainnet deployment (R021 out of scope)

## Notes for Tester

- The crankTime call is permissionless and automatic — you don't need to manually crank before clicking Release. The hook detects unmet TimeBased conditions with past timestamps and cranks them as part of the release flow.
- For milestone payments, release must be called once per milestone in order (milestone 0 first, then 1, etc.).
- If you see SSG pre-render warnings in the dev server terminal, they're expected and harmless — wallet-dependent components can't pre-render.
- Filter browser DevTools console by `[GherkinPay]` to see detailed transaction flow logs.
- Devnet USDC can be obtained from the SPL Token faucet or by minting from the devnet USDC authority.
