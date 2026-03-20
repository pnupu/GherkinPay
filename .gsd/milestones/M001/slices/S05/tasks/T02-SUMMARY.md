---
id: T02
parent: S05
milestone: M001
provides:
  - Clean static relayers page with no mock data
key_files:
  - app/web/src/app/(console)/relayers/page.tsx
key_decisions: []
patterns_established: []
observability_surfaces:
  - none — static page with no runtime behavior
duration: 2min
verification_result: passed
completed_at: 2026-03-20
blocker_discovered: false
---

# T02: Clean up relayers page — remove mock data, add static placeholder

**Removed hardcoded relayers mock array and replaced table with centered placeholder message for future relayer management**

## What Happened

Rewrote the relayers page to remove the hardcoded `relayers` array and its associated table. Replaced with a centered informational placeholder stating that relayer registration and management will be available in a future update. The page is now a static server component with no client-side hooks or mock data.

## Verification

- `bun run build` — exits 0, relayers page rendered as static (○)
- `bun run typecheck` — exits 0
- `! grep -q "relayers ="` — no mock array in relayers page
- `! grep -q "@/"` — no @/ imports in any S05 files
- `rg "complianceEntries =|relayers ="` — no hardcoded arrays in compliance or relayers pages
- All slice-level verification checks pass

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run build` | 0 | ✅ pass | 10.7s |
| 2 | `cd app/web && bun run typecheck` | 0 | ✅ pass | 3.1s |
| 3 | `rg "complianceEntries =\|relayers =" ...` | 1 (no matches) | ✅ pass | <1s |
| 4 | `grep -q "hookProgram" compliance.ts` | 0 | ✅ pass | <1s |
| 5 | `grep -q "use client" compliance/page.tsx` | 0 | ✅ pass | <1s |
| 6 | `grep -q "useComplianceEntries" compliance/page.tsx` | 0 | ✅ pass | <1s |
| 7 | `! grep -q "@/" ...` (3 files) | 0 | ✅ pass | <1s |

## Diagnostics

This is a static page with no runtime behavior. Verify visually by navigating to `/relayers` in the console — should show a centered placeholder message with no table or data.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `app/web/src/app/(console)/relayers/page.tsx` — Rewrote to remove mock data array and table, replaced with static placeholder message
