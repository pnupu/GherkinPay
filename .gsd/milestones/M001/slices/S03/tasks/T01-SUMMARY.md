---
id: T01
parent: S03
milestone: M001
provides:
  - PDA derivation helpers (getPaymentPDA, getEscrowPDA, getConditionPDA)
  - useAgreements React Query hook for paymentAgreement account fetching
key_files:
  - app/web/src/lib/pda.ts
  - app/web/src/lib/queries/agreements.ts
key_decisions:
  - Cast program from Program<Idl> to Program<GherkinPay> in the query hook because anchor.ts constructor infers Idl (constructor takes `any`), not the specific IDL type
  - Import BN from @coral-xyz/anchor rather than bn.js directly to avoid needing @types/bn.js
patterns_established:
  - Query hooks live in lib/queries/ with one file per domain (agreements.ts, etc.)
  - PDA derivation is centralized in lib/pda.ts, shared across slices
observability_surfaces:
  - React Query key ["agreements", walletPubkey] — visible in React Query DevTools
  - useAgreements exposes isLoading, isError, error for downstream UI rendering
duration: 12m
verification_result: passed
completed_at: 2026-03-19T11:39Z
blocker_discovered: false
---

# T01: Create PDA helpers and agreements query hook

**Added PDA derivation module (payment/escrow/condition) and useAgreements React Query hook with wallet-aware memcmp filtering**

## What Happened

Created `lib/pda.ts` with three PDA derivation functions using `PublicKey.findProgramAddressSync` — each matches the Anchor program's seed layout. Created `lib/queries/agreements.ts` with `useAgreements()` hook that wraps `program.account.paymentAgreement.all()` in React Query, applying a memcmp filter at offset 16 (authority field) when a wallet is connected.

Hit a type error on first build: `Program<Idl>` doesn't know about `paymentAgreement` accounts. The root cause is that Anchor 0.32's `Program` constructor takes `idl: any`, so TypeScript infers the default generic `Idl` regardless of the cast on the IDL object. Fixed by casting `rawProgram as Program<GherkinPay>` in the hook with a comment explaining why.

## Verification

- `bun run build` — exits 0, no type errors
- `bun run typecheck` — exits 0
- `grep -r "@/" app/web/src/lib/pda.ts app/web/src/lib/queries/agreements.ts` — no matches (exit 1, correct)
- All three PDA functions exported from pda.ts
- `useAgreements` exported from queries/agreements.ts

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bun run build` | 0 | ✅ pass | 9.1s |
| 2 | `bun run typecheck` | 0 | ✅ pass | 2.6s |
| 3 | `grep -r "@/" app/web/src/lib/pda.ts app/web/src/lib/queries/agreements.ts` | 1 | ✅ pass (no matches) | <1s |
| 4 | `grep "getPaymentPDA\|getEscrowPDA\|getConditionPDA" app/web/src/lib/pda.ts` | 0 | ✅ pass | <1s |
| 5 | `grep "useAgreements" app/web/src/lib/queries/agreements.ts` | 0 | ✅ pass | <1s |

## Diagnostics

- **React Query DevTools:** query key `["agreements", <pubkey>]` shows cache state, fetch timing, error details
- **Runtime errors:** RPC failures propagate as `error` in the useQuery return — downstream components render error state
- **Disabled state:** When wallet disconnected, `enabled: false` prevents RPC calls entirely — no silent failures
- **Type verification:** `bun run typecheck` catches any IDL/account type mismatches at build time

## Deviations

- Added `Program<GherkinPay>` cast in the query hook — not in the plan, but required because anchor.ts returns `Program<Idl>` due to Anchor 0.32's constructor signature. This is the minimal fix without modifying anchor.ts.
- Imported `BN` from `@coral-xyz/anchor` instead of `bn.js` — avoids needing a separate `@types/bn.js` dependency.

## Known Issues

None.

## Files Created/Modified

- `app/web/src/lib/pda.ts` — new: PDA derivation for payment, escrow, and condition accounts
- `app/web/src/lib/queries/agreements.ts` — new: useAgreements React Query hook with wallet-aware filtering
- `.gsd/milestones/M001/slices/S03/tasks/T01-PLAN.md` — added Observability Impact section
