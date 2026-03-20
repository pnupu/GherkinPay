---
id: S04
milestone: M001
provides:
  - useMilestones() React Query hook fetching all conditionAccount accounts with client-side join to agreements
  - Milestones page rewritten as "use client" with four UI states (disconnected/loading/empty/populated)
  - shadcn Table/Badge/Skeleton used for milestone display
  - MILESTONE_STATUS_CONFIG map for pending/active/released status badge variants
key_files:
  - app/web/src/lib/queries/milestones.ts
  - app/web/src/app/(console)/milestones/page.tsx
key_decisions:
  - conditionAccount.operator is the TypeScript field name (not conditionOperator) — IDL struct field name drops the condition prefix
  - Status enum keys lowercased (.toLowerCase()) to match config map keys since Anchor preserves original casing (Pending not pending)
  - Unfiltered fetch (conditionAccount.all()) with client-side join — acceptable at devnet scale
patterns_established:
  - All query hooks follow same structure: enabled guard on program + upstream data, useWallet for cache key, Map-based join
  - Four-state page pattern (disconnected/loading/empty/populated) is consistent across agreements and milestones pages
drill_down_paths:
  - .gsd/milestones/M001/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S04/tasks/T02-SUMMARY.md
duration: 15min
verification_result: pass
completed_at: 2026-03-20
---

# S04: Milestones — Live Reads

**useMilestones() hook and milestones page rewritten with live conditionAccount data, four UI states, shadcn components, zero hardcoded mock arrays.**

## What Happened

### T01 — useMilestones hook

Created `lib/queries/milestones.ts` following the `useAgreements()` pattern exactly. Fetches all `conditionAccount` accounts via `program.account.conditionAccount.all()` and performs a client-side Map join to the agreements data to resolve `parentPaymentId` for display. Query key `["milestones", walletPubkey]`. Enabled only when program and agreements are loaded.

One lint fix: `import type { BN }` instead of value import (consistent-type-imports rule).

### T02 — Milestones page rewrite

Rewrote `milestones/page.tsx` as `"use client"` with four UI states matching the agreements page pattern. One build error discovered: the TypeScript-decoded conditionAccount type exposes the operator field as `account.operator` (not `account.conditionOperator`). The IDL field is named `operator` in the ConditionAccount struct; the `condition` prefix only appears in instruction argument names.

Status enum keys are lowercased to match MILESTONE_STATUS_CONFIG since Anchor decodes enum variants with original capitalization (`Pending` → `.toLowerCase()` → `pending`).

## Verification

| Check | Result |
|-------|--------|
| `bun run build` | exit 0 ✅ |
| `bun run typecheck` | exit 0 ✅ |
| no tRPC refs in milestones/ | 0 matches ✅ |
| no mock data strings | 0 matches ✅ |
| no @/ imports | 0 matches ✅ |
| useMilestones export | present ✅ |

## What S05/S06 Should Know

- The four-state page pattern is established — use disconnected/loading/empty/populated in compliance and activity pages
- Enum key lowercasing pattern: `Object.keys(account.someEnum)[0]!.toLowerCase()` to match config map keys
- `account.operator` (not `account.conditionOperator`) — watch for similar IDL field name surprises in hook program accounts

## Files Created/Modified

- `app/web/src/lib/queries/milestones.ts` — new: useMilestones() React Query hook
- `app/web/src/app/(console)/milestones/page.tsx` — full rewrite: live data, four UI states
