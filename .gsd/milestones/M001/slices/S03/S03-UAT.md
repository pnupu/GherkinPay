# S03: Agreements — Live Reads — UAT

**Milestone:** M001
**Written:** 2026-03-19

## UAT Type

- UAT mode: mixed
- Why this mode is sufficient: Build/typecheck verify structural correctness; live-runtime testing with a connected wallet verifies actual on-chain reads and UI state rendering

## Preconditions

- `bun run dev` running in `app/web/` (dev server at localhost:3000)
- Phantom or Solflare browser extension installed and configured for Solana **devnet**
- Browser open to the app's console

## Smoke Test

Navigate to `/agreements`. Without a wallet connected, the page should display a prompt to connect a wallet — not a blank page, not an error, and not hardcoded mock data.

## Test Cases

### 1. Disconnected wallet shows connect prompt

1. Ensure wallet extension is disconnected from the app (or use incognito)
2. Navigate to `/agreements`
3. **Expected:** Page renders a message prompting the user to connect their wallet. No table data, no loading spinner, no errors.

### 2. Loading state renders skeleton rows

1. Connect wallet via the sidebar wallet button
2. Navigate to `/agreements` (or reload the page)
3. Observe the brief loading state before data resolves
4. **Expected:** 4 skeleton rows appear in a table layout while the RPC call is in flight. Skeletons disappear once data loads.

### 3. Empty state with no agreements

1. Connect a wallet that has never created any PaymentAgreement accounts on devnet
2. Navigate to `/agreements`
3. **Expected:** After loading completes, a message like "No agreements found" appears inside the table area. No crash, no infinite spinner.

### 4. Populated table with real agreements

1. Connect a wallet that is the authority on one or more PaymentAgreement accounts on devnet
2. Navigate to `/agreements`
3. **Expected:** A shadcn Table displays rows with these columns:
   - **#** — Agreement number (incrementing)
   - **Counterparty** — Truncated pubkey (e.g. `Ab3f…9xKz`)
   - **Type** — "Simple" or "Milestone (N phases)"
   - **Amount** — USDC-formatted amount (e.g. "$1,000.00"), with released amount shown for milestone type
   - **Status** — Badge with color variant: `created` → outline, `active` → default, `completed` → secondary, `cancelled` → destructive
   - **Created** — Human-readable date from on-chain timestamp

### 5. Status badge variant mapping

1. With populated agreements showing different statuses
2. **Expected:** Each status renders with the correct Badge variant:
   - `created` → outline style
   - `active` → default (filled) style
   - `completed` → secondary style
   - `cancelled` → destructive (red) style

### 6. No tRPC or mock data remnants

1. Open browser DevTools → Network tab
2. Navigate to `/agreements` with wallet connected
3. **Expected:** No requests to `/api/trpc/*` endpoints. No `Northline`, `Boreal`, `Ridge Finance`, or `PAY-40` strings visible anywhere on the page.

## Edge Cases

### RPC error handling

1. Temporarily set an invalid RPC endpoint (or disconnect network)
2. Navigate to `/agreements` with wallet connected
3. **Expected:** Page shows an error message (destructive colored text) with the error detail. No unhandled exception, no blank page.

### Wallet disconnect while viewing

1. Navigate to `/agreements` with wallet connected and data loaded
2. Disconnect the wallet via the wallet extension
3. **Expected:** Page transitions back to the "connect wallet" prompt. No stale data remains visible.

### Rapid page navigation

1. Navigate away from `/agreements` and back quickly (before query resolves)
2. **Expected:** No React errors, no duplicate queries. Page renders correctly.

## Failure Signals

- Blank page or React error boundary on `/agreements`
- Infinite loading spinner that never resolves
- Any mention of `Northline`, `Boreal`, `Ridge Finance`, or `PAY-40` in the rendered page
- Any network request to `/api/trpc/` from the agreements page
- Console errors mentioning `paymentAgreement` type not found or account deserialization failures
- `@/` import paths in source causing module resolution errors

## Requirements Proved By This UAT

- R002 — Live data reads from devnet with loading/empty/populated/error states (proved when test cases 1–4 pass with a real wallet)
- R006 (partial) — shadcn Table, Badge, Skeleton used on the agreements page

## Not Proven By This UAT

- R002 full validation requires agreements to actually exist on devnet for the connected wallet — if none exist, only the empty state is testable
- Write operations (create/fund/cancel) — M002 scope
- Other pages' live data (R003, R004, R005) — S04, S05, S06 scope

## Notes for Tester

- If you don't have any PaymentAgreement accounts on devnet, test cases 1–3 and 6 are still fully testable. Test case 4–5 require seeded data.
- The "Add condition" and "Create payment" buttons are disabled placeholders — this is expected (M002 scope).
- The Skeleton loading state may flash very quickly on fast connections — throttle to "Slow 3G" in DevTools to observe it clearly.
