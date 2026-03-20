---
id: T01
parent: S04
milestone: M001
provides:
  - useMilestones React Query hook for conditionAccount data
key_files:
  - app/web/src/lib/queries/milestones.ts
key_decisions:
  - Unfiltered fetch (conditionAccount.all()) with client-side join — acceptable at devnet scale
patterns_established:
  - Query hooks in lib/queries/ follow same structure: Program<GherkinPay> cast, useWallet for key, enabled guard
observability_surfaces:
  - React Query cache key ["milestones", walletPubkey] visible in DevTools
  - isLoading/isError/error exposed for consumer rendering
  - Orphaned milestones detectable via undefined parentPaymentId
duration: 5min
verification_result: passed
completed_at: 2026-03-19
blocker_discovered: false
---

# T01: Build useMilestones query hook

**Created useMilestones() hook that fetches all conditionAccount accounts and joins to parent agreements**

## What Happened

Created `app/web/src/lib/queries/milestones.ts` following the exact pattern from `agreements.ts` (S03). The hook fetches all `conditionAccount` accounts via `program.account.conditionAccount.all()` with no server-side filter, then performs a client-side join to the agreements data from `useAgreements()` using a Map lookup on `account.payment` pubkey. Each result includes the raw account data, its pubkey, the parent agreement's `paymentId` (for display), and the parent pubkey.

The `BN` import is `import type` only — the type assertion on `parentPaymentId` was unnecessary since TypeScript already infers the correct optional type from the map lookup.

## Verification

- `bun run build` exits 0 — clean compilation, no lint errors
- `bun run typecheck` exits 0 — no type errors
- `rg "useMilestones"` confirms export exists
- `rg "@/"` returns no matches — all imports use `~/` alias

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run build` | 0 | ✅ pass | 9.4s |
| 2 | `cd app/web && bun run typecheck` | 0 | ✅ pass | 2.0s |
| 3 | `rg "useMilestones" app/web/src/lib/queries/milestones.ts` | 0 | ✅ pass | <1s |
| 4 | `rg "@/" app/web/src/lib/queries/milestones.ts` | 1 (no matches) | ✅ pass | <1s |
| 5 | `rg "tRPC\|trpc\|HydrateClient" app/web/src/app/(console)/milestones/` | 1 (no matches) | ✅ pass | <1s |
| 6 | `rg "M-01\|M-02\|M-03\|Northline\|Boreal\|PAY-40" app/web/src/app/(console)/milestones/` | 0 (matches found) | ⏳ expected — mock data removed in later task | <1s |

## Diagnostics

- **Cache inspection:** React Query DevTools → key `["milestones", "<walletPubkey>"]`
- **Hook state:** destructure `{ data, isLoading, isError, error }` from `useMilestones()`
- **Orphan detection:** entries where `parentPaymentId === undefined` indicate conditionAccounts pointing to agreements not loaded by the current wallet filter

## Deviations

- Used `import type { BN }` instead of value import — lint rule `consistent-type-imports` required it since BN is only used in type position.
- Removed unnecessary type assertion `as BN | undefined` on `parentPaymentId` — TypeScript infers the correct type from optional chaining.

## Known Issues

None.

## Files Created/Modified

- `app/web/src/lib/queries/milestones.ts` — new file: useMilestones() React Query hook
- `.gsd/milestones/M001/slices/S04/tasks/T01-PLAN.md` — added Observability Impact section
