---
id: T01
parent: S05
milestone: M001
provides:
  - useComplianceEntries React Query hook for hook program ComplianceEntry accounts
  - Rewritten compliance page with live devnet data and shadcn components
key_files:
  - app/web/src/lib/queries/compliance.ts
  - app/web/src/app/(console)/compliance/page.tsx
key_decisions:
  - Used hookProgram with GherkinPayHook cast following the agreements.ts pattern
  - Query key is just ["compliance"] without wallet scoping since .all() fetches all entries regardless of wallet
patterns_established:
  - Hook program queries use hookProgram from useAnchorProgram() cast to Program<GherkinPayHook>
observability_surfaces:
  - React Query devtools shows ["compliance"] query state
  - Browser network tab shows getProgramAccounts RPC calls to devnet
  - Error state renders error.message from failed RPC calls
duration: 8m
verification_result: passed
completed_at: 2026-03-20
blocker_discovered: false
---

# T01: Wire compliance query hook and rewrite compliance page with live data

**Created useComplianceEntries() hook fetching ComplianceEntry accounts from the hook program and rewrote compliance page with shadcn Table/Badge/Skeleton and loading/empty/error/disconnected states.**

## What Happened

Created `app/web/src/lib/queries/compliance.ts` with `useComplianceEntries()` following the exact pattern from `agreements.ts` — the key difference being it destructures `hookProgram` instead of `program` from `useAnchorProgram()` and casts to `Program<GherkinPayHook>`. The query fetches all `complianceEntry` accounts via `.all()` with query key `["compliance"]`.

Rewrote `app/web/src/app/(console)/compliance/page.tsx` as a `"use client"` component that consumes the hook. The page handles four states: wallet not connected (prompt message), loading (skeleton rows), error (red error message with `error.message`), and data (shadcn Table with account pubkey and isAllowed Badge — "Allowed" default variant, "Blocked" destructive variant). Empty state shows an informational message about entries appearing when wallets are added to the allowlist.

Removed the entire hardcoded `complianceEntries` array that was in the original page.

## Verification

All task and slice-level checks pass. Build and typecheck both exit 0. No hardcoded arrays remain in the compliance page. The hook uses `hookProgram` as required, and all imports use the `~/` alias.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run build` | 0 | ✅ pass | 10.2s |
| 2 | `cd app/web && bun run typecheck` | 0 | ✅ pass | 3s |
| 3 | `grep -q "hookProgram" app/web/src/lib/queries/compliance.ts` | 0 | ✅ pass | <1s |
| 4 | `grep -q "use client" app/web/src/app/(console)/compliance/page.tsx` | 0 | ✅ pass | <1s |
| 5 | `grep -q "useComplianceEntries" app/web/src/app/(console)/compliance/page.tsx` | 0 | ✅ pass | <1s |
| 6 | `! grep -q "complianceEntries =" app/web/src/app/(console)/compliance/page.tsx` | 0 | ✅ pass | <1s |
| 7 | `! grep -q "@/" app/web/src/lib/queries/compliance.ts app/web/src/app/(console)/compliance/page.tsx` | 0 | ✅ pass | <1s |
| 8 | `rg "complianceEntries =" app/web/src/app/(console)/compliance/` | 1 (no matches) | ✅ pass | <1s |

## Diagnostics

- **React Query devtools**: Query key `["compliance"]` shows fetch status, cache state, and errors when wallet is connected.
- **Browser network tab**: Look for JSON-RPC POST to devnet URL with `getProgramAccounts` method filtered by the hook program ID.
- **Visual states**: Disconnected → gray prompt text; Loading → skeleton rows; Error → red "Failed to load" text with message; Empty → centered "No compliance entries found" text; Data → table rows with pubkey + Allowed/Blocked badge.

## Deviations

- Added `## Observability / Diagnostics` section to `S05-PLAN.md` as requested by pre-flight checks.

## Known Issues

- Relayers page still has a hardcoded `relayers` array — this is T02's scope and expected.

## Files Created/Modified

- `app/web/src/lib/queries/compliance.ts` — New React Query hook fetching ComplianceEntry accounts from hook program
- `app/web/src/app/(console)/compliance/page.tsx` — Rewritten with live data, shadcn components, and proper state handling
- `.gsd/milestones/M001/slices/S05/S05-PLAN.md` — Marked T01 done, added Observability section
