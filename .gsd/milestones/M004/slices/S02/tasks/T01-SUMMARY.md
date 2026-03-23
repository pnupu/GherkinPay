---
id: T01
parent: S02
milestone: M004
provides:
  - useComplianceAuditLog React Query hook
  - COMPLIANCE_EVENTS allowlist constant
key_files:
  - app/web/src/lib/queries/audit-log.ts
key_decisions:
  - Re-import ActivityEvent type from activity.ts instead of duplicating the interface
patterns_established:
  - Compliance hooks follow the same EventParser+allowlist-filter pattern on top of the activity feed base
observability_surfaces:
  - React Query DevTools cache key ["audit-log"] — inspect query state, staleness, errors
  - Browser Network tab — getSignaturesForAddress and getParsedTransactions RPC calls visible
duration: 8m
verification_result: passed
completed_at: 2026-03-23
blocker_discovered: false
---

# T01: Create useComplianceAuditLog query hook

**Added useComplianceAuditLog() hook that fetches on-chain program txs and filters to 7 compliance event types via COMPLIANCE_EVENTS allowlist**

## What Happened

Created `app/web/src/lib/queries/audit-log.ts` by cloning the `useActivityFeed()` pattern from `activity.ts`. The hook uses the same `getSignaturesForAddress` → `getParsedTransactions` → `EventParser.parseLogs` pipeline but adds a `Set`-based allowlist filter (`COMPLIANCE_EVENTS`) that keeps only the 7 compliance-relevant event types. The `ActivityEvent` interface is re-imported from `activity.ts` to avoid duplication. A `ComplianceEventName` union type is also exported for downstream type safety.

## Verification

- File exists: `test -f app/web/src/lib/queries/audit-log.ts` → PASS
- COMPLIANCE_EVENTS present: `grep -c "COMPLIANCE_EVENTS" audit-log.ts` → 4 (definition + usage)
- Hook exported: `grep -c "useComplianceAuditLog" audit-log.ts` → 1
- TypeScript compiles: `cd app/web && npx tsc --noEmit` → exit 0, no errors

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f app/web/src/lib/queries/audit-log.ts` | 0 | ✅ pass | <1s |
| 2 | `grep -c "COMPLIANCE_EVENTS" app/web/src/lib/queries/audit-log.ts` | 0 (4) | ✅ pass | <1s |
| 3 | `grep -c "useComplianceAuditLog" app/web/src/lib/queries/audit-log.ts` | 0 (1) | ✅ pass | <1s |
| 4 | `cd app/web && npx tsc --noEmit` | 0 | ✅ pass | 8.1s |

## Diagnostics

- Inspect query cache in React Query DevTools under key `["audit-log"]` — shows data array, fetch status, and errors.
- RPC failures surface as `isError: true` on the query result; the error object contains the Solana RPC error message.
- `COMPLIANCE_EVENTS` is exported and can be logged/asserted against in tests to verify filter coverage.

## Deviations

- Added `ComplianceEventName` union type (not in plan) for downstream type safety when filtering by event name.
- Added `## Observability / Diagnostics` section to S02-PLAN.md as required by pre-flight checks.

## Known Issues

None.

## Files Created/Modified

- `app/web/src/lib/queries/audit-log.ts` — New file: useComplianceAuditLog() hook and COMPLIANCE_EVENTS constant
- `.gsd/milestones/M004/slices/S02/S02-PLAN.md` — Marked T01 done, added Observability section
