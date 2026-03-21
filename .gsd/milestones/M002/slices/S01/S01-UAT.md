# S01: Create Payment Wizard — UAT

**Milestone:** M002
**Written:** 2026-03-20

## UAT Type

- UAT mode: mixed (artifact-driven build verification + live-runtime wallet signing)
- Why this mode is sufficient: Build/typecheck prove compilation and type correctness; live-runtime proves the wizard actually submits valid on-chain transactions via wallet signing.

## Preconditions

1. `app/web` dev server running (`bun run dev` in `app/web`)
2. Browser with Phantom or Solflare wallet extension installed
3. Wallet connected to **Solana devnet** with SOL for transaction fees (~0.01 SOL minimum)
4. Wallet has a USDC-devnet token account (any balance — the wizard creates agreements, not transfers)
5. A second wallet address available as the "payee" (can be any valid Solana pubkey)

## Smoke Test

1. Navigate to `http://localhost:3000/agreements`
2. Click the "Create payment" button
3. **Expected:** A Dialog wizard opens with Step 1 visible showing payment detail fields (mode toggle, payee, amount)

## Test Cases

### 1. Simple Payment with TimeBased Condition

1. Open the wizard from the Agreements page
2. In Step 1: Leave mode as "Simple", enter a valid payee wallet address, enter amount `0.01`
3. Click "Next"
4. In Step 2: A ConditionBuilder appears with AND/OR selector and one empty condition slot
5. Select condition type "TimeBased"
6. Enter a datetime in the future (e.g., tomorrow)
7. Click "Add Condition", add a second TimeBased condition with a different future date
8. Click "Next"
9. Step 3 shows a review summary: type "Simple", payer (your wallet), payee, USDC token, amount 0.01, 2 conditions listed
10. Click "Submit"
11. **Expected:** Wallet popup appears requesting signature. After signing, TransactionStatus shows "Confirming transaction…" spinner, then shows green checkmark with truncated tx signature linking to Solana Explorer devnet. The agreements list on the page behind the dialog refreshes to include the new payment.

### 2. Milestone Payment with Multiple Condition Types

1. Open the wizard
2. In Step 1: Switch to "Milestone" mode, enter payee address, enter total amount `0.05`
3. Set milestone count to 2, enter milestone 0 amount as `0.02` and milestone 1 amount as `0.03` (must sum to 0.05)
4. Click "Next"
5. Step 2 shows tabs for "Milestone 0" and "Milestone 1", each with its own ConditionBuilder
6. In Milestone 0 tab: add a TimeBased condition with a future date
7. In Milestone 1 tab: add a TokenGated condition — enter a valid mint address, min amount `1`, and a valid holder address
8. Verify green checkmarks appear on both milestone tabs indicating validity
9. Click "Next"
10. Review shows: type "Milestone", 2 milestones with their amounts and conditions
11. Click "Submit"
12. **Expected:** Multiple wallet popups appear (createMilestonePayment, addMilestone ×2, addCondition ×2, finalizeConditions ×2). Each instruction is confirmed sequentially. TransactionStatus eventually shows success. Agreements list refreshes.

### 3. Multisig Condition with Multiple Signers

1. Open the wizard, enter payee and amount in Step 1, advance to Step 2
2. Select condition type "Multisig"
3. Add 3 signer addresses (valid base58 pubkeys)
4. Set threshold to `2`
5. **Expected:** Form is valid — threshold (2) ≤ signers count (3)
6. Change threshold to `4`
7. **Expected:** Validation error appears — threshold exceeds signer count

### 4. Oracle Condition Fields

1. In Step 2 of the wizard, select condition type "Oracle"
2. Enter a valid feed account pubkey
3. Select comparison operator "gte" from the dropdown
4. Enter target value `100` and decimals `8`
5. **Expected:** All fields render correctly, form validates as complete

### 5. Webhook Condition Fields

1. In Step 2, select condition type "Webhook"
2. Enter a valid relayer pubkey
3. Enter an event hash (64 hex characters)
4. **Expected:** Form validates. If event hash is not exactly 64 hex chars, validation error appears.

