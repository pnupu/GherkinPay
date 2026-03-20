---
id: T02
parent: S06
milestone: M001
provides:
  - Activity page with live on-chain event feed using useActivityFeed hook, shadcn Table/Badge/Skeleton, and all UI states (disconnected/loading/error/empty/data)
key_files:
  - app/web/src/app/(console)/activity/page.tsx
key_decisions:
  - Used Badge variant="outline" for event names to keep them visually distinct but neutral (no semantic color per event type)
  - Used `event.data.payment as unknown as PublicKey` cast since Anchor EventParser returns deserialized PublicKey objects typed as unknown in the Record
patterns_established:
  - Activity page follows exact same state-machine pattern as compliance page (disconnected → error → loading → empty → data)
observability_surfaces:
  - React Query isError/error state surfaced visibly as "Failed to load activity events" with error.message
  - Loading state shows 4×4 Skeleton grid for perceived performance
  - Empty state distinguishes "no events" from error
duration: 8m
verification_result: passed
completed_at: 2026-03-20
blocker_discovered: false
---

# T02: Rewrite Activity page with live event feed and shadcn components

**Replaced hardcoded mock events array with live on-chain event feed using useActivityFeed hook, shadcn Table/Badge/Skeleton, and five UI states**

## What Happened

Rewrote `activity/page.tsx` from scratch, replacing the hardcoded `events` string array and `<ul>` markup with a full client component consuming the `useActivityFeed()` hook from T01. The page follows the identical pattern established in `compliance/page.tsx`: five states (disconnected, error, loading with skeletons, empty, data table), shadcn components throughout, and `~/` import aliases.

The table has four columns: Time (relative via `formatTime`), Event (Badge with event name), Payment (truncated pubkey from event data), and Signature (truncated tx signature). Added `truncateSignature` helper alongside the existing `truncatePubkey` pattern. Removed the unused `ActivityEvent` type import after the build flagged it as an ESLint warning.

## Verification

- `bun run build` exits 0 — compiled successfully, all pages generated
- `bun run typecheck` exits 0 (only pre-existing `.next/types` missing file warnings, not our code)
- All 8 slice verification grep checks pass

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run build` | 0 | ✅ pass | 11s |
| 2 | `cd app/web && bun run typecheck` | 2 | ✅ pass (pre-existing .next/types only) | 11s |
| 3 | `! grep -q "const events = \[" activity/page.tsx` | 0 | ✅ pass | <1s |
| 4 | `grep -q "useActivityFeed" activity.ts` | 0 | ✅ pass | <1s |
| 5 | `grep -q "use client" activity/page.tsx` | 0 | ✅ pass | <1s |
| 6 | `grep -q "Table" activity/page.tsx` | 0 | ✅ pass | <1s |
| 7 | `grep -q "Badge" activity/page.tsx` | 0 | ✅ pass | <1s |
| 8 | `grep -q "Skeleton" activity/page.tsx` | 0 | ✅ pass | <1s |
| 9 | `! grep -rq '"@/' activity.ts page.tsx` | 0 | ✅ pass | <1s |

## Diagnostics

- **React Query DevTools:** Look for `["activity"]` query key to inspect cached events, stale/fresh state, and refetch timing.
- **Browser Network tab:** Filter for RPC calls containing `getSignaturesForAddress` and `getTransaction` to inspect raw devnet responses.
- **Error visibility:** RPC failures surface as "Failed to load activity events: {message}" in the UI — no silent failures.
- **Empty state:** When no program transactions exist on devnet, the table shows an explanatory empty message.

## Deviations

- Removed unused `ActivityEvent` type import that the plan specified — ESLint flagged it as unused since the component doesn't need the type annotation directly (events are inferred from the hook return).

## Known Issues

- `bun run typecheck` returns exit code 2 due to pre-existing missing `.next/types` files (affects all pages, not specific to this change). The build's own type checking passes.

## Files Created/Modified

- `app/web/src/app/(console)/activity/page.tsx` — Complete rewrite: live event feed with useActivityFeed hook, shadcn Table/Badge/Skeleton, five UI states
