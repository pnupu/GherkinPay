---
id: T02
parent: S04
milestone: M001
provides:
  - Milestones page rendering live on-chain conditionAccount data with four UI states
key_files:
  - app/web/src/app/(console)/milestones/page.tsx
  - app/web/src/lib/queries/milestones.ts
key_decisions:
  - Used same Badge variant mapping as agreements page (outline/default/secondary) for status consistency
patterns_established:
  - Four-state UI pattern (disconnected/loading/empty/populated) now consistent across agreements and milestones pages
observability_surfaces:
  - React Query DevTools key ["milestones", walletPubkey] for cache inspection
  - Error state renders error.message in destructive styling
  - Four explicit UI branches for state diagnosis
duration: 10m
verification_result: passed
completed_at: 2026-03-19
blocker_discovered: false
---

# T02: Rewrite milestones page with live data

**Rewrote milestones page to consume useMilestones() hook with four UI states, shadcn components, and zero mock data**

## What Happened

The milestones page was already rewritten in a previous attempt with the correct pattern — `useMilestones()` consumption, four UI states (disconnected/loading/empty/populated plus error), shadcn Table/Badge/Skeleton, USDC formatting, status badges, and all tRPC/mock data removed. The previous verification failure was due to `bun run build` being executed from the wrong directory (project root instead of `app/web/`).

Fixed the unused `BN` import in `milestones.ts` caught by ESLint during build. Added the missing Observability Impact section to T02-PLAN.md.

## Verification

All slice-level verification checks pass:
- `cd app/web && bun run build` exits 0
- `cd app/web && bun run typecheck` exits 0
- No tRPC/HydrateClient references in milestones directory
- No mock data strings in milestones directory
- No `@/` imports in milestones page or query hook
- `useMilestones` export confirmed in milestones.ts

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run build` | 0 | ✅ pass | 10s |
| 2 | `cd app/web && bun run typecheck` | 0 | ✅ pass | 3s |
| 3 | `rg "tRPC\|trpc\|HydrateClient" app/web/src/app/(console)/milestones/` | 1 (no match) | ✅ pass | <1s |
| 4 | `rg "M-01\|M-02\|M-03\|Northline\|Boreal\|PAY-40" app/web/src/app/(console)/milestones/` | 1 (no match) | ✅ pass | <1s |
| 5 | `rg "@/" app/web/src/app/(console)/milestones/page.tsx` | 1 (no match) | ✅ pass | <1s |
| 6 | `rg "useMilestones" app/web/src/lib/queries/milestones.ts` | 0 | ✅ pass | <1s |

## Diagnostics

- **React Query DevTools:** Inspect cache key `["milestones", "<walletPubkey>"]` for data/loading/error state
- **UI state inspection:** Four branches render based on `connected`, `isLoading`, `isError`, and `data.length` — check wallet connection and query state to diagnose rendering
- **RPC errors:** Rendered inline with `error.message` in destructive styling

## Deviations

- Previous attempt had already completed the page rewrite correctly; this attempt only fixed the unused `BN` import warning and added the Observability Impact section to the task plan.

## Known Issues

None.

## Files Created/Modified

- `app/web/src/app/(console)/milestones/page.tsx` — milestones page with live on-chain data (verified from previous attempt)
- `app/web/src/lib/queries/milestones.ts` — removed unused `BN` import to fix ESLint warning
- `.gsd/milestones/M001/slices/S04/tasks/T02-PLAN.md` — added Observability Impact section
