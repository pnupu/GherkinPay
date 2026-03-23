---
estimated_steps: 5
estimated_files: 2
skills_used: []
---

# T02: Build audit log page with filterable table and nav link

**Slice:** S02 — Compliance Audit Log
**Milestone:** M004

## Description

Build the Compliance Audit Log page at `/audit` with a filterable table showing compliance events, context-dependent detail columns, filter pills, search, pagination, and all standard states (loading, error, empty, wallet-not-connected). Add an "Audit Log" nav link to the dashboard navigation.

The page follows the exact structure of `app/web/src/app/(console)/activity/page.tsx` — clone and adapt it. The key difference is a richer "Details" column that renders context-dependent information based on event type.

## Steps

1. Create `app/web/src/app/(console)/audit/page.tsx`:
   - Import `useComplianceAuditLog` and `COMPLIANCE_EVENTS` from `~/lib/queries/audit-log`
   - Import Table, Badge, Skeleton, Pagination/usePagination, TableToolbar/FilterOption (same as activity page)
   - Import `useWallet` from `@solana/wallet-adapter-react`
2. Implement the table with columns: Time, Event, Details, Payment, Signature
   - The "Details" column renders context-dependent info based on `event.name`:
     - `PaymentCreated`: show `metadata_uri` from event.data (truncated if long)
     - `MultisigApproval`: show signer (truncated pubkey) and `approvals_count/threshold`
     - `PaymentReleased` / `PaymentFunded`: show amount
     - `ConditionMet`: show `condition_type`
     - `PaymentCancelled`: show `refund_amount`
     - `MilestoneAdvanced`: show `completed_index → next_index`
     - Default: "—"
3. Wire up filter pills using `COMPLIANCE_EVENTS` for options, with counts computed from data. Use the same `TableToolbar` pattern as the activity page.
4. Wire up search filtering (by event name or signature substring) and pagination (10 per page), same pattern as activity page.
5. Add `{ href: "/audit", label: "Audit Log" }` to the `navItems` array in `app/web/src/app/_components/dashboard-nav.tsx`. Place it after the "Activity" entry.

## Must-Haves

- [ ] Page renders at `/audit` route with table, filter pills, search, pagination
- [ ] Detail column shows context-dependent info per event type
- [ ] Wallet-not-connected, loading skeleton, error, and empty states all handled
- [ ] "Audit Log" nav link added to dashboard-nav.tsx
- [ ] `bun run build` passes clean in app/web

## Verification

- `cd app/web && bun run build` exits 0
- `test -f app/web/src/app/\(console\)/audit/page.tsx`
- `grep -q "Audit Log" app/web/src/app/_components/dashboard-nav.tsx`
- `grep -q "Details" app/web/src/app/\(console\)/audit/page.tsx`
- `grep -q "metadata_uri" app/web/src/app/\(console\)/audit/page.tsx`

## Inputs

- `app/web/src/lib/queries/audit-log.ts` — useComplianceAuditLog hook and COMPLIANCE_EVENTS constant (from T01)
- `app/web/src/app/(console)/activity/page.tsx` — Pattern to clone: table structure, toolbar, pagination, states
- `app/web/src/components/table-toolbar.tsx` — TableToolbar, FilterOption, SearchInput components
- `app/web/src/components/pagination.tsx` — Pagination, usePagination
- `app/web/src/app/_components/dashboard-nav.tsx` — navItems array to extend

## Expected Output

- `app/web/src/app/(console)/audit/page.tsx` — New audit log page component
- `app/web/src/app/_components/dashboard-nav.tsx` — Modified with "Audit Log" nav entry

## Observability Impact

- **New route `/audit`** appears in Next.js build output — confirms page was compiled and included.
- **React Query cache key `["audit-log"]`** powers this page; inspect in React Query DevTools for data, staleness, and errors.
- **`isError` state** renders a visible error banner with the RPC error message — failures are user-visible, not silent.
- **Filter pills** always show all 7 COMPLIANCE_EVENTS with counts, providing at-a-glance coverage of which event types are present.
- **Empty state** explicitly tells the user no compliance events were found — distinguishes "no data" from "broken".
