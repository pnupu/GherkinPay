# S03: Admin Flows — UAT

**Milestone:** M003
**Written:** 2026-03-20

## UAT Type

- UAT mode: mixed (artifact-driven for build/type verification + live-runtime for on-chain compliance writes + human-experience for localStorage relayer flow)
- Why this mode is sufficient: Compliance writes require a connected wallet and devnet transaction; relayer registry is pure client-side localStorage requiring browser interaction; build verification confirms type safety

## Preconditions

- `cd app/web && npm run dev` running on localhost:3000
- Browser with Phantom or Solflare wallet extension installed
- Wallet connected to Solana devnet
- Connected wallet has some SOL for transaction fees (compliance writes cost ~0.003 SOL)
- For compliance test: connected wallet should be the hookProgram authority (or you'll test error handling)

## Smoke Test

Navigate to http://localhost:3000/compliance — page loads without errors, shows wallet connection prompt or compliance forms. Navigate to http://localhost:3000/relayers — page loads, shows registration form and (possibly empty) relayer table.

## Test Cases

### 1. Compliance Lookup — Existing Entry

1. Connect wallet on the Compliance page
2. In the "Check Status" section, enter a wallet address that has a known ComplianceEntry on devnet
3. Click "Check Status"
4. **Expected:** Status displays "Allowed" or "Blocked" based on the on-chain `isAllowed` value

### 2. Compliance Lookup — Non-Existent Entry

1. In the "Check Status" section, enter a valid Solana pubkey that has no ComplianceEntry
2. Click "Check Status"
3. **Expected:** Status displays "Not Registered" or equivalent null state

### 3. Set Compliance — Allow a Wallet

1. In the "Set Compliance" section, enter a valid Solana wallet address
2. Select "Allow"
3. Click Submit
4. Approve the transaction in your wallet
5. **Expected:** TransactionStatus shows confirming → confirmed with transaction signature. Console logs `[GherkinPay] setCompliance wallet=… isAllowed=true` then `[GherkinPay] setCompliance tx: …`. Looking up that wallet now shows "Allowed"

### 4. Set Compliance — Block a Wallet

1. Enter the same wallet address used in test 3
2. Select "Block"
3. Click Submit and approve
4. **Expected:** Transaction confirms. Looking up that wallet now shows "Blocked"

### 5. Compliance — Invalid Wallet Input

1. In either the lookup or set-compliance input, type "not-a-pubkey"
2. Try to submit
3. **Expected:** Inline validation error appears before any RPC call. No transaction is sent.

### 6. Compliance — Non-Authority Wallet Error

1. Connect a wallet that is NOT the hookProgram authority
2. Try to set compliance for any address
3. **Expected:** Transaction fails on-chain. TransactionStatus shows a decoded Anchor error message (not a raw hex code)

### 7. Relayer Registration — Happy Path

1. Navigate to /relayers
2. Enter a valid Solana pubkey in the pubkey field
3. Enter a label (e.g., "My Relayer")
4. Click Register/Add
5. **Expected:** Entry appears in the table with pubkey, label, and timestamp. `localStorage.getItem("gherkinpay:relayers")` contains the entry as JSON

### 8. Relayer Registration — Persistence Across Reload

1. After adding a relayer in test 7, refresh the page (F5)
2. **Expected:** The registered relayer still appears in the table (loaded from localStorage)

### 9. Relayer Removal

1. Click the Remove/Delete button on a registered relayer row
2. **Expected:** Entry disappears from the table. `localStorage.getItem("gherkinpay:relayers")` no longer contains that pubkey

### 10. Relayer Registration — Invalid Pubkey

1. Enter "xyz123" in the pubkey field and a label
2. Try to submit
3. **Expected:** Inline validation error — entry is not added to the table or localStorage

### 11. Relayer Registration — Duplicate Prevention

1. Register a relayer with pubkey "ABC..."
2. Try to register the same pubkey again with a different label
3. **Expected:** Error message indicating the pubkey is already registered. No duplicate entry created.

## Edge Cases

### Compliance — Empty Wallet Input

1. Leave the wallet address field empty and click submit
2. **Expected:** Validation prevents submission — no RPC call, no transaction

### Relayer — Corrupt localStorage

1. In browser console, run: `localStorage.setItem("gherkinpay:relayers", "broken")`
2. Refresh the /relayers page
3. **Expected:** Page loads with empty table (corrupt data gracefully discarded), no console errors or crashes

### Relayer — localStorage Cleared

1. Register some relayers, then run `localStorage.clear()` in console
2. Refresh /relayers
3. **Expected:** Empty table, registration form still works for new entries

## Failure Signals

- Page shows "use server" or static content instead of interactive forms → client component directive missing
- Compliance form submits but no wallet popup → hookProgram not wired correctly
- Transaction error shows raw hex instead of human message → error decoding not working
- Relayer table empty after refresh despite adding entries → localStorage read/SSR guard broken
- TypeScript errors in console → type safety regression
- Page crashes on load → SSR accessing localStorage without typeof window guard

## Not Proven By This UAT

- Compliance entry actually blocking Token-2022 transfers (that's the hook program's job, tested at contract level)
- Multi-user relayer discovery (localStorage is browser-local by design, per D009)
- Authority management (who gets to be hookProgram authority is a deployment concern)
- Integration with agreement detail view (S01/S02 scope, not S03)

## Notes for Tester

- The compliance authority wallet is determined by the hookProgram deployment. If you don't have access to the authority wallet, test 3/4 will fail on-chain — that's expected. Test 6 covers this error path explicitly.
- Relayer tests are fully self-contained — no wallet or devnet needed, just a browser.
- The Compliance page's "Check Status" result may take a moment to appear as it fetches on-chain data via RPC.
