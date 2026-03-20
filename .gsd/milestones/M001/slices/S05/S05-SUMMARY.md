---
id: S05
parent: M001
milestone: M001
provides:
  - useComplianceEntries() React Query hook fetching ComplianceEntry accounts from hook program
  - Compliance page with live devnet data, shadcn Table/Badge/Skeleton, and loading/empty/error/disconnected states
  - Clean relayers page with static placeholder (no mock data)
requires:
  - slice: S02
    provides: useAnchorProgram() hook (hookProgram), HOOK_PROGRAM_ID, GherkinPayHook IDL types
affects:
  - S06
key_files:
  - app/web/src/lib/queries/compliance.ts
  - app/web/src/app/(console)/compliance/page.tsx
  - app/web/src/app/(console)/relayers/page.tsx
key_decisions:
  - Hook program queries use hookProgram from useAnchorProgram() cast to Program<GherkinPayHook> — same pattern as D008 for main program
patterns_established:
  - Hook program query hooks follow identical pattern to main program hooks — destructure hookProgram instead of program, cast to Program<GherkinPayHook>
observability_surfaces:
  - React Query devtools: ["compliance"] query key shows fetch status and errors
  - Browser network tab: getProgramAccounts RPC calls for hook program ID
  - Error state renders error.message from failed RPC calls
drill_down_paths:
  - .gsd/milestones/M001/slices/S05/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S05/tasks/T02-SUMMARY.md
duration: 10m
verification_result: passed
completed_at: 2026-03-20
---

# S05: Compliance and Relayers — Live Reads

**Compliance page fetches live ComplianceEntry accounts from the hook program; relayers page cleaned of mock data with static placeholder for M003.**

## What Happened

T01 created `useComplianceEntries()` in `app/web/src/lib/queries/compliance.ts`, following the exact React Query + Anchor pattern from agreements/milestones but targeting the hook program. It destructures `hookProgram` from `useAnchorProgram()` and casts to `Program<GherkinPayHook>` to get typed account access. The query fetches all `complianceEntry` accounts via `.all()` with query key `["compliance"]`. The compliance page was rewritten as a `"use client"` component with four visual states: wallet disconnected (prompt), loading (skeleton rows), error (red message with `error.message`), and data (shadcn Table with pubkey + Allowed/Blocked badge).

T02 removed the hardcoded `relayers` array from the relayers page and replaced the table with a centered placeholder message. The page is now a static server component — relayer registration is M003 scope.

## Verification

All slice-level checks pass:

| Check | Result |
|-------|--------|
| `bun run build` | ✅ exits 0 |
| `bun run typecheck` | ✅ exits 0 |
| No hardcoded arrays (`rg "complianceEntries =\|relayers ="`) | ✅ no matches |
| Hook program used (`grep "hookProgram"`) | ✅ found |
| Client component (`grep "use client"`) | ✅ found |
| Live hook consumed (`grep "useComplianceEntries"`) | ✅ found |
| No @/ imports in S05 files | ✅ clean |

## New Requirements Surfaced

- none

## Deviations

none

## Known Limitations

- ComplianceEntry accounts only store `isAllowed` and `bump` — the mint/wallet context is encoded in the PDA seeds but not displayed in the table (would require PDA reverse-lookup or indexer). Current UI shows account pubkey and allowed status only.
- Relayers page is a static placeholder — no live data until M003 relayer registration.

## Follow-ups

- none

## Files Created/Modified

- `app/web/src/lib/queries/compliance.ts` — New React Query hook fetching ComplianceEntry accounts from hook program
- `app/web/src/app/(console)/compliance/page.tsx` — Rewritten with live devnet data, shadcn components, four visual states
- `app/web/src/app/(console)/relayers/page.tsx` — Removed mock array, replaced with static placeholder

## Forward Intelligence

### What the next slice should know
- All query hooks (agreements, milestones, compliance) follow the same pattern: destructure from `useAnchorProgram()`, cast to typed Program generic, use `.all()` or `.fetch()`, wrap in `useQuery`. S06 (Activity) is different — it parses transaction logs rather than account data, so it won't use `.account.*` methods.

### What's fragile
- The `useAnchorProgram()` hook returns `hookProgram` as untyped — every consumer must cast to `Program<GherkinPayHook>`. If the IDL shape changes, the cast silently passes and runtime errors surface instead of compile errors.

### Authoritative diagnostics
- React Query devtools `["compliance"]` query — shows whether the hook program RPC call succeeds or fails, with exact error messages.
- Browser network tab — look for `getProgramAccounts` JSON-RPC POST to devnet with the hook program ID (`3pG9tTyExGA3C7sdvw5AcUvfmwydtRCLV22KPb6SfYRc`).

### What assumptions changed
- No assumptions changed — S05 was straightforward, applying established patterns from S03/S04 to the hook program.
