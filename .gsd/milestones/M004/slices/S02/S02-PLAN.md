# S02: Compliance Audit Log

**Goal:** A new Compliance Audit Log page in the console shows a filterable timeline of compliance-relevant on-chain events parsed from program logs.
**Demo:** Navigate to `/audit` in the console. The page displays a table of compliance events (PaymentCreated, PaymentFunded, ConditionMet, MultisigApproval, PaymentReleased, PaymentCancelled, MilestoneAdvanced) with filter pills by event type, text search, pagination, and contextual detail columns. The nav bar includes an "Audit Log" link.

## Must-Haves

- `useComplianceAuditLog()` query hook that fetches program transactions and filters to 7 compliance-relevant event types
- Audit log page at `/audit` route with table, filter pills, search, pagination, skeleton loading, wallet-not-connected state, and error state
- Detail column renders context-dependent information per event type (metadata_uri for PaymentCreated, signer for MultisigApproval, amount for PaymentReleased/PaymentFunded, condition_type for ConditionMet)
- "Audit Log" nav entry in `dashboard-nav.tsx`
- `bun run build` passes clean in `app/web/`

## Verification

- `cd app/web && bun run build` — exits 0 with no type errors
- `grep -q "audit" app/web/src/app/_components/dashboard-nav.tsx` — nav link exists
- `test -f app/web/src/lib/queries/audit-log.ts` — query hook file exists
- `test -f app/web/src/app/\(console\)/audit/page.tsx` — page file exists
- `grep -c "COMPLIANCE_EVENTS" app/web/src/lib/queries/audit-log.ts` returns >= 1

## Tasks

- [x] **T01: Create useComplianceAuditLog query hook** `est:25m`
  - Why: The data layer must exist before the page can render. This hook fetches program transactions, parses events with Anchor's EventParser, and filters to 7 compliance-relevant event types — structurally identical to `useActivityFeed()` but with an allowlist filter.
  - Files: `app/web/src/lib/queries/audit-log.ts`
  - Do: Clone the pattern from `activity.ts`. Define `COMPLIANCE_EVENTS` allowlist array. Create `useComplianceAuditLog()` that reuses the same `getSignaturesForAddress` + `EventParser` approach, filtering parsed events to only those in the allowlist. Use queryKey `["audit-log"]`. Cast program to `Program<GherkinPay>` for coder access (same as activity.ts).
  - Verify: `cd app/web && npx tsc --noEmit --pretty 2>&1 | grep -c "error TS"` returns 0 (or command exits 0)
  - Done when: `audit-log.ts` exports `useComplianceAuditLog()` returning `ActivityEvent[]` filtered to compliance events, and TypeScript compiles without errors

- [x] **T02: Build audit log page with filterable table and nav link** `est:40m`
  - Why: This is the user-facing deliverable — the page that renders compliance events with rich detail columns, filtering, search, and pagination. Also wires the nav link so users can reach it.
  - Files: `app/web/src/app/(console)/audit/page.tsx`, `app/web/src/app/_components/dashboard-nav.tsx`
  - Do: Clone the Activity page structure. Import `useComplianceAuditLog` from the hook. Add a "Details" column that renders context-dependent info per event type (metadata_uri for PaymentCreated, signer+approvals for MultisigApproval, amount for PaymentReleased/PaymentFunded, condition_type for ConditionMet). Use TableToolbar with FilterPills for event type filtering and SearchInput. Use Pagination. Include skeleton loading, wallet-not-connected, error, and empty states. Add `{ href: "/audit", label: "Audit Log" }` to navItems in dashboard-nav.tsx.
  - Verify: `cd app/web && bun run build` exits 0
  - Done when: `/audit` page exists with table, filter pills, search, pagination, detail column, and "Audit Log" appears in the nav

## Observability / Diagnostics

- **Query key `["audit-log"]`** is visible in React Query DevTools — inspect cache state, staleness, and error status.
- **`COMPLIANCE_EVENTS` allowlist** is exported; downstream code can log/assert against it to verify filter coverage.
- **Network tab** shows `getSignaturesForAddress` and `getParsedTransactions` RPC calls to the Solana devnet endpoint; failures surface as React Query `isError` state.
- **No PII or secrets** in audit log data — all fields are on-chain public data (signatures, slots, event payloads).

## Files Likely Touched

- `app/web/src/lib/queries/audit-log.ts`
- `app/web/src/app/(console)/audit/page.tsx`
- `app/web/src/app/_components/dashboard-nav.tsx`
