# S01 UAT: FX Oracle Post+Crank

**Preconditions:**
- Phantom or Solflare wallet connected on devnet
- Wallet has devnet SOL (≥0.1 SOL for tx fees) and devnet USDC
- App running locally (`bun run dev` from `app/web`) or at gherkinpay.lacertalabs.xyz
- Testing during FX market hours (Mon–Fri, ~22:00 Sun – 22:00 Fri UTC) for live FX prices; outside hours, stale-price tests are the primary target

---

## Test Case 1: FX Preset Selection and Validation

**Goal:** Verify FX presets appear, populate fields correctly, and pass form validation.

1. Navigate to Agreements page → click "Create Payment"
2. Fill in required fields (payee, amount, token) → proceed to conditions step
3. Click "Add Condition" → select "Oracle" type
4. **Verify:** Preset buttons show two groups with "Crypto" and "FX" headers
5. **Verify:** FX group contains exactly: EUR / USD, GBP / USD, USD / JPY
6. Click "EUR / USD" preset
7. **Verify:** feedAccount field populates with a 64-character hex string (no `0x` prefix)
8. **Verify:** Decimals field auto-fills to `5`
9. **Verify:** No red validation errors on the oracle fields
10. Click "USD / JPY" preset
11. **Verify:** Decimals field changes to `3`
12. Clear feedAccount field manually, type an invalid string like "abc"
13. **Verify:** Validation error appears: "Invalid feed ID (base58 address or 64-char hex)"

**Expected:** All FX presets populate correctly, decimals auto-fill, validation works for both formats.

---

## Test Case 2: Crypto Preset Still Works

**Goal:** Verify existing crypto presets weren't broken by the hex/FX changes.

1. In the Oracle condition form, click "SOL / USD" preset
2. **Verify:** feedAccount field populates with a 64-character hex string
3. **Verify:** Decimals field auto-fills to `8`
4. **Verify:** No red validation errors
5. Fill in comparison operator (e.g., "Greater Than") and target value (e.g., "100")
6. **Verify:** Form validates successfully, can proceed to next step

**Expected:** Crypto presets work identically to FX presets — all use hex format now.

---

## Test Case 3: Create Payment with FX Oracle Condition

**Goal:** Verify a payment with an FX oracle condition can be created on devnet.

1. Start a new payment: set payee address, amount (e.g., 1 USDC), metadata URI
2. Add Oracle condition: click "EUR / USD" preset
3. Set comparison: "Greater Than", target value: "0.5" (EUR/USD is ~1.08, so this should pass)
4. Set logic operator to AND
5. Finalize and submit the create payment transaction
6. **Verify:** Transaction succeeds, agreement appears in list
7. Navigate to the new agreement's detail page
8. **Verify:** Oracle condition card shows "EUR / USD" or the feed account
9. **Verify:** Oracle price display shows a current EUR/USD price (fetched from Hermes, not blank)

**Expected:** Payment created with FX oracle condition, live price displayed.

---

## Test Case 4: Post+Crank Oracle (Happy Path)

**Goal:** Verify the full Hermes fetch → PriceUpdateV2 post → crankOracle flow in one click.

1. Fund the payment created in Test Case 3 (transfer USDC to escrow)
2. On the agreement detail page, locate the Oracle condition card
3. **Verify:** "Crank Oracle" button is visible and enabled
4. Open browser DevTools console
5. Click "Crank Oracle"
6. **Verify:** Button shows pending/loading state (disabled during mutation)
7. **Verify:** Console shows `[GherkinPay] Post+crank oracle: feedId=..., conditionIndex=...`
8. Approve the transaction(s) in wallet
9. **Verify:** Console shows `[GherkinPay] Post+crank oracle complete: N tx(s), last=..., Nms`
10. **Verify:** Transaction status component shows tx signature with link
11. **Verify:** Condition status updates to "Met" (since EUR/USD > 0.5)

**Expected:** Single user action fetches price, posts on-chain, and cranks — condition evaluates to met.

---

## Test Case 5: Stale Price / FX Market Closed

**Goal:** Verify graceful handling when FX price data is stale.

1. *(If outside FX market hours)*: Create a payment with an FX oracle condition and attempt to crank
2. **Verify:** If Hermes returns stale data (>60s old), the condition card shows "FX market may be closed — prices update during trading hours only"
3. *(If during market hours)*: This test may not trigger — note in results

**Expected:** Stale-price state surfaces user-facing guidance rather than a cryptic error.

---

## Test Case 6: Hermes Fetch Failure

**Goal:** Verify error handling when Hermes API is unreachable.

1. *(Simulate by disconnecting network or blocking hermes.pyth.network)*
2. Click "Crank Oracle" on an FX condition
3. **Verify:** Error message shows "Unable to fetch FX rate from Pyth" (not a generic error)
4. **Verify:** Console shows `[GherkinPay] Hermes fetch failed: ...` with the original error
5. **Verify:** Crank button returns to enabled state after error

**Expected:** Network failures produce specific, actionable error messages.

---

## Edge Cases

- **Rapid double-click on Crank Oracle:** Button should be disabled during pending mutation, preventing duplicate transactions
- **Mixed crypto+FX conditions on same payment:** Create a payment with both SOL/USD and EUR/USD conditions — both should crank independently
- **Base58 feed ID typed manually:** User types a valid base58 Solana address into feedAccount field — should pass validation and work with the old on-chain-account flow (though post+crank will also handle it)

---

## Pass Criteria

S01 UAT passes when:
- [ ] Test Cases 1–4 all pass
- [ ] Test Case 5 or 6 demonstrates at least one error-path behavior
- [ ] No console errors unrelated to the oracle flow during testing
- [ ] Build remains clean after all testing (`bun run build` exits 0)
