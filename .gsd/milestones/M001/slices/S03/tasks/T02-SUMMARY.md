---
id: T02
parent: S03
milestone: M001
provides:
  - Agreements page rewritten with live on-chain data via useAgreements() hook
  - Four UI states: disconnected wallet, loading skeletons, empty, populated table
  - shadcn Table, Badge, Skeleton integration on agreements page
key_files:
  - app/web/src/app/(console)/agreements/page.tsx
  - app/web/src/components/ui/skeleton.tsx
key_decisions:
  - Used "use client" on the page directly rather than a server shell + client sub-component — simpler, and the page has no server data needs now that tRPC is removed
patterns_established:
  - Status enum extraction via Object.keys(account.status)[0] with STATUS_CONFIG lookup map for Badge variant mapping
  - BN amount formatting via Intl.NumberFormat after dividing by 1e6 (USDC decimals)
  - Pubkey truncation as first4…last4 for counterparty display
observability_surfaces:
  - React Query cache key ["agreements", pubkey] visible in DevTools
  - RPC errors rendered in UI error state with error.message
  - Wallet disconnected state renders connect prompt (no silent failures)
duration: 12m
verification_result: passed
completed_at: 2026-03-19
blocker_discovered: false
---

# T02: Rewrite agreements page with live data and shadcn components

**Replaced hardcoded mock agreements page with client component consuming useAgreements() hook, rendering live on-chain data via shadcn Table/Badge/Skeleton with four UI states**

## What Happened

Added the shadcn Skeleton component via CLI. Rewrote the agreements page as a `"use client"` component that imports `useAgreements()` from T01 and `useWallet()` from the wallet adapter. Removed all tRPC imports (`api`, `HydrateClient`), the mock `agreements` array, and the `api.post.hello()` call.

The page handles four states: (1) wallet disconnected → connect prompt, (2) loading → 4 skeleton rows in the table layout, (3) error → destructive-colored message with `error.message`, (4) populated → full table with live data. Empty results show an informational message inside the table body.

Table columns: Agreement ID (`#N`), Counterparty (truncated pubkey of the other party), Type (Simple or Milestone with phase count), Amount (BN ÷ 1e6 formatted as USD, with released amount for milestones), Status (Badge with variant mapping from STATUS_CONFIG), Created (BN timestamp × 1000 → Date).

Hit one ESLint issue during build: `@typescript-eslint/non-nullable-type-assertion-style` required `!` assertion on `Object.keys(status)[0]` instead of `as string`. Fixed and rebuilt clean.

## Verification

- `bun run build` — passes (exit 0)
- `bun run typecheck` — passes (exit 0, no output)
- No tRPC/trpc/HydrateClient references in agreements directory
- No mock data (Northline/Boreal/Ridge Finance/PAY-40) in agreements directory
- No `@/` imports in page file
- `"use client"` directive present
- `useAgreements` imported and used
- `skeleton.tsx` exists with `~/` alias imports

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bun run build` | 0 | ✅ pass | 10.7s |
| 2 | `bun run typecheck` | 0 | ✅ pass | 2.7s |
| 3 | `grep -r "tRPC\|trpc\|HydrateClient" agreements/` | 1 | ✅ pass (no matches) | <1s |
| 4 | `grep -r "Northline\|Boreal\|Ridge Finance\|PAY-40" agreements/` | 1 | ✅ pass (no matches) | <1s |
| 5 | `grep -r "@/" page.tsx` | 1 | ✅ pass (no matches) | <1s |
| 6 | `grep "use client" page.tsx` | 0 | ✅ pass | <1s |
| 7 | `grep "useAgreements" page.tsx` | 0 | ✅ pass | <1s |
| 8 | `test -f skeleton.tsx` | 0 | ✅ pass | <1s |

## Diagnostics

- **React Query DevTools:** query key `["agreements", <pubkey>]` shows cache state, fetch timing, errors
- **Error state:** RPC failures render with `error.message` in destructive text — visible without console
- **Wallet state:** Disconnected renders connect prompt; connected with no data renders empty message
- **Status mapping:** STATUS_CONFIG object at top of file maps all four enum variants to Badge variants

## Deviations

None.

## Known Issues

- Pre-existing ESLint warning in `lib/pda.ts` (consistent-type-imports) — from T01, not in scope for this task
- Action buttons ("Add condition", "Create payment") are disabled placeholders — M002 scope per plan

## Files Created/Modified

- `app/web/src/components/ui/skeleton.tsx` — shadcn Skeleton component (added via CLI)
- `app/web/src/app/(console)/agreements/page.tsx` — fully rewritten with live data, shadcn components, four UI states
- `.gsd/milestones/M001/slices/S03/tasks/T02-PLAN.md` — added Observability Impact section (pre-flight fix)
