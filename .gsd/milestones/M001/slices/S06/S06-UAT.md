# S06: Activity Event Feed — UAT

**Milestone:** M001
**Written:** 2026-03-20

## UAT Type

- UAT mode: mixed (artifact-driven build verification + live-runtime visual confirmation)
- Why this mode is sufficient: Build verification proves compilation and type safety; live runtime confirms events render from devnet RPC. No user interaction flows to test — this is a read-only display page.

## Preconditions

- `cd app/web && bun run dev` running successfully
- Browser open to `http://localhost:3000/activity`
- Phantom or Solflare wallet extension installed (for connected state testing)
- Devnet selected in wallet

## Smoke Test

Navigate to `/activity` without connecting wallet → page renders with "Connect your wallet to view activity events" disconnected state message. No console errors.

## Test Cases

### 1. Disconnected State

1. Open `/activity` without connecting a wallet
2. **Expected:** Page shows a disconnected message prompting wallet connection. No table rendered. No RPC calls in Network tab.

### 2. Connected State — Empty Activity

1. Connect wallet (any devnet wallet — activity is program-wide, not wallet-specific)
2. If no gherkin_pay transactions exist on devnet, observe the page
3. **Expected:** Loading skeletons appear briefly (4 rows × 4 columns), then empty state message: "No activity events found" or similar. No errors.

### 3. Connected State — Events Displayed

1. Connect wallet on devnet where gherkin_pay program has been used (transactions exist)
2. Wait for data to load
3. **Expected:** Table shows rows with four columns:
   - **Time:** Relative timestamp (e.g. "2 hours ago") or formatted date
   - **Event:** Badge showing event name (e.g. "PaymentCreated", "PaymentFunded")
   - **Payment:** Truncated pubkey (e.g. "Ab3f...x9Qr")
   - **Signature:** Truncated transaction signature
4. Events are sorted by slot descending (most recent first)

### 4. Loading State

1. Connect wallet and immediately observe the page before data loads
2. **Expected:** 4 rows of Skeleton placeholders in a table layout. Skeletons disappear when data arrives or empty state renders.

### 5. Error State

1. Disconnect from internet or block RPC calls (DevTools → Network → throttle to Offline)
2. Connect wallet and navigate to `/activity`
3. **Expected:** Error message displayed: "Failed to load activity events" with error details. No crash, no infinite spinner.

### 6. shadcn Components Verification

1. Inspect the rendered Activity page DOM
2. **Expected:** Table uses shadcn `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableCell>` components. Event names use shadcn `<Badge variant="outline">`. Loading uses shadcn `<Skeleton>`.

### 7. No Hardcoded Mock Data

1. Open `app/web/src/app/(console)/activity/page.tsx` in editor
2. Search for `const events = [` or any hardcoded array
3. **Expected:** No hardcoded mock arrays. All data comes from `useActivityFeed()` hook.

## Edge Cases

### No logMessages in Transaction

1. If a transaction has no `meta.logMessages` (null/undefined)
2. **Expected:** That transaction is silently skipped — no crash, no error. Other transactions still display.

### Null Transaction in Batch Fetch

1. If `getParsedTransactions` returns null for some signatures (transaction not found)
2. **Expected:** Null entries silently skipped. Remaining valid transactions display normally.

### Event Without Payment Field

1. If an event's data doesn't contain a `payment` pubkey field
2. **Expected:** Payment column shows "—" or empty. No crash from missing field.

## Failure Signals

- Console errors mentioning `EventParser`, `getSignaturesForAddress`, or `getParsedTransactions`
- Infinite loading spinner (skeletons never resolve)
- Hardcoded event data appearing when wallet is disconnected
- `@/` import paths in source files (should be `~/`)
- `bun run build` fails from `app/web/` directory

## Not Proven By This UAT

- Event parsing correctness for all event types — requires actual program transactions on devnet to exist
- Pagination or performance with large transaction volumes (only fetches last 50)
- Real-time event streaming (events are fetched on mount/refetch, not via WebSocket)
- Cross-browser compatibility beyond the primary test browser

## Notes for Tester

- The Activity page fetches program-wide transactions, not wallet-specific ones. Any devnet activity for the gherkin_pay program will appear regardless of which wallet is connected.
- If devnet has no gherkin_pay transactions, you'll only see the empty state — this is correct behavior, not a bug.
- `bun run typecheck` may return exit code 2 due to pre-existing `.next/types` issues — this is a known project-wide issue, not specific to S06. The `bun run build` type checking passes.
- The build must be run from `app/web/`, not the repo root. The root `package.json` has no `build` script.
