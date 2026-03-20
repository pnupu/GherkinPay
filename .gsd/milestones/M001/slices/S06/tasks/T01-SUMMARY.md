---
id: T01
parent: S06
milestone: M001
provides:
  - useActivityFeed React Query hook with EventParser-based on-chain log parsing
  - ActivityEvent type export for downstream consumption
key_files:
  - app/web/src/lib/queries/activity.ts
key_decisions:
  - Used nullish coalescing (blockTime ?? null) for blockTime to satisfy strict TS — getParsedTransactions returns undefined, not null, for missing blockTime
patterns_established:
  - EventParser-based log parsing pattern for on-chain event extraction in React Query hooks
observability_surfaces:
  - React Query ["activity"] cache entry visible in RQ DevTools
  - RPC calls (getSignaturesForAddress, getParsedTransactions) visible in browser Network tab
duration: 10m
verification_result: passed
completed_at: 2026-03-20
blocker_discovered: false
---

# T01: Create useActivityFeed query hook with EventParser log parsing

**Created useActivityFeed() hook that fetches recent gherkin_pay program transactions and parses logs via Anchor EventParser into typed ActivityEvent objects**

## What Happened

Created `app/web/src/lib/queries/activity.ts` following the established pattern from `useComplianceEntries()` in compliance.ts. The hook uses `connection.getSignaturesForAddress(PROGRAM_ID, { limit: 50 })` to get recent transaction signatures, batch-fetches parsed transactions, then iterates with `EventParser` to extract named events from log messages. Each event is mapped to an `ActivityEvent` with signature, slot, blockTime, name, and data fields. Null transactions and missing logMessages are skipped defensively. Program is cast to `Program<GherkinPay>` for typed coder access per D008.

Initial implementation had two TS errors: `sigInfos[i]` could be undefined (array index access), and `tx.blockTime` from `getParsedTransactions` is `number | null | undefined` but our interface expects `number | null`. Fixed by adding a `sigInfo` guard and using `blockTime ?? null`.

## Verification

All five task-level grep checks pass. Typecheck (`tsc --noEmit`) exits 0 with no errors. Slice-level checks for this hook (useActivityFeed exported, no @/ imports) pass. Remaining slice checks (build, page-level) depend on T02.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -q "useActivityFeed" app/web/src/lib/queries/activity.ts` | 0 | ✅ pass | <1s |
| 2 | `grep -q "EventParser" app/web/src/lib/queries/activity.ts` | 0 | ✅ pass | <1s |
| 3 | `grep -q "getSignaturesForAddress" app/web/src/lib/queries/activity.ts` | 0 | ✅ pass | <1s |
| 4 | `grep -q '"use client"' app/web/src/lib/queries/activity.ts` | 0 | ✅ pass | <1s |
| 5 | `! grep -q '"@/' app/web/src/lib/queries/activity.ts` | 0 | ✅ pass | <1s |
| 6 | `cd app/web && bun run typecheck` | 0 | ✅ pass | 2s |

## Diagnostics

- **React Query DevTools:** Look for `["activity"]` query key to see cached events, stale/fresh state, and refetch timing.
- **Browser Network tab:** Filter for RPC calls containing `getSignaturesForAddress` and `getTransaction` to inspect raw devnet responses.
- **Error state:** RPC failures surface as React Query `isError=true` with the error object containing the RPC error message.
- **Empty state:** If no program transactions exist on devnet, the hook returns an empty array (not an error).

## Deviations

None — implementation followed the task plan exactly. The only adjustment was TypeScript strictness fixes for array index access and blockTime nullability.

## Known Issues

None.

## Files Created/Modified

- `app/web/src/lib/queries/activity.ts` — New `useActivityFeed()` hook and `ActivityEvent` type export
- `.gsd/milestones/M001/slices/S06/S06-PLAN.md` — Added Observability/Diagnostics section, marked T01 done
