# GherkinPay Manual Testing Plan

> **Environment:** localnet (solana-test-validator) + localhost:3000
> **Wallet:** Phantom configured with custom RPC `http://127.0.0.1:8899`
> **Payer wallet:** `nnAH8phxSRgVSez4hFonzQh5ZC4LeWsTTz5koSsqv5U` (CLI default keypair, import into Phantom)
> **Token:** USDC-test mint `5bxpqGSh66XMcSKWVipLr9pKUpBHjVdmC7W3zscCX8DJ` (Token-2022, 6 decimals)

---

## Prerequisites

Before testing, ensure:

```bash
# 1. Validator running with programs deployed
solana-test-validator --limit-ledger-size 50000000
anchor deploy --provider.cluster localnet

# 2. USDC-test mint exists with tokens minted
spl-token display 5bxpqGSh66XMcSKWVipLr9pKUpBHjVdmC7W3zscCX8DJ --url localhost

# 3. Dev server running pointed at localnet
# app/web/.env → NEXT_PUBLIC_SOLANA_RPC_URL="http://127.0.0.1:8899"
cd app/web && bun run dev

# 4. Phantom wallet configured
# Settings → Developer Settings → Change Network → Custom → http://127.0.0.1:8899
# Import CLI keypair (~/.config/solana/id.json) into Phantom
```

---

## Test 1: Wallet Connection (R001)

| # | Step | Expected |
|---|------|----------|
| 1.1 | Open http://localhost:3000/agreements | "Select Wallet" button visible in sidebar |
| 1.2 | Click "Select Wallet" | Wallet adapter modal shows available wallets (Phantom) |
| 1.3 | Connect Phantom | Wallet address `nnAH...` shown in sidebar, "Connect your wallet" message disappears |
| 1.4 | Refresh page | Wallet stays connected (auto-reconnect) |
| 1.5 | Disconnect wallet from Phantom | UI reverts to "Select Wallet" state |

---

## Test 2: Agreements List — Live Reads (R002)

| # | Step | Expected |
|---|------|----------|
| 2.1 | Connect wallet, open /agreements | Empty table with "No agreements found" or similar |
| 2.2 | Create a payment (Test 4) | New agreement row appears in table |
| 2.3 | Check row data | Payment ID, payer, payee, amount, status columns populated with on-chain data |
| 2.4 | Click payment ID link | Navigates to /agreements/[pubkey] detail page |

---

## Test 3: Navigation & Page Rendering (R006)

| # | Step | Expected |
|---|------|----------|
| 3.1 | Click "Agreements" in sidebar | /agreements loads, active nav highlight |
| 3.2 | Click "Milestones" in sidebar | /milestones loads, shows "Connect wallet" or milestone data |
| 3.3 | Click "Compliance" in sidebar | /compliance loads, shows wallet-connect prompt or lookup form |
| 3.4 | Click "Relayers" in sidebar | /relayers loads, shows registration form + empty table |
| 3.5 | Click "Activity" in sidebar | /activity loads, shows "Connect wallet" or event feed |
| 3.6 | No console errors on any page | Browser console clean (except expected [GherkinPay] logs) |

---

## Test 4: Create Simple Payment with Time Condition (R007, R011)

| # | Step | Expected |
|---|------|----------|
| 4.1 | Click "Create payment" on Agreements page | Wizard opens at Step 1 |
| 4.2 | Payer auto-fills with connected wallet | `nnAH8...` shown in Payer field |
| 4.3 | Enter payee address, amount 0.01 | Fields accept valid base58 and number |
| 4.4 | Click Next → Step 2 (Conditions) | Condition builder shown with AND/OR toggle |
| 4.5 | Select "Time-Based" condition type | Dropdown stays open, type-specific fields appear |
| 4.6 | Set unlock date in the past (e.g. yesterday) | Date/time input accepts value |
| 4.7 | Click Next → Step 3 (Review) | Summary shows type, payer, payee, amount, conditions |
| 4.8 | Click Submit | Phantom approval popup → transaction confirms |
| 4.9 | Success feedback | TransactionStatus shows "Confirmed" with Explorer link |
| 4.10 | Close wizard, check agreements list | New agreement visible with "Active" status |

---

## Test 5: Fund Payment (R008)

