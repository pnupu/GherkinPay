---
estimated_steps: 5
estimated_files: 1
---

# T02: Rewrite milestones page with live data

**Slice:** S04 — Milestones — Live Reads
**Milestone:** M001

## Description

Rewrite the milestones page to consume `useMilestones()` instead of hardcoded mock data. Remove all tRPC imports and HydrateClient wrapper. Implement four UI states (disconnected/loading/empty/populated) using shadcn Table, Badge, and Skeleton — same pattern as the agreements page rewritten in S03.

The page displays: milestone index, parent agreement ID (truncated pubkey), amount (USDC formatted via `/1e6`), status badge (pending/active/released), condition count, operator (and/or), and finalized flag.

## Steps

1. Read `app/web/src/app/(console)/agreements/page.tsx` to see the exact four-state UI pattern, STATUS_CONFIG map, amount formatting, pubkey truncation, skeleton rows, and shadcn component usage.
2. Read `app/web/src/app/(console)/milestones/page.tsx` to see the current mock data structure and any existing column layout to preserve.
3. Rewrite `milestones/page.tsx` as a `"use client"` component:
   - Import `useMilestones` from `~/lib/queries/milestones`
   - Import `useWallet` from `@solana/wallet-adapter-react`
   - Import shadcn: `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` from `~/components/ui/table`, `Badge` from `~/components/ui/badge`, `Skeleton` from `~/components/ui/skeleton`
   - Define a `MILESTONE_STATUS_CONFIG` map: `pending` → default/muted variant, `active` → warning/yellow variant, `released` → success/green variant (match the Badge variant names used in agreements page)
   - Four UI states:
     - **Disconnected** (`!publicKey`): connect wallet prompt
     - **Loading** (`isLoading`): skeleton rows (6-8 skeleton cells per row, 3 rows)
     - **Empty** (`data.length === 0`): informational message inside table
     - **Populated**: full table with columns
   - Table columns: Milestone (index display like "#1"), Agreement (truncated parent pubkey, first4…last4), Amount (USDC formatted with `Intl.NumberFormat`), Status (Badge with variant from config), Conditions (count), Operator (and/or), Finalized (yes/no or checkmark)
   - Amount formatting: `new BN(amount).toNumber() / 1e6` then `Intl.NumberFormat` — same as agreements page
   - Status enum extraction: `Object.keys(account.milestoneStatus)[0]` — same pattern as agreements
   - Remove ALL tRPC/trpc imports, HydrateClient wrapper, and mock data arrays
4. Ensure all imports use `~/` alias (not `@/`).
5. Run the full slice verification suite.

## Must-Haves

- [ ] Page is `"use client"` component
- [ ] Consumes `useMilestones()` hook — no hardcoded mock data
- [ ] Four UI states: disconnected, loading, empty, populated
- [ ] shadcn Table, Badge, Skeleton used throughout
- [ ] Status badges for pending/active/released milestone statuses
- [ ] Amount formatted as USDC (divide by 1e6)
- [ ] Zero tRPC/trpc/HydrateClient references
- [ ] Zero mock data strings
- [ ] All imports use `~/` alias

## Verification

- `cd app/web && bun run build` exits 0
- `cd app/web && bun run typecheck` exits 0
- `rg "tRPC|trpc|HydrateClient" app/web/src/app/\(console\)/milestones/` returns no matches
- `rg "M-01|M-02|M-03|Northline|Boreal|PAY-40" app/web/src/app/\(console\)/milestones/` returns no matches
- `rg "@/" app/web/src/app/\(console\)/milestones/page.tsx` returns no matches

## Inputs

- `app/web/src/lib/queries/milestones.ts` — T01 output: `useMilestones()` hook returning joined milestone data
- `app/web/src/app/(console)/agreements/page.tsx` — pattern source: four UI states, STATUS_CONFIG map, amount formatting, pubkey truncation, skeleton rows
- `app/web/src/app/(console)/milestones/page.tsx` — current page with mock data to be replaced
- S03 patterns: status enum extraction via `Object.keys(status)[0]`, BN amount formatting via `/1e6`, pubkey truncation as `first4…last4`

## Observability Impact

- **UI state signals:** Four explicit states (disconnected/loading/empty/populated) plus error state with `error.message` rendering — a future agent can verify which branch renders by checking wallet connection and query cache state.
- **React Query cache:** Key `["milestones", walletPubkey]` visible in React Query DevTools. Inspect `isLoading`, `isError`, `data.length` to diagnose rendering issues.
- **Failure visibility:** RPC errors surface in the destructive-styled error message block. Network failures visible in browser devtools Network tab for Solana RPC calls.

## Expected Output

- `app/web/src/app/(console)/milestones/page.tsx` — fully rewritten with live on-chain data, four UI states, shadcn components, zero mock data
