---
id: S02
parent: M004
milestone: M004
provides:
  - Compliance Audit Log page at /audit route with filterable table
  - useComplianceAuditLog() React Query hook with 7-event allowlist filter
  - COMPLIANCE_EVENTS constant and ComplianceEventName union type
  - "Audit Log" nav link in dashboard navigation
requires:
  - slice: S01
    provides: Updated IDL with ComplianceEvent types (PaymentCreated with metadata_uri, etc.)
affects:
  - S03
key_files:
  - app/web/src/lib/queries/audit-log.ts
  - app/web/src/app/(console)/audit/page.tsx
  - app/web/src/app/_components/dashboard-nav.tsx
key_decisions:
  - Always show all 7 COMPLIANCE_EVENTS as filter pills regardless of data presence — audit context benefits from knowing which event types are absent
  - Re-import ActivityEvent type from activity.ts instead of duplicating the interface
  - Use Number() casts for numeric event data to satisfy no-base-to-string lint rule on unknown types
patterns_established:
  - Compliance hooks follow the same EventParser+allowlist-filter pattern on top of the activity feed base
  - Detail column uses switch/case on event.name with typed data access — extensible for new event types
observability_surfaces:
  - React Query DevTools cache key ["audit-log"] — inspect query state, staleness, errors
  - Filter pills show counts per event type — at-a-glance coverage indicator
  - Error state renders inline with RPC error message
  - Network tab shows getSignaturesForAddress + getParsedTransactions RPC calls
drill_down_paths:
  - .gsd/milestones/M004/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M004/slices/S02/tasks/T02-SUMMARY.md
duration: 16m
verification_result: passed
completed_at: 2026-03-23
---

# S02: Compliance Audit Log

**Filterable compliance audit log page at /audit parsing 7 on-chain event types with context-dependent detail columns, search, and pagination**

## What Happened

Built the compliance audit log in two tasks. T01 created the `useComplianceAuditLog()` React Query hook by cloning the proven `useActivityFeed()` pattern from `activity.ts`. The hook uses the same `getSignaturesForAddress` → `getParsedTransactions` → `EventParser.parseLogs` pipeline but adds a `Set`-based allowlist filter (`COMPLIANCE_EVENTS`) keeping only 7 compliance-relevant event types: PaymentCreated, PaymentFunded, ConditionMet, MultisigApproval, PaymentReleased, PaymentCancelled, and MilestoneAdvanced. The `ActivityEvent` interface was re-imported rather than duplicated. A `ComplianceEventName` union type was also exported for downstream type safety.

T02 built the `/audit` page by adapting the Activity page structure. The key addition is a context-dependent "Details" column that renders different information per event type — metadata_uri for PaymentCreated, signer with approval counts for MultisigApproval, amounts for PaymentReleased/PaymentFunded, condition_type for ConditionMet, refund_amount for PaymentCancelled, and milestone indices for MilestoneAdvanced. Filter pills are built from the full COMPLIANCE_EVENTS allowlist (all 7 always shown with counts), which differs from the Activity page pattern where only present event types show. Search filters by event name or signature substring. Pagination is 10 items/page. All four states (wallet-not-connected, loading skeleton, error, empty) are handled. The nav link was added to dashboard-nav.tsx after the Activity entry.

## Verification

All 5 slice-level verification checks passed:

| # | Check | Result |
|---|-------|--------|
| 1 | `cd app/web && bun run build` exits 0 | ✅ /audit route built at 2.8 kB |
| 2 | `grep -q "audit" dashboard-nav.tsx` | ✅ nav link present |
| 3 | `test -f src/lib/queries/audit-log.ts` | ✅ hook file exists |
| 4 | `test -f src/app/(console)/audit/page.tsx` | ✅ page file exists |
| 5 | `grep -c "COMPLIANCE_EVENTS" audit-log.ts` ≥ 1 | ✅ returns 4 |

TypeScript compilation (`npx tsc --noEmit`) also passed with zero errors.

## New Requirements Surfaced

- none

## Deviations

- Filter pills always show all 7 COMPLIANCE_EVENTS (not just those present in data) — deliberate UX choice for audit context where knowing absent event types is useful. Activity page only shows present types.
- Added `ComplianceEventName` union type (not in plan) for downstream type safety.
- Used `Number()` casts instead of implicit `String()` for numeric event data fields to satisfy `@typescript-eslint/no-base-to-string` lint rule.

## Known Limitations

- Audit log data comes from parsing program transaction logs — if Solana RPC node prunes old transactions, historical events may be unavailable.
- No server-side persistence or indexing of compliance events — all data is fetched client-side from on-chain each time.
- No export functionality (CSV/PDF) for audit records.

## Follow-ups

- none

## Files Created/Modified

- `app/web/src/lib/queries/audit-log.ts` — useComplianceAuditLog() hook with COMPLIANCE_EVENTS allowlist and ComplianceEventName type
- `app/web/src/app/(console)/audit/page.tsx` — Compliance Audit Log page with filterable table, detail column, search, pagination, and all states
- `app/web/src/app/_components/dashboard-nav.tsx` — Added "Audit Log" nav entry after Activity

## Forward Intelligence

### What the next slice should know
- The audit log hook is a thin filter layer on top of the same EventParser pipeline used by Activity. If S03's crank bot emits program log events, they will automatically appear in both Activity and (if in the allowlist) the Audit Log.
- COMPLIANCE_EVENTS is exported and can be imported by any downstream code that needs to know the compliance event type set.

### What's fragile
- `ActivityEvent` type is imported from `activity.ts` — if that interface changes shape, audit-log.ts breaks. Both files must stay in sync.
- Event data fields are typed as `unknown` from the EventParser — the Detail column casts them with `Number()` which will silently produce NaN if field shapes change in a contract update.

### Authoritative diagnostics
- React Query DevTools key `["audit-log"]` — shows exact data array, fetch timing, and error state. This is the first place to look if the audit page shows unexpected results.
- Filter pill counts — if all pills show 0, the program has no compliance events on-chain yet (expected on fresh devnet). If pills don't render at all, the hook or page is broken.

### What assumptions changed
- Assumed we'd need to duplicate the ActivityEvent interface — actually re-importing from activity.ts was cleaner and avoids drift.