| # | Step | Expected |
|---|------|----------|
| 5.1 | Find the Created payment in agreements list | Row shows with status "Created" or "Active" |
| 5.2 | Click "Fund" button on the payment row | Fund dialog opens showing amount and token |
| 5.3 | Confirm funding | Phantom approval → transaction confirms |
| 5.4 | Success feedback | TransactionStatus shows confirmed, status changes to "Active"/"Funded" |
| 5.5 | Check token balance | Wallet USDC balance decreased by payment amount |

---

## Test 6: Crank Time Condition (R011)

| # | Step | Expected |
|---|------|----------|
| 6.1 | Click on the funded payment row → detail page | /agreements/[pubkey] loads with payment header and condition cards |
| 6.2 | Find the time-based condition card | Shows unlock date, "Pending" badge |
| 6.3 | Unlock time is in the past → "Crank Time" button visible | Button enabled (unlock_at < now) |
| 6.4 | Click "Crank Time" | Phantom approval → transaction confirms |
| 6.5 | Condition status updates | Badge changes to "Met" ✓ |
| 6.6 | Console log | `[GherkinPay] crankTime tx: <sig>` logged |

---

## Test 7: Evaluate & Release (R009)

| # | Step | Expected |
|---|------|----------|
| 7.1 | All conditions on the payment are met | Condition cards all show "Met" ✓ |
| 7.2 | Click "Release" button on agreements list | Release dialog opens |
| 7.3 | Confirm release | Phantom approval → transaction confirms |
| 7.4 | Payment status changes | Status becomes "Completed" |
| 7.5 | Payee token balance increased | Payee ATA received the payment amount |
| 7.6 | Activity page shows event | "PaymentReleased" event visible (R005) |

---

## Test 8: Cancel Payment & Refund (R010)

| # | Step | Expected |
|---|------|----------|
| 8.1 | Create + fund a new payment (repeat Test 4 + 5) | New funded payment visible |
| 8.2 | Click "Cancel" button on the payment row | Cancel dialog opens |
| 8.3 | Confirm cancellation | Phantom approval → transaction confirms |
| 8.4 | Payment status changes | Status becomes "Cancelled" |
| 8.5 | Payer token balance restored | Escrowed USDC returned to payer ATA |

---

## Test 9: Create Payment with Multisig Condition (R014)

| # | Step | Expected |
|---|------|----------|
| 9.1 | Create payment → Step 2 → select "Multi-Signature" | Signer inputs and threshold field appear |
| 9.2 | Add 3 signer addresses, set threshold to 2 | Fields accept base58 addresses |
| 9.3 | Submit and fund the payment | Payment created with multisig condition |
| 9.4 | Open detail page → multisig condition card | Shows signer list with ✓/○ status per signer |
| 9.5 | Connected wallet is signer → "Approve" button visible | Button enabled for listed signers |
| 9.6 | Click "Approve" | Phantom approval → signer marked as ✓ |
| 9.7 | Connect second signer wallet → click "Approve" | Second signer ✓, threshold met → condition "Met" |
| 9.8 | Wrong wallet connected | "Not a signer" message, no Approve button |
| 9.9 | Already approved signer reconnects | "Already approved" message, button disabled |

---

## Test 10: Create Payment with Webhook Condition (R015)

| # | Step | Expected |
|---|------|----------|
| 10.1 | Create payment → Step 2 → select "Webhook Event" | Relayer pubkey and event hash fields appear |
| 10.2 | Set relayer = your wallet, enter a 64-char hex hash | Fields validate input |
| 10.3 | Submit and fund the payment | Payment created with webhook condition |
| 10.4 | Open detail page → webhook condition card | Shows relayer address |
| 10.5 | Connected wallet matches relayer → hex input + "Confirm" visible | Wallet-gated form shown |
| 10.6 | Paste the same event hash, click "Confirm" | Phantom approval → condition "Met" |
| 10.7 | Wrong hash submitted | Error: "Event hash does not match" (error 6020) |
| 10.8 | Wrong wallet connected | "Not the registered relayer" message |

---

## Test 11: Oracle Price Feed Condition (R012)

> ⚠️ Requires a Pyth price account on localnet — may need to skip or mock.

| # | Step | Expected |
|---|------|----------|
| 11.1 | Create payment → Step 2 → select "Oracle Price Feed" | Feed account, operator, target, decimals fields |
| 11.2 | Submit with a valid Pyth feed account | Payment created with oracle condition |
| 11.3 | Open detail page → oracle condition card | Shows current price (if feed exists) or staleness warning |
| 11.4 | Click "Crank Oracle" | Transaction attempts oracle evaluation |

