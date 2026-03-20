---
id: S06
parent: M001
milestone: M001
provides:
  - useActivityFeed() React Query hook parsing on-chain program events via Anchor EventParser
  - Activity page with live event feed, shadcn Table/Badge/Skeleton, five UI states
  - ActivityEvent type export for potential downstream use
requires:
  - slice: S02
    provides: useAnchorProgram() hook (program.coder for EventParser), PROGRAM_ID constant, RPC connection
  - slice: S01
    provides: shadcn Table, Badge, Skeleton components
affects: []
key_files:
  - app/web/src/lib/queries/activity.ts
  - app/web/src/app/(console)/activity/page.tsx
key_decisions:
  - Badge variant="outline" for event names — neutral styling, no semantic color per event type
  - Cast event.data.payment as unknown as PublicKey since Anchor EventParser returns deserialized PublicKey objects typed as unknown in the Record
patterns_established:
  - EventParser-based log parsing pattern for extracting typed events from on-chain transaction logs
  - All five console pages now follow identical state machine pattern (disconnected → error → loading → empty → data)
observability_surfaces:
  - React Query ["activity"] cache entry visible in RQ DevTools
  - RPC calls (getSignaturesForAddress, getParsedTransactions) visible in browser Network tab
  - Error state surfaced visibly as "Failed to load activity events" with error.message
drill_down_paths:
  - .gsd/milestones/M001/slices/S06/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S06/tasks/T02-SUMMARY.md
duration: 18m
verification_result: passed
completed_at: 2026-03-20
---

# S06: Activity Event Feed

**Live on-chain event feed parsing gherkin_pay program transaction logs via Anchor EventParser, displayed with shadcn Table/Badge/Skeleton and five UI states**

## What Happened

T01 created the `useActivityFeed()` React Query hook in `app/web/src/lib/queries/activity.ts`. The hook fetches the last 50 transaction signatures for `PROGRAM_ID` via `getSignaturesForAddress`, batch-fetches parsed transactions, then iterates with Anchor's `EventParser` to extract named events (PaymentCreated, PaymentFunded, etc.) from each transaction's log messages. Each event is mapped to an `ActivityEvent` with signature, slot, blockTime, name, and data fields. Null transactions and missing logMessages are skipped defensively. Two TypeScript strictness fixes were needed: array index access guard and `blockTime ?? null` coalescing.

T02 rewrote `activity/page.tsx` from scratch, replacing the hardcoded mock `events` array with a client component consuming `useActivityFeed()`. The page follows the identical pattern established in compliance/agreements/milestones pages: five states (disconnected, error with message, loading with 4×4 Skeleton grid, empty with explanatory message, data table). Table columns: Time (relative timestamp), Event (Badge), Payment (truncated pubkey), Signature (truncated). All imports use `~/` alias.

With S06 complete, all five console pages (Agreements, Milestones, Compliance, Relayers, Activity) are wired to live on-chain data with zero hardcoded mock arrays remaining — fulfilling the M001 milestone definition of done.

## Verification

| # | Check | Result |
|---|-------|--------|
| 1 | `cd app/web && bun run build` exits 0 | ✅ pass |
| 2 | No hardcoded `const events = [` in activity page | ✅ pass |
| 3 | `useActivityFeed` exported from activity.ts | ✅ pass |
| 4 | `"use client"` directive in activity page | ✅ pass |
| 5 | shadcn `Table` used in activity page | ✅ pass |
| 6 | No `@/` imports in activity files | ✅ pass |

Note: `bun run build` must be run from `app/web/`, not the repo root (root package.json has no build script).

## Requirements Advanced

- R005 — Activity page now shows real on-chain events parsed from program logs via EventParser; events labelled by type with timestamp and affected payment pubkey
- R006 — Activity page uses shadcn Table/Badge/Skeleton; all five console pages now use shadcn components consistently

## Requirements Validated

- R005 — Activity page parses real on-chain events from gherkin_pay program transactions using Anchor EventParser; build passes with live data hooks
- R006 — All UI elements across all five console pages use shadcn/ui components; S01 through S06 all adopted Table/Badge/Skeleton consistently

## New Requirements Surfaced

- none

## Deviations

- Removed unused `ActivityEvent` type import from page.tsx — ESLint flagged it since the type is inferred from the hook return. The type remains exported from activity.ts for potential downstream use.

## Known Limitations

- `bun run typecheck` returns exit code 2 due to pre-existing missing `.next/types` route files — this affects all pages, not specific to S06. The build's own type checking passes.
- Activity feed shows raw event names from Anchor (e.g. `PaymentCreated`) without human-friendly labels or descriptions — acceptable for M001 foundation, can be polished in M002.
- No pagination or infinite scroll — fetches last 50 transactions only. Sufficient for devnet activity volume.

## Follow-ups

- none — S06 is the terminal slice in M001. All milestone success criteria are met.

## Files Created/Modified

- `app/web/src/lib/queries/activity.ts` — New useActivityFeed() hook with EventParser log parsing and ActivityEvent type
- `app/web/src/app/(console)/activity/page.tsx` — Complete rewrite: live event feed with shadcn components and five UI states
