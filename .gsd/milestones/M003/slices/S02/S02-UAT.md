# S02: Permissioned Actions — UAT

**Milestone:** M003
**Written:** 2026-03-20

## UAT Type

- UAT mode: mixed (artifact-driven build verification + human-experience wallet switching)
- Why this mode is sufficient: Build verification confirms code correctness and wiring; human testing is required for wallet identity gating which cannot be automated without multiple wallet instances

## Preconditions

1. Devnet is accessible (check `solana cluster-version -u devnet`)
2. `cd app/web && bun run dev` is running at http://localhost:3000
3. At least one PaymentAgreement with a **multisig** condition exists on devnet (created via M002 wizard with ≥2 signers and threshold ≥2)
4. At least one PaymentAgreement with a **webhook** condition exists on devnet (created via M002 wizard with a known relayer pubkey)
5. Two Solana wallets available (e.g. Phantom + Solflare, or two Phantom profiles) — one of which is signer 1 and the other is signer 2 for the multisig condition
6. One wallet whose pubkey matches the webhook condition's registered relayer

## Smoke Test

1. Navigate to `/agreements`, click a row with a multisig condition
2. The agreement detail view loads and the multisig condition card shows signer addresses with ✓/○ indicators
3. If your wallet is a signer, you see an "Approve" button

## Test Cases

### 1. Multisig: Disconnected wallet shows connect message

1. Disconnect wallet (or open in incognito with no wallet connected)
2. Navigate to `/agreements/[id]` for a payment with a multisig condition
3. **Expected:** Multisig condition card shows "Connect wallet to approve" message, no Approve button visible

### 2. Multisig: Non-signer wallet sees rejection message

1. Connect a wallet that is NOT in the multisig signers list
2. Navigate to the agreement detail for the multisig payment
3. **Expected:** Multisig condition card shows "Not a signer for this condition" message, no Approve button

### 3. Multisig: Signer sees Approve button and approval status

1. Connect wallet that IS signer 1 in the multisig signers list
2. Navigate to the agreement detail for the multisig payment
3. **Expected:** Per-signer list shows all signers with ○ (not yet approved). Connected wallet's entry is tagged "you". An "Approve" button is visible.

### 4. Multisig: Successful approval updates status

1. As signer 1 (connected), click "Approve"
2. Approve the transaction in the wallet popup
3. **Expected:** TransactionStatus shows pending spinner, then success with Solana Explorer link. Per-signer list updates: signer 1 now shows ✓. Button changes to "You already approved ✓". Console shows `[GherkinPay] signMultisig tx: <signature>`.

### 5. Multisig: Second signer approval (wallet switch)

1. Disconnect signer 1's wallet
2. Connect signer 2's wallet
3. Navigate to the same agreement detail
4. **Expected:** Signer 1 shows ✓, signer 2 shows ○ with "you" tag. Approve button is visible for signer 2.
5. Click "Approve", confirm in wallet
6. **Expected:** TransactionStatus shows success. If threshold is reached, condition shows as met.

### 6. Multisig: Already-approved signer cannot re-approve

1. As signer 1 (who already approved), navigate to the multisig agreement
2. **Expected:** "You already approved ✓" is shown instead of the Approve button. No way to submit a duplicate approval.

### 7. Webhook: Disconnected wallet shows connect message

1. Disconnect wallet
2. Navigate to `/agreements/[id]` for a payment with a webhook condition
3. **Expected:** Webhook condition card shows "Connect wallet to confirm" message, no hex input or Confirm button

### 8. Webhook: Non-relayer wallet sees rejection message

1. Connect a wallet that does NOT match the webhook's registered relayer pubkey
2. Navigate to the webhook agreement detail
3. **Expected:** Shows "Only the registered relayer can confirm" message, no hex input

### 9. Webhook: Relayer sees hex input and Confirm button

1. Connect the wallet matching the webhook's registered relayer pubkey
2. Navigate to the webhook agreement detail
3. **Expected:** A text input for the event hash and a "Confirm" button are visible

### 10. Webhook: Invalid hex input is rejected

1. As the relayer, type `abcdef` (too short — only 6 chars) in the hex input
2. **Expected:** Confirm button is disabled or submission is blocked. No transaction sent.
3. Type `ZZZZ` followed by 60 valid hex chars (invalid hex char)
4. **Expected:** Confirm button remains disabled

### 11. Webhook: Valid hex submission triggers transaction

1. As the relayer, enter a valid 64-character hex string (e.g. `a]` repeated — `aaaa...` 64 chars)
2. Click "Confirm"
3. **Expected:** TransactionStatus shows pending, then either success (if hash matches) or decoded error "Event hash mismatch" (error 6020) if it doesn't match the expected hash. Console shows `[GherkinPay] confirmWebhook` log.

### 12. Webhook: Correct event hash marks condition as met

1. As the relayer, enter the exact 64-char hex event hash that the payment condition expects
2. Click "Confirm", approve in wallet
3. **Expected:** TransactionStatus shows success with Explorer link. Condition card updates to show condition as met. Console shows `[GherkinPay] confirmWebhook tx: <signature>`.

## Edge Cases

### Multisig: Wallet disconnects mid-approval

1. Start the approve flow, but disconnect wallet before confirming in wallet popup
2. **Expected:** Transaction fails gracefully. TransactionStatus shows error. No partial state corruption. Re-connecting and retrying works.

### Webhook: Paste hex with 0x prefix

1. Paste `0x` followed by 64 hex chars (66 chars total)
2. **Expected:** Validation rejects — the regex requires exactly 64 chars with no prefix

### Multisig condition already fully met

1. Navigate to a multisig condition where all signers have approved and threshold is met
2. **Expected:** Condition shows as met. No Approve button shown (condition already satisfied).

## Failure Signals

- Build fails (`bun run build` exits non-zero) — type errors in mutation hooks or condition card
- "Approve" button visible when connected wallet is NOT a signer — wallet gating logic broken
- Hex input accepts non-hex characters or wrong lengths — regex validation missing
- Raw numeric error code (e.g. "6005") shown instead of "Signer is not in the multisig signer list" — decodeAnchorError mapping incomplete
- TransactionStatus from multisig/webhook interferes with crank TransactionStatus — sub-component isolation broken
- Approval status doesn't update after successful transaction — query invalidation not wired

## Not Proven By This UAT

- On-chain correctness of signMultisig/confirmWebhook instructions (that's contract-level testing, not UI)
- Threshold-reached condition evaluation and payment release (covered by M003 milestone-level integration test)
- Multisig with >3 signers or unusual thresholds (UI handles any count but tested with 2-of-3)
- Concurrent approval by multiple signers simultaneously

## Notes for Tester

- The multisig test requires physically switching wallets (e.g., Phantom profile switch or disconnect + connect different wallet). This is the only part of S02 that truly requires human testing.
- For webhook testing, you need to know the expected event hash that was set when the condition was created. If you don't have it, test with a random 64-char hex string and verify you get the "Event hash mismatch" error (6020) — that still proves the full flow works.
- Console filtering: use `[GherkinPay]` prefix in browser DevTools to see only GherkinPay transaction logs.
