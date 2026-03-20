---
id: T02
parent: S04
milestone: M001
provides:
  - Milestones page rewritten as "use client" component consuming useMilestones()
  - Four UI states: disconnected, loading (skeleton), empty, populated
  - shadcn Table/Badge/Skeleton used throughout
  - MILESTONE_STATUS_CONFIG mapping pending/active/released to Badge variants
  - Zero hardcoded mock data, zero tRPC references, zero @/ imports
key_files:
  - app/web/src/app/(console)/milestones/page.tsx
key_decisions:
  - Field name is `operator` (not `conditionOperator`) in the TypeScript-decoded conditionAccount type — IDL camelCase mapping omits the `condition` prefix
  - Status enum keys lowercased via `.toLowerCase()` to match MILESTONE_STATUS_CONFIG keys (Pending → pending)
patterns_established:
  - Milestones page follows identical four-state pattern to agreements page (S03)
  - Milestone display shows index as #N (milestoneIndex + 1), agreement as paymentId or truncated pubkey fallback
drill_down_paths:
  - .gsd/milestones/M001/slices/S04/tasks/T02-PLAN.md
duration: 10min
verification_result: pass
completed_at: 2026-03-20
blocker_discovered: false
---

# T02: Rewrite milestones page with live data

**Milestones page rewritten to consume useMilestones() with four UI states, shadcn Table/Badge/Skeleton, zero hardcoded mock data**

## What Happened

Rewrote `milestones/page.tsx` as a `"use client"` component following the exact agreements page pattern from S03. The page consumes `useMilestones()` and renders four states: disconnected (connect prompt), loading (skeleton rows), empty (no milestones message), and populated (full table).

One type error required a fix: the decoded conditionAccount TypeScript type exposes the operator field as `account.operator` not `account.conditionOperator`. The IDL JSON uses `operator` as the field name; the `condition` prefix in `conditionOperator` only appears in instruction argument names, not in the account struct. Fixed by using `Object.keys(account.operator)`.

The MILESTONE_STATUS_CONFIG maps the three MilestoneStatus enum variants (pending/active/released) to shadcn Badge variants: outline, default, and secondary. Status keys are lowercased to match config keys since Anchor decodes enum variant names with original casing (`Pending` → `.toLowerCase()` → `pending`).

## Verification

| Check | Command | Result |
|-------|---------|--------|
| build | `cd app/web && bun run build` | exit 0 ✅ |
| typecheck | `cd app/web && bun run typecheck` | exit 0 ✅ |
| no tRPC | `rg "tRPC\|trpc\|HydrateClient" milestones/` | 0 matches ✅ |
| no mock data | `rg "M-01\|M-02\|PAY-40" milestones/` | 0 matches ✅ |
| no @/ imports | `rg "@/" milestones/page.tsx` | 0 matches ✅ |
| useMilestones used | grep in page.tsx | present ✅ |

## Deviations

- `conditionOperator` → `operator`: IDL field name in conditionAccount struct is `operator`, not `conditionOperator`. The build error surfaced this immediately.

## Files Created/Modified

- `app/web/src/app/(console)/milestones/page.tsx` — full rewrite: live data, four UI states, shadcn components, zero mock arrays
