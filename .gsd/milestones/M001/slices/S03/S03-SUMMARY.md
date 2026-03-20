---
id: S03
parent: M001
milestone: M001
provides:
  - PDA derivation helpers (getPaymentPDA, getEscrowPDA, getConditionPDA) shared across slices
  - useAgreements() React Query hook for live paymentAgreement account fetching
  - Agreements page fully rewritten with live on-chain data and four UI states
  - shadcn Skeleton component added to component library
requires:
  - slice: S02
    provides: useAnchorProgram() hook, useWallet(), PROGRAM_ID constant, wallet connect infrastructure
  - slice: S01
    provides: shadcn Table, Badge components, cn() utility
affects:
  - S04
key_files:
  - app/web/src/lib/pda.ts
  - app/web/src/lib/queries/agreements.ts
  - app/web/src/app/(console)/agreements/page.tsx
  - app/web/src/components/ui/skeleton.tsx
key_decisions:
  - Cast Program<Idl> to Program<GherkinPay> at query hook level because Anchor 0.32 constructor infers Idl generic regardless of IDL object type
  - Used "use client" directly on page rather than server shell + client sub-component — page has no server data needs after tRPC removal
  - Import BN from @coral-xyz/anchor to avoid separate @types/bn.js dependency
patterns_established:
  - Query hooks live in lib/queries/ with one file per domain (agreements.ts, milestones.ts, etc.)
  - PDA derivation centralized in lib/pda.ts, shared across slices
  - Status enum extraction via Object.keys(account.status)[0] with STATUS_CONFIG lookup map for Badge variant mapping
  - BN amount formatting via Intl.NumberFormat after dividing by 1e6 (USDC decimals)
  - Pubkey truncation as first4…last4 for counterparty display
  - Wallet-aware queries: enabled only when program is non-null, memcmp filter on authority at offset 16
observability_surfaces:
  - React Query cache key ["agreements", walletPubkey] — visible in React Query DevTools
  - useAgreements exposes isLoading, isError, error for UI rendering
  - RPC errors rendered in UI with error.message — no silent failures
  - Wallet disconnected state renders connect prompt (query disabled entirely)
drill_down_paths:
  - .gsd/milestones/M001/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S03/tasks/T02-SUMMARY.md
duration: 24m
verification_result: passed
completed_at: 2026-03-19
---

# S03: Agreements — Live Reads

**Agreements page fetches and displays real PaymentAgreement accounts from devnet via React Query, with status badges, wallet-aware filtering, and four UI states (disconnected/loading/empty/populated) — zero hardcoded arrays, zero tRPC imports remain**

## What Happened

T01 built the data layer: `lib/pda.ts` with three PDA derivation helpers matching the Anchor program's seed layout (payment, escrow, condition), and `lib/queries/agreements.ts` with a `useAgreements()` React Query hook. The hook wraps `program.account.paymentAgreement.all()` with a memcmp filter at offset 16 (authority field) for wallet-scoped results. Query is disabled when no wallet is connected.

Hit the Anchor 0.32 type inference issue — `Program` constructor takes `idl: any`, so the generic defaults to `Idl` and `program.account.paymentAgreement` doesn't exist on the type. Fixed by casting to `Program<GherkinPay>` in the hook.

T02 rewrote the agreements page as a `"use client"` component consuming `useAgreements()`. Removed all tRPC imports, the `HydrateClient` wrapper, and the hardcoded mock array. The page renders four states: wallet disconnected (connect prompt), loading (skeleton rows via shadcn Skeleton), error (destructive message with `error.message`), and populated (shadcn Table with columns for ID, counterparty, type, amount, status badge, date). Empty results show an informational message inside the table. Status enum variants map to Badge variants via a `STATUS_CONFIG` lookup.

## Verification

- `bun run build` — passes (exit 0)
- `bun run typecheck` — passes (exit 0)
- No `tRPC`/`trpc`/`HydrateClient` references in agreements directory
- No mock data strings (`Northline`, `Boreal`, `Ridge Finance`, `PAY-40`) in agreements directory
- No `@/` imports in any new or modified file
- `lib/pda.ts` exports all three PDA functions
- `lib/queries/agreements.ts` exports `useAgreements`
- `skeleton.tsx` exists with correct `~/` alias imports

## Requirements Advanced

- R002 — Agreements page now fetches real PaymentAgreement accounts from devnet with loading/empty/populated states. Infrastructure complete; awaiting human UAT with connected wallet on devnet to fully validate.
- R006 — S03 adopts shadcn Table, Badge, and Skeleton on the agreements page, advancing component adoption.

## Requirements Validated

- none — R002 requires human UAT (connect wallet on devnet, see real data) to move to validated

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- T01: Added `Program<GherkinPay>` cast in query hook — not in the plan, but required due to Anchor 0.32 constructor typing. Minimal change, already documented in KNOWLEDGE.md.
- T01: Imported BN from `@coral-xyz/anchor` instead of `bn.js` — avoids needing `@types/bn.js`.

## Known Limitations

- Action buttons ("Add condition", "Create payment") are disabled placeholders — M002 scope.
- Pre-existing ESLint warning in `lib/pda.ts` (consistent-type-imports) — cosmetic, not blocking.
- Runtime validation of live data requires a connected Phantom/Solflare wallet with devnet agreements — no accounts on a fresh wallet means only the empty state is testable without seeding data.

## Follow-ups

- none

## Files Created/Modified

- `app/web/src/lib/pda.ts` — new: PDA derivation for payment, escrow, and condition accounts
- `app/web/src/lib/queries/agreements.ts` — new: useAgreements React Query hook with wallet-aware filtering
- `app/web/src/app/(console)/agreements/page.tsx` — fully rewritten with live data, shadcn components, four UI states
- `app/web/src/components/ui/skeleton.tsx` — new: shadcn Skeleton component (added via CLI)

## Forward Intelligence

### What the next slice should know
- `useAgreements()` returns the full `paymentAgreement` account array with pubkeys — S04 needs these pubkeys as input to derive condition PDAs for milestones.
- The `Program<GherkinPay>` cast pattern from `useAnchorProgram()` is required in every query hook — copy the pattern from `agreements.ts`.
- PDA helpers in `lib/pda.ts` already include `getConditionPDA` — S04 can import it directly.

### What's fragile
- The memcmp filter offset (16) for the authority field assumes the current account layout — if the Anchor program's `PaymentAgreement` struct changes field order, the offset breaks silently (returns wrong or no results).
- `Object.keys(status)[0]` for enum extraction works with Anchor's serialization format but isn't type-safe — if a new status variant is added to the program, the STATUS_CONFIG lookup returns undefined and falls back silently.

### Authoritative diagnostics
- React Query DevTools — query key `["agreements", <pubkey>]` shows fetch timing, cache state, and any RPC errors. This is the first place to look if the page shows loading indefinitely or shows stale data.
- Browser console — `@solana/web3.js` logs RPC calls; look for `getProgramAccounts` calls to confirm the query is firing.

### What assumptions changed
- Assumed the page might need a server component shell — turned out to be unnecessary since there are no server data needs after removing tRPC. Pure client component is simpler.