### 6. AND/OR Operator Selection

1. In Step 2, add 2 conditions of any type
2. Toggle from AND to OR using the RadioGroup
3. **Expected:** Operator selection persists through to the review in Step 3

### 7. Transaction Error Handling

1. Open the wizard, enter an invalid payee address (e.g., "notavalidaddress")
2. **Expected:** Step 1 validation prevents advancing to Step 2 (Next button disabled or error shown)
3. Now enter a valid payee but set amount to `0`
4. **Expected:** Validation prevents advancing — amount must be positive
5. If you manage to submit with parameters that cause an on-chain error (e.g., a payee that causes an Anchor error):
6. **Expected:** TransactionStatus shows red X with error message. Console shows `[GherkinPay] Payment creation failed:` with the full error.

### 8. Wizard State Reset on Reopen

1. Open the wizard, fill in Step 1 fields, advance to Step 2, add conditions
2. Close the wizard (click X or outside)
3. Reopen the wizard
4. **Expected:** All fields are reset to defaults — no stale data from previous session

## Edge Cases

### Maximum Conditions (8)

1. In Step 2, click "Add Condition" repeatedly
2. **Expected:** After adding 8 conditions, the "Add Condition" button is disabled or hidden. Cannot exceed MAX_CONDITIONS=8.

### Maximum Signers (5) for Multisig

1. Select Multisig condition type, add signers one by one
2. **Expected:** After 5 signers, the "Add Signer" button is disabled or hidden.

### Milestone Amounts Must Sum to Total

1. In milestone mode, set total to `1.00`, set 2 milestones to `0.40` and `0.40`
2. **Expected:** Validation error — milestones sum (0.80) does not equal total (1.00)
3. Change second milestone to `0.60`
4. **Expected:** Validation passes — sum equals total

### Wallet Not Connected

1. Disconnect wallet from the app
2. Open the wizard and try to submit
3. **Expected:** Submit is disabled or shows an error — payer wallet is required

### Back Navigation Preserves State

1. Fill in Step 1, advance to Step 2, add conditions, advance to Step 3
2. Click "Back" to return to Step 2
3. **Expected:** Conditions are preserved as entered
4. Click "Back" to Step 1
5. **Expected:** Payment details are preserved

## Failure Signals

- Wizard Dialog doesn't open when clicking "Create payment"
- Any step shows blank/broken UI (missing shadcn components)
- Wallet popup never appears after clicking Submit
- TransactionStatus stays in loading state indefinitely (transaction not confirming)
- Agreements list doesn't refresh after successful transaction
- Console shows uncaught errors or missing module imports
- Condition type selector doesn't switch field layouts
- Milestone tab validation indicators don't update

## Not Proven By This UAT

- Fund, release, and cancel payment flows (S02 and S03 scope)
- Time-based condition cranking / evaluation (M003 scope)
- Multi-transaction batching for very large condition sets (>8 conditions that exceed single tx limits)
- Mobile/responsive layout of the wizard Dialog
- Performance under high condition counts (near MAX_CONDITIONS=8 with complex types)

## Notes for Tester

- **Wallet popups:** Milestone payments trigger multiple sequential wallet popups (one per instruction). This is expected — each instruction is confirmed separately. Don't dismiss them; sign each one.
- **Devnet delays:** Transaction confirmation on devnet can take 5-30 seconds. The TransactionStatus spinner is expected during this time.
- **USDC token account:** You don't need USDC balance for creation — that's needed for funding (S02). But the wallet does need SOL for tx fees.
- **Console logging:** Open browser DevTools console and filter for `[GherkinPay]` to see detailed transaction flow with each instruction's signature.
- **Explorer verification:** After successful creation, click the tx signature link in TransactionStatus to verify the PaymentAgreement account on Solana Explorer.
- **Agreements list refresh:** The list should auto-refresh via React Query cache invalidation. If it doesn't, that's a bug — don't manually refresh.
