# S03: Agreements — Live Reads

**Goal:** Replace the hardcoded mock array on the Agreements page with live on-chain reads of `paymentAgreement` accounts from devnet, using React Query for caching/loading/error state and shadcn components for display.
**Demo:** With a wallet connected on devnet, the Agreements page fetches real `paymentAgreement` accounts and displays them in a shadcn Table with status Badges. Without a wallet, it shows a connect prompt. With no matching accounts, it shows an empty state. Zero hardcoded arrays remain.

## Must-Haves

- PDA derivation helpers (`getPaymentPDA`, `getEscrowPDA`, `getConditionPDA`) in a shared `lib/pda.ts` module
- `useAgreements()` React Query hook wrapping `program.account.paymentAgreement.all()` with wallet authority filter
- Agreements page fully rewritten as client component using shadcn Table + Badge
- Three UI states: wallet disconnected, loading, empty/populated results
- All BN fields properly converted for display (amounts / 10^6 for USDC, timestamps to dates)
- Anchor enum variants handled via `Object.keys(status)[0]` pattern
- Zero tRPC imports remaining in the agreements page
- Zero hardcoded mock arrays

## Proof Level

- This slice proves: integration
- Real runtime required: yes (devnet RPC for account fetching)
- Human/UAT required: yes (wallet connect + visual inspection of live data)

## Verification

- `bun run build` passes with no errors (from `app/web/`)
- `bun run typecheck` passes (after build)
- `grep -r "tRPC\|trpc\|HydrateClient" app/web/src/app/\(console\)/agreements/` returns no matches
- `grep -r "Northline\|Boreal\|Ridge Finance\|PAY-40" app/web/src/app/\(console\)/agreements/` returns no matches (no hardcoded mock data)
- No `@/` imports in any new or modified file
- `lib/pda.ts` exports `getPaymentPDA`, `getEscrowPDA`, `getConditionPDA`
- `lib/queries/agreements.ts` exports `useAgreements`

## Observability / Diagnostics

- Runtime signals: React Query exposes `isLoading`, `isError`, `error` states from `useAgreements()` — visible in React DevTools query cache
- Inspection surfaces: browser console — Anchor RPC calls logged by `@solana/web3.js`; React Query DevTools (if enabled) shows query key `["agreements", walletPubkey]`
- Failure visibility: RPC errors surface as error state in the UI with the error message displayed; null program (disconnected wallet) disables the query entirely
- Redaction constraints: none — pubkeys are public data

## Integration Closure

- Upstream surfaces consumed: `useAnchorProgram()` from `~/lib/anchor`, `useWallet()` from `@solana/wallet-adapter-react`, `PROGRAM_ID` from `~/lib/constants`, shadcn Table/Badge from `~/components/ui/`
- New wiring introduced: `lib/pda.ts` (shared PDA utility), `lib/queries/agreements.ts` (React Query hook), rewritten agreements page
- What remains before the milestone is truly usable end-to-end: S04 (milestones page), S05 (compliance page), S06 (activity feed)

## Tasks

- [x] **T01: Create PDA helpers and agreements query hook** `est:25m`
  - Why: The data layer must exist before the page can consume it. PDA helpers are shared with S04. The React Query hook wraps Anchor's account fetch with proper caching, wallet-aware filtering, and typed returns.
  - Files: `app/web/src/lib/pda.ts`, `app/web/src/lib/queries/agreements.ts`
  - Do: Create `pda.ts` with `getPaymentPDA`, `getEscrowPDA`, `getConditionPDA` using seeds from the Anchor program. Create `queries/agreements.ts` with `useAgreements()` hook that uses `useAnchorProgram()` + `useWallet()`, calls `program.account.paymentAgreement.all()` with optional memcmp filter on the authority field (offset 16), and returns typed results. Query is disabled when program is null. Use `~/` import alias throughout.
  - Verify: `bun run build` passes; `bun run typecheck` passes; both files export the expected functions
  - Done when: `lib/pda.ts` and `lib/queries/agreements.ts` exist, export correct functions, and build passes with no type errors

- [x] **T02: Rewrite agreements page with live data and shadcn components** `est:35m`
  - Why: The page is the user-facing deliverable — it must show real on-chain data using the hook from T01, replacing all hardcoded mocks and tRPC scaffolding.
  - Files: `app/web/src/app/(console)/agreements/page.tsx`, shadcn Skeleton component (add via CLI)
  - Do: Add shadcn Skeleton component (`bunx --bun shadcn@canary add skeleton`). Rewrite the agreements page: thin server component shell or `"use client"` page rendering an `AgreementsTable` client component. The table uses `useAgreements()`, displays columns for ID, counterparty (truncated pubkey), type (milestone/simple), amount (BN→USDC), status (Badge with variant mapping), and date. Handle three states: disconnected wallet (prompt to connect), loading (Skeleton rows), empty results (informational message). Remove all tRPC imports, HydrateClient, and the hardcoded `agreements` array. Use shadcn Table, Badge, Skeleton components. Map status enum variants: `created`→outline, `active`→default, `completed`→secondary, `cancelled`→destructive.
  - Verify: `bun run build` passes; no tRPC/mock imports remain; page handles disconnected/loading/empty/populated states
  - Done when: Agreements page is fully rewritten with live data, shadcn components, proper state handling, zero hardcoded arrays, zero tRPC imports, and `bun run build` passes clean

## Files Likely Touched

- `app/web/src/lib/pda.ts` (new)
- `app/web/src/lib/queries/agreements.ts` (new)
- `app/web/src/app/(console)/agreements/page.tsx` (rewrite)
- `app/web/src/components/ui/skeleton.tsx` (new — added via shadcn CLI)
