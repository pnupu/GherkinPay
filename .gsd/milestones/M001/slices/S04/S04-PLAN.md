# S04: Milestones — Live Reads

**Goal:** Milestones page fetches real ConditionAccount data from devnet, joined to parent PaymentAgreement accounts, with milestone status, amounts, and conditions displayed live.
**Demo:** Navigate to Milestones page → see live on-chain condition accounts with status badges, amounts, parent agreement references, and condition counts. No hardcoded mock arrays remain.

## Must-Haves

- `useMilestones()` React Query hook that fetches all `conditionAccount` accounts and joins to parent agreement data
- Milestones page rewritten with four UI states: disconnected, loading, empty, populated
- shadcn Table/Badge/Skeleton components used throughout
- Zero hardcoded mock data in the milestones page
- Zero `tRPC`/`trpc`/`HydrateClient` references in milestones directory

## Verification

- `cd app/web && bun run build` exits 0
- `cd app/web && bun run typecheck` exits 0
- `rg "tRPC|trpc|HydrateClient" app/web/src/app/\(console\)/milestones/` returns no matches
- `rg "M-01|M-02|M-03|Northline|Boreal|PAY-40" app/web/src/app/\(console\)/milestones/` returns no matches (no mock data)
- `rg "useMilestones" app/web/src/lib/queries/milestones.ts` confirms export exists
- `rg "@/" app/web/src/lib/queries/milestones.ts app/web/src/app/\(console\)/milestones/page.tsx` returns no matches

## Observability / Diagnostics

- Runtime signals: React Query cache key `["milestones", walletPubkey]` — visible in React Query DevTools
- Inspection surfaces: `useMilestones()` exposes `isLoading`, `isError`, `error` for UI rendering; RPC errors rendered with `error.message`
- Failure visibility: Wallet disconnected state renders connect prompt; loading state shows skeleton rows; error state shows destructive message
- Redaction constraints: none

## Integration Closure

- Upstream surfaces consumed: `useAnchorProgram()` from `lib/anchor.ts`, `useAgreements()` from `lib/queries/agreements.ts`, `getConditionPDA()` from `lib/pda.ts`, shadcn Table/Badge/Skeleton from `components/ui/`
- New wiring introduced in this slice: `lib/queries/milestones.ts` query hook, milestones page consuming live data
- What remains before the milestone is truly usable end-to-end: S05 (Compliance/Relayers live reads), S06 (Activity event feed)

## Tasks

- [x] **T01: Build useMilestones query hook** `est:25m`
  - Why: Data layer must exist before the page can consume it. Fetches all conditionAccount accounts from devnet and joins them to parent agreement data for display context.
  - Files: `app/web/src/lib/queries/milestones.ts`
  - Do: Create `useMilestones()` hook following the `useAgreements()` pattern exactly. Fetch `conditionAccount.all()` with `Program<GherkinPay>` cast. Depend on `useAgreements()` data for parent payment context (paymentId, counterparty). Client-side join via `conditionAccount.payment` pubkey matching. Query enabled only when program is non-null and agreements are loaded. Query key `["milestones", walletPubkey]`. Import BN from `@coral-xyz/anchor`. Use `~/` alias for all imports.
  - Verify: `cd app/web && bun run build && bun run typecheck` both exit 0; `rg "useMilestones" app/web/src/lib/queries/milestones.ts` confirms export
  - Done when: `useMilestones()` exported, typechecks, and follows established query hook patterns

- [ ] **T02: Rewrite milestones page with live data** `est:30m`
  - Why: Replace hardcoded mock array with live consumption from `useMilestones()`. Completes the slice goal.
  - Files: `app/web/src/app/(console)/milestones/page.tsx`
  - Do: Rewrite as `"use client"` component consuming `useMilestones()`. Remove all tRPC imports, HydrateClient wrapper, and mock data. Four UI states: disconnected (connect prompt), loading (skeleton rows), empty (informational message), populated (shadcn Table). Columns: milestone index, parent agreement ID, amount (USDC formatted / 1e6), status badge (pending/active/released mapped via STATUS_CONFIG), condition count, operator (and/or), finalized flag. Status badge variants follow the same pattern as agreements page. Use shadcn Table, Badge, Skeleton. All imports use `~/` alias.
  - Verify: Full slice verification suite — build, typecheck, no mock data grep matches, no tRPC grep matches, no `@/` imports
  - Done when: Milestones page renders live on-chain data with four UI states; zero hardcoded mock arrays; all slice verification checks pass

## Files Likely Touched

- `app/web/src/lib/queries/milestones.ts` — new
- `app/web/src/app/(console)/milestones/page.tsx` — full rewrite
