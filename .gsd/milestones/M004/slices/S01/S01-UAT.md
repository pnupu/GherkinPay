# S01: Travel Rule Contract Extension — UAT Script

## Preconditions

- Contract redeployed to devnet with the new `metadata_uri` field (account layout change)
- Frontend running locally via `cd app/web && bun run dev`
- Phantom or Solflare wallet connected to devnet with SOL for transaction fees
- USDC (Token-2022 devnet) available in wallet for funding

---

## TC-01: Create Simple Payment with Travel Rule Metadata URI

**Objective:** Verify metadata_uri flows from wizard input to on-chain storage and back to detail page.

1. Open the console at `http://localhost:3000/agreements`
2. Click "Create Payment" to open the wizard
3. **Expected:** Step 1 shows a "Travel Rule Metadata URI" input field between Total Amount and any milestone fields
4. Fill in payment details:
   - Total Amount: `0.01`
   - Travel Rule Metadata URI: `https://example.com/travel-rule/sender-123`
5. Proceed to step 2 (conditions) — add a simple time-based condition or skip
6. Proceed to step 3 (review)
7. **Expected:** Review step displays "Metadata URI: https://example.com/travel-rule/sender-123"
8. Confirm and sign the transaction in wallet
9. **Expected:** Transaction succeeds, payment appears in agreements list
10. Click the newly created payment to open the detail page at `/agreements/[id]`
11. **Expected:** Detail page shows a "Metadata URI" row with "https://example.com/travel-rule/sender-123" rendered as a clickable link (opens in new tab)

**Pass criteria:** Metadata URI roundtrips from wizard → on-chain → detail page display as clickable link.

---

## TC-02: Create Simple Payment without Metadata URI (Empty String Fallback)

**Objective:** Verify payments still work when metadata URI is left blank.

1. Open "Create Payment" wizard
2. Leave the "Travel Rule Metadata URI" field empty
3. Complete payment creation (fill amount, conditions, sign)
4. **Expected:** Transaction succeeds (empty string stored on-chain)
5. Open the detail page for the new payment
6. **Expected:** Metadata URI row shows "—" (em dash) instead of empty space or broken link

**Pass criteria:** Empty metadata URI doesn't break payment creation or detail display.

---

## TC-03: Create Milestone Payment with Travel Rule Metadata URI

**Objective:** Verify metadata_uri works with milestone payment flow too.

1. Open "Create Payment" wizard
2. Fill in Total Amount and set milestone count > 1
3. Enter Travel Rule Metadata URI: `ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco`
4. Complete milestone payment creation and sign
5. Open the detail page
6. **Expected:** Metadata URI row shows the IPFS URI as plain text (not a clickable link, since it's not HTTP)

**Pass criteria:** Non-HTTP URIs render as text, not links. IPFS/Arweave URIs are valid use cases.

---

## TC-04: PaymentCreated Event Contains metadata_uri

**Objective:** Verify the on-chain event emits the metadata URI for indexer consumption.

1. Create a payment with metadata URI `https://compliance.example.com/rule/456`
2. After transaction confirms, inspect the transaction on Solana Explorer (devnet)
3. Look at program log messages for the `PaymentCreated` event
4. **Expected:** Event data includes `metadata_uri: "https://compliance.example.com/rule/456"`

**Pass criteria:** Event payload contains the metadata URI field.

---

## TC-05: Detail Page Link Behavior

**Objective:** Verify HTTP URIs are clickable and non-HTTP URIs are not.

| Input URI | Expected Rendering |
|-----------|-------------------|
| `https://example.com/travel` | Clickable link, opens in new tab |
| `http://example.com/travel` | Clickable link, opens in new tab |
| `ipfs://QmXyz123` | Plain text, not clickable |
| `arweave://txid123` | Plain text, not clickable |
| _(empty)_ | Em dash "—" |

**Pass criteria:** Only `http://` and `https://` URIs render as clickable links.

---

## TC-06: Build Integrity

**Objective:** Verify the full frontend build passes after all changes.

1. Run `cd app/web && bun run build`
2. **Expected:** Build exits with code 0, no type errors, no lint errors

**Pass criteria:** Clean build with zero errors.

---

## TC-07: Existing Flows Unbroken

**Objective:** Verify pre-existing payment creation still works (regression check).

1. Navigate to Agreements page — should load (may be empty after redeploy)
2. Navigate to Milestones page — should load
3. Navigate to Compliance page — should load
4. Navigate to Relayers page — should load
5. Navigate to Activity page — should load
6. **Expected:** All five console pages render without errors

**Pass criteria:** No regressions on existing pages.

---

## Edge Cases

- **Maximum URI length (200 chars):** Try creating a payment with a 200-character URI — should succeed. Try 201 characters — should fail at transaction level (Anchor constraint).
- **Special characters in URI:** Try `https://example.com/path?param=value&other=123#fragment` — should store and display correctly.
- **Unicode in URI:** Try a URI with percent-encoded unicode — should store and display correctly.
