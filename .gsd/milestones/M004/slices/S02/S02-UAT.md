# S02: Compliance Audit Log — UAT

**Milestone:** M004
**Written:** 2026-03-23

## UAT Type

- UAT mode: mixed (artifact-driven build verification + live-runtime page check)
- Why this mode is sufficient: The slice is a read-only UI page with no write mutations. Build verification proves type safety and route existence. Live runtime confirms rendering, filtering, and navigation.

## Preconditions

- `cd app/web && bun install` completed (worktree has node_modules)
- `cd app/web && bun run dev` running on localhost:3000
- Solana wallet extension (Phantom or Solflare) installed and configured for devnet
- Wallet connected to the app (WalletMultiButton in sidebar shows connected address)

## Smoke Test

Navigate to `http://localhost:3000/audit`. The page should render with either:
- A table of compliance events (if on-chain data exists), or
- An empty state message like "No compliance events found" (if devnet has no events yet)

The page must NOT show an error state or blank white screen.

## Test Cases

### 1. Navigation link exists and works

1. Open `http://localhost:3000` and connect wallet
2. Look at the left sidebar navigation
3. Find "Audit Log" link (should appear after "Activity")
4. Click "Audit Log"
5. **Expected:** Browser navigates to `/audit`. The page renders with a "Compliance Audit Log" heading.

### 2. Page renders all four states correctly

1. **Wallet disconnected:** Disconnect wallet, navigate to `/audit`
   - **Expected:** Wallet-not-connected prompt shown (not an error or blank page)
2. **Loading:** Connect wallet, hard-refresh `/audit`
   - **Expected:** Skeleton loading placeholders appear briefly before data loads
3. **Data loaded:** After loading completes with on-chain data present
   - **Expected:** Table shows rows with columns: Event, Signature, Slot, Details
4. **Empty state:** If no compliance events exist on devnet
   - **Expected:** Empty state message displayed (not an error banner)

### 3. Filter pills render all 7 event types

1. Navigate to `/audit` with wallet connected
2. Inspect the filter pill area above the table
3. **Expected:** 7 filter pills visible: PaymentCreated, PaymentFunded, ConditionMet, MultisigApproval, PaymentReleased, PaymentCancelled, MilestoneAdvanced. Each shows a count (may be 0).

### 4. Filter pills filter the table

1. With data present, click the "PaymentCreated" filter pill
2. **Expected:** Table shows only PaymentCreated events. Other event types are hidden.
3. Click the pill again to deselect
4. **Expected:** All events reappear.
5. Click multiple pills (e.g., PaymentCreated and PaymentFunded)
6. **Expected:** Table shows events matching either selected type.

### 5. Search filters by event name or signature

1. Type a known event name (e.g., "Payment") in the search input
2. **Expected:** Table filters to events whose name or signature contains "Payment"
3. Clear the search input
4. **Expected:** All events reappear
5. Paste a partial transaction signature into search
6. **Expected:** Only matching rows shown

### 6. Details column shows context-dependent info

1. Find a PaymentCreated row in the table
   - **Expected:** Details column shows metadata_uri value (or "—" if empty)
2. Find a PaymentFunded row
   - **Expected:** Details column shows the funded amount
3. Find a MultisigApproval row (if present)
   - **Expected:** Details column shows signer address and approval count
4. Find a ConditionMet row (if present)
   - **Expected:** Details column shows condition_type

### 7. Pagination works

1. If more than 10 compliance events exist, check below the table
2. **Expected:** Pagination controls appear showing page numbers
3. Click page 2
4. **Expected:** Table shows the next set of events. Page indicator updates.

## Edge Cases

### No on-chain data (fresh devnet)

1. Connect wallet on a devnet with no program transactions
2. Navigate to `/audit`
3. **Expected:** Empty state renders cleanly with a message like "No compliance events found". Filter pills still show all 7 types with count 0. No JavaScript errors in console.

### RPC failure

1. Temporarily set an invalid RPC URL or disconnect network
2. Navigate to `/audit`
3. **Expected:** Error state renders with an inline error message describing the RPC failure. Page does not crash.

### Rapid filter toggling

1. Quickly click multiple filter pills in succession
2. **Expected:** Table updates correctly without visual glitches or stale data.

## Failure Signals

- `/audit` returns 404 or blank page — route not registered
- "Audit Log" missing from sidebar — nav entry not added
- JavaScript console shows type errors — TypeScript compilation issue missed
- Filter pills show fewer than 7 types — COMPLIANCE_EVENTS allowlist incomplete
- Details column shows "undefined" or "[object Object]" — event data parsing broken
- Error banner on page load with valid RPC — hook query configuration issue

## Not Proven By This UAT

- That the audit log captures events from the crank bot (S03 not yet built)
- Server-side persistence or indexing of compliance events (not in scope)
- Export functionality (CSV/PDF) for audit records
- Performance with very large numbers of on-chain transactions (>10,000)
- That historical events survive Solana RPC node transaction pruning

## Notes for Tester

- On a fresh devnet with no GherkinPay transactions, the table will be empty — this is expected. The test should still verify filter pills render, states work, and the page doesn't error.
- To generate test data, use the Create Payment wizard to create a payment agreement, then fund it. These transactions will produce PaymentCreated and PaymentFunded events in the audit log.
- The Details column content depends on which event types have on-chain data. Test case 6 may need to be adapted based on available data — focus on verifying that at least one event type shows contextual detail rather than a generic fallback.
