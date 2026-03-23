---
id: T02
parent: S02
milestone: M004
provides:
  - Compliance Audit Log page at /audit route
  - "Audit Log" nav link in dashboard navigation
key_files:
  - app/web/src/app/(console)/audit/page.tsx
  - app/web/src/app/_components/dashboard-nav.tsx
key_decisions:
  - Always show all 7 COMPLIANCE_EVENTS as filter pills (not just those present in data) for consistent UX
  - Use Number() casts for event data values to satisfy no-base-to-string lint rule on unknown types
patterns_established:
  - Detail column uses switch/case on event.name with typed data access — extensible for new event types
observability_surfaces:
  - Error state renders visible banner with RPC error message — failures are user-visible
  - Filter pills show counts per event type — at-a-glance coverage indicator
  - Empty state distinguishes "no data" from "broken" with explicit messaging
duration: 8m
verification_result: passed
completed_at: 2026-03-23
blocker_discovered: false
---

# T02: Build audit log page with filterable table and nav link

**Added /audit page with filterable compliance event table, context-dependent Details column, and Audit Log nav link**

## What Happened

Created `app/web/src/app/(console)/audit/page.tsx` by cloning the Activity page structure and adapting it for the compliance audit log. The page uses `useComplianceAuditLog()` from T01's hook and adds a "Details" column that renders context-dependent information per event type: metadata_uri for PaymentCreated, signer with approval counts for MultisigApproval, amounts for PaymentReleased/PaymentFunded, condition_type for ConditionMet, refund_amount for PaymentCancelled, and milestone indices for MilestoneAdvanced. Filter pills are built from the full `COMPLIANCE_EVENTS` allowlist (all 7 always shown), with counts computed from data. Search filters by event name or signature substring. Pagination is set to 10 items per page. All four states (wallet-not-connected, loading skeleton, error, empty) are handled. Added `{ href: "/audit", label: "Audit Log" }` to the navItems array in dashboard-nav.tsx after the Activity entry.

## Verification

- `bun run build` exits 0 with `/audit` route listed at 2.8 kB
- Page file exists at expected path
- "Audit Log" nav link present in dashboard-nav.tsx
- Details column and metadata_uri references confirmed in page source
- All 5 slice-level verification checks pass

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run build` | 0 | ✅ pass | 16.1s |
| 2 | `test -f app/web/src/app/(console)/audit/page.tsx` | 0 | ✅ pass | <1s |
| 3 | `grep -q "Audit Log" app/web/src/app/_components/dashboard-nav.tsx` | 0 | ✅ pass | <1s |
| 4 | `grep -q "Details" app/web/src/app/(console)/audit/page.tsx` | 0 | ✅ pass | <1s |
| 5 | `grep -q "metadata_uri" app/web/src/app/(console)/audit/page.tsx` | 0 | ✅ pass | <1s |
| 6 | `grep -q "audit" app/web/src/app/_components/dashboard-nav.tsx` | 0 | ✅ pass | <1s |
| 7 | `test -f app/web/src/lib/queries/audit-log.ts` | 0 | ✅ pass | <1s |
| 8 | `grep -c "COMPLIANCE_EVENTS" app/web/src/lib/queries/audit-log.ts` | 0 (4) | ✅ pass | <1s |

## Diagnostics

- Navigate to `/audit` in the console to see the page. React Query DevTools show cache key `["audit-log"]` with data, staleness, and errors.
- Filter pills always render all 7 compliance event types with counts — zero-count pills indicate the event type has no on-chain data yet.
- Error state renders inline with the RPC error message. Empty state has explicit copy distinguishing it from a failure.
- Network tab shows the same `getSignaturesForAddress` + `getParsedTransactions` calls as the Activity page.

## Deviations

- Used `Number()` casts instead of `String()` for numeric event data fields (amount, refund_amount, indices, counts) to satisfy the `@typescript-eslint/no-base-to-string` lint rule on `unknown` types. The plan used `String()` implicitly.
- Filter pills always show all 7 COMPLIANCE_EVENTS (not just those present in data) — the Activity page only shows event names present in data. This was a deliberate UX choice for the audit context where knowing which event types are absent is useful.
- Added Observability Impact section to T02-PLAN.md as required by pre-flight checks.

## Known Issues

None.

## Files Created/Modified

- `app/web/src/app/(console)/audit/page.tsx` — New audit log page with filterable table, detail column, and all states
- `app/web/src/app/_components/dashboard-nav.tsx` — Added "Audit Log" nav entry after Activity
- `.gsd/milestones/M004/slices/S02/S02-PLAN.md` — Marked T02 done, added Observability Impact to T02-PLAN.md
- `.gsd/milestones/M004/slices/S02/tasks/T02-PLAN.md` — Added Observability Impact section