---

## Test 12: Token Gate Condition (R013)

| # | Step | Expected |
|---|------|----------|
| 12.1 | Create payment → Step 2 → select "Token-Gated" | Mint address and min amount fields |
| 12.2 | Set mint = USDC-test, min amount = 1 | Fields accept values |
| 12.3 | Submit and fund the payment | Payment created with token gate condition |
| 12.4 | Open detail page → token gate condition card | Shows mint and threshold |
| 12.5 | Click "Crank Token Gate" (wallet holds ≥1 USDC) | Phantom approval → condition "Met" |

---

## Test 13: Compliance Allowlist Management (R016)

| # | Step | Expected |
|---|------|----------|
| 13.1 | Navigate to /compliance, connect wallet | Lookup and Set Compliance forms visible |
| 13.2 | Enter a wallet address in Lookup → search | Shows "Not Registered" or current status |
| 13.3 | Enter wallet address → select "Allow" → Submit | Phantom approval → transaction confirms |
| 13.4 | Lookup the same address again | Shows "Allowed" |
| 13.5 | Change to "Block" → Submit | Phantom approval → status changes to "Blocked" |
| 13.6 | Non-authority wallet tries to submit | Error decoded: authority mismatch |

---

## Test 14: Relayer Registration (R017)

| # | Step | Expected |
|---|------|----------|
| 14.1 | Navigate to /relayers | Registration form + empty "Registered relayers" table |
| 14.2 | Enter valid base58 pubkey + label → click Register | Relayer appears in table |
| 14.3 | Refresh page | Relayer persists (localStorage) |
| 14.4 | Enter invalid pubkey → click Register | Validation error shown |
| 14.5 | Enter duplicate pubkey → click Register | Duplicate prevented |
| 14.6 | Click "Remove" on a registered relayer | Row disappears from table |

---

## Test 15: Milestones Page (R003)

| # | Step | Expected |
|---|------|----------|
| 15.1 | Navigate to /milestones, connect wallet | Empty state or milestone data |
| 15.2 | Create a milestone payment (Step 1: select "Milestone Payment") | Milestone-specific fields in wizard |
| 15.3 | After creation, check /milestones | Milestone schedule visible with conditions |

---

## Test 16: Activity Feed (R005)

| # | Step | Expected |
|---|------|----------|
| 16.1 | Navigate to /activity, connect wallet | Recent events feed |
| 16.2 | Perform any transaction (create/fund/release) | New event appears in feed |
| 16.3 | Events show transaction signature | Clickable link to Explorer |

---

## Test 17: Agreement Detail Page

| # | Step | Expected |
|---|------|----------|
| 17.1 | Navigate to /agreements/[pubkey] | Payment header card with payer, payee, amount, status |
| 17.2 | Conditions grid shows all conditions | Each condition type renders correctly |
| 17.3 | Met conditions show ✓ badge | Visual distinction between met/pending |
| 17.4 | Error feedback on failed transactions | Error code decoded to human-readable message |
| 17.5 | Explorer link on successful transactions | Link opens Solana Explorer for the tx signature |

---

## Test 18: Error Handling

| # | Step | Expected |
|---|------|----------|
| 18.1 | Submit transaction with insufficient SOL | Error message shown, not raw error code |
| 18.2 | Try to release before conditions met | Error: "Conditions are not met for release" (6009) |
| 18.3 | Try to fund already-funded payment | Error decoded and shown |
| 18.4 | Disconnect wallet mid-flow | Graceful fallback to "Connect wallet" state |

---

## Smoke Test Sequence (Happy Path)

For a quick end-to-end validation, run these in order:

1. **Connect wallet** (Test 1)
2. **Create simple payment** with time condition in the past (Test 4)
3. **Fund the payment** (Test 5)
4. **Open detail page → crank time condition** (Test 6)
5. **Release the payment** (Test 7)
6. **Verify on Activity page** (Test 16)
7. **Create another payment → cancel it** (Test 8)
8. **Register a relayer** on Relayers page (Test 14)
9. **Set compliance entry** on Compliance page (Test 13)

This covers the core lifecycle: create → fund → crank → release → cancel, plus admin flows.
