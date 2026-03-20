---
id: S04
parent: M001
milestone: M001
provides:
  - useMilestones() React Query hook fetching conditionAccount data with parent agreement join
  - Milestones page rendering live on-chain data with four UI states (disconnected/loading/empty/populated)
requires:
  - slice: S02
    provides: useAnchorProgram() hook, Program<GherkinPay> type, wallet adapter context
  - slice: S03
    provides: useAgreements() hook for parent payment context, query hook pattern, PDA helpers
affects:
  - S05
  - S06
key_files:
  - app/web/src/lib/queries/milestones.ts
  - app/web/src/app/(console)/milestones/page.tsx
key_decisions:
  - Unfiltered fetch (conditionAccount.all()) with client-side join to agreements — acceptable at devnet scale
  - Same Badge variant mapping as agreements page for cross-page visual consistency
patterns_established:
  - Four-state UI pattern (disconnected/loading/empty/populated) now proven across two pages — established as the standard for S05/S06
  - Query hooks in lib/queries/ follow identical structure — Program<GherkinPay> cast, useWallet for cache key, enabled guard on upstream data
observability_surfaces:
  - React Query DevTools cache key ["milestones", walletPubkey] — inspect data shape, loading state, error
  - Error state renders error.message in destructive styling — RPC failures visible in UI
  - Orphaned milestones (parentPaymentId === undefined) indicate conditionAccounts pointing to agreements not in current wallet scope
drill_down_paths:
  - .gsd/milestones/M001/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S04/tasks/T02-SUMMARY.md
duration: 15m
verification_result: passed
completed_at: 2026-03-20
---

# S04: Milestones — Live Reads

**Milestones page fetches real conditionAccount data from devnet, joined to parent agreements, with status badges, USDC amounts, and condition counts — zero mock data remaining**

## What Happened

T01 created the `useMilestones()` React Query hook in `lib/queries/milestones.ts`, following the exact pattern established by `useAgreements()` in S03. The hook calls `program.account.conditionAccount.all()` for an unfiltered fetch, then performs a client-side join to the agreements data from `useAgreements()` via a Map lookup on `account.payment` pubkey. Each returned entry includes the raw conditionAccount data, its pubkey, the parent agreement's `paymentId` (for human-readable display), and the parent pubkey. The query is enabled only when both the Anchor program and agreements data are available, creating a natural dependency chain.

T02 rewrote the milestones page as a `"use client"` component consuming `useMilestones()`. The page implements four UI states: disconnected (connect prompt), loading (skeleton rows via shadcn Skeleton), empty (informational message), and populated (shadcn Table with columns for milestone index, parent agreement ID, USDC amount formatted via Intl.NumberFormat, status badge, condition count, operator, and finalized flag). All tRPC imports, HydrateClient wrappers, and hardcoded mock data were removed. An ESLint-caught unused `BN` import was cleaned up during verification.

## Verification

All six slice-level verification checks pass:

| # | Check | Result |
|---|-------|--------|
| 1 | `cd app/web && bun run build` exits 0 | ✅ pass |
| 2 | `cd app/web && bun run typecheck` exits 0 | ✅ pass |
| 3 | No `tRPC/trpc/HydrateClient` in milestones directory | ✅ pass |
| 4 | No mock data strings (`M-01/M-02/M-03/Northline/Boreal/PAY-40`) in milestones directory | ✅ pass |
| 5 | No `@/` imports in query hook or page | ✅ pass |
| 6 | `useMilestones` export confirmed | ✅ pass |

## New Requirements Surfaced

- none

## Deviations

none

## Known Limitations

- `conditionAccount.all()` is unfiltered — fetches every condition account on the program, not scoped to the connected wallet's agreements. Acceptable at devnet scale but will need server-side filtering or getProgramAccounts filters for mainnet.
- Milestones with parent agreements outside the current wallet's scope show a truncated pubkey instead of a human-readable payment ID.

## Follow-ups

- none

## Files Created/Modified

- `app/web/src/lib/queries/milestones.ts` — new: useMilestones() React Query hook with conditionAccount fetch and agreement join
- `app/web/src/app/(console)/milestones/page.tsx` — full rewrite: live on-chain data with four UI states, shadcn components, zero mock data

## Forward Intelligence

### What the next slice should know
- The four-state UI pattern (disconnected/loading/empty/populated) is now proven across two pages (agreements, milestones). Copy the milestones page structure for S05 compliance — it's the cleanest example since it was written second.
- Query hooks in `lib/queries/` all follow the same shape: `Program<GherkinPay>` cast from `useAnchorProgram()`, `useWallet()` for cache key, `enabled` guard on upstream data. S05's `useComplianceEntries()` should use `Program<GherkinPayHook>` instead but otherwise identical structure.
- The `useAgreements()` dependency chain works — `useMilestones()` waits for agreements to load before enabling its own query. S05 compliance does NOT need this pattern since compliance entries are independent of agreements.

### What's fragile
- `conditionAccount.all()` unfiltered fetch — works at devnet scale but will break with many accounts on mainnet. The same pattern is used in `useAgreements()`. Both need `memcmp` filters eventually.
- The `enabled: !!program && !!agreements` guard creates a silent dependency — if `useAgreements()` errors, milestones will stay in loading state forever with no error shown. The page only shows its own query errors.

### Authoritative diagnostics
- React Query DevTools → cache key `["milestones", "<walletPubkey>"]` — shows exact fetched data shape, loading/error state, and stale time. This is the fastest way to distinguish between "no data on-chain" and "query failed".
- Browser console `conditionAccount.all()` RPC errors — if the Anchor program IDL doesn't match deployed program, this call fails with an account discriminator mismatch. Check the IDL `address` field matches the deployed program ID.

### What assumptions changed
- No assumptions changed — S04 was low-risk and executed exactly as planned.
