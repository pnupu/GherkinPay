# S04: Milestones — Live Reads — UAT

**Milestone:** M001
**Written:** 2026-03-20

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: This slice is a read-only data display page — no user mutations, no wallet signing. Build/typecheck + grep verification confirms code correctness. Live runtime verification requires a devnet wallet with existing conditionAccount data, which is covered by milestone-level integration testing.

## Preconditions

- `cd app/web && bun run build` exits 0
- Dev server running: `cd app/web && bun run dev`
- Browser with Phantom or Solflare extension installed
- Devnet selected in wallet

## Smoke Test

Navigate to `http://localhost:3000/milestones` without connecting a wallet. The page should render a "Connect your wallet to view milestone schedules" message. No console errors.

## Test Cases

### 1. Disconnected state renders connect prompt

1. Open `http://localhost:3000/milestones` with wallet disconnected
2. **Expected:** Page shows heading "Milestones" with subtitle "Phase-by-phase release management" and a centered message: "Connect your wallet to view milestone schedules."

### 2. Loading state shows skeleton rows

1. Connect wallet on devnet
2. Navigate to milestones page (or refresh)
3. **Expected:** While data loads, 3 skeleton rows appear in the table with 7 placeholder cells each. Skeleton cells pulse with the standard shadcn animation.

### 3. Empty state when no milestones exist

1. Connect a devnet wallet that has no associated conditionAccount accounts
2. Navigate to milestones page
3. **Expected:** Table header renders with columns: Milestone, Agreement, Amount, Status, Conditions, Operator, Finalized. Table body shows a single row spanning all columns: "No milestones found. Create a milestone-based payment agreement to get started."

### 4. Populated state with real conditionAccounts

1. Connect a devnet wallet that is party to at least one PaymentAgreement with milestones
2. Navigate to milestones page
3. **Expected:** Table rows appear with:
   - Milestone column: `#1`, `#2`, etc. (1-indexed from `milestoneIndex`)
   - Agreement column: `#<paymentId>` if parent agreement is in scope, or truncated pubkey (`xxxx…xxxx`) if not
   - Amount column: USD-formatted value (e.g., `$1,000.00`) derived from lamports / 1e6
   - Status column: Badge with "Pending" (outline), "Active" (default), or "Released" (secondary)
   - Conditions column: integer count of conditions array length
   - Operator column: "and" or "or" (lowercase, capitalized via CSS)
   - Finalized column: "Yes" or "No"

### 5. No tRPC or mock data in source

1. Run: `rg "tRPC|trpc|HydrateClient" app/web/src/app/\(console\)/milestones/`
2. Run: `rg "M-01|M-02|M-03|Northline|Boreal|PAY-40" app/web/src/app/\(console\)/milestones/`
3. **Expected:** Both commands return no matches (exit code 1).

### 6. No @/ import aliases

1. Run: `rg "@/" app/web/src/lib/queries/milestones.ts app/web/src/app/\(console\)/milestones/page.tsx`
2. **Expected:** No matches. All imports use `~/` alias.

## Edge Cases

### RPC error handling

1. Configure an invalid RPC endpoint (or disconnect network)
2. Connect wallet and navigate to milestones page
3. **Expected:** After loading state, an error message appears in destructive (red) styling: "Failed to load milestones: <error.message>"

### Orphaned milestones (parent agreement not in wallet scope)

1. Have a conditionAccount whose `payment` pubkey points to an agreement not owned by the connected wallet
2. Navigate to milestones page
3. **Expected:** The Agreement column shows a truncated pubkey (`xxxx…xxxx`) instead of `#<paymentId>`. No crash or missing data.

## Failure Signals

- Build or typecheck failure in `app/web`
- Console errors related to `useMilestones`, `conditionAccount`, or `useAgreements`
- Table columns showing `undefined`, `NaN`, or `[object Object]` instead of formatted values
- Mock data strings appearing in the rendered UI
- Page crashing when wallet is disconnected

## Not Proven By This UAT

- Write operations (creating/modifying milestones) — those are M002 scope
- Mainnet-scale performance with many conditionAccounts — devnet only
- Real-time updates when on-chain data changes — requires manual refresh or React Query refetch
- Cross-browser compatibility beyond Chrome/Brave with Phantom

## Notes for Tester

- If no conditionAccount data exists on devnet, the empty state is the expected correct behavior — the page is working correctly.
- The milestones page depends on the agreements query loading first (enabled guard). If agreements fail, milestones will stay in loading state indefinitely — check agreements page first if milestones seem stuck.
- React Query DevTools (if enabled) can inspect the `["milestones", "<pubkey>"]` cache key to see raw fetched data.
