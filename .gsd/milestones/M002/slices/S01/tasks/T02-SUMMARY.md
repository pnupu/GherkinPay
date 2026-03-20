---
id: T02
parent: S01
milestone: M002
provides:
  - useCreatePayment() React Query mutation hook for on-chain simple + milestone payment creation
  - ConditionInput discriminated union type for all 5 condition variants
  - CreatePaymentInput / CreatePaymentResult typed interfaces
  - PDA derivation helpers (getPaymentPDA, getEscrowPDA, getConditionPDA)
  - useAnchorProgram() hook for typed Program<GherkinPay> access
  - IDL JSON and TypeScript types for gherkin_pay program
  - Program constants (PROGRAM_ID, SOLANA_RPC_URL)
key_files:
  - app/web/src/lib/mutations/create-payment.ts
  - app/web/src/lib/anchor.ts
  - app/web/src/lib/pda.ts
  - app/web/src/lib/constants.ts
  - app/web/src/types/gherkin_pay.ts
  - app/web/src/idl/gherkin_pay.json
key_decisions:
  - Used `as never` for Anchor v0.32 discriminated-union enum args and `accountsPartial()` for PDA-resolved accounts — Anchor v0.32 deep generic types reject Record<string, unknown> for enums
  - Created prerequisite M001 files (anchor.ts, pda.ts, constants.ts, IDL/types) in this task since they were not merged into the M002 branch
patterns_established:
  - Mutation hooks live in lib/mutations/ with one file per domain
  - Anchor condition enums passed as `{ variantName: { ...fields } } as never` to satisfy strict IDL generics
  - Payment IDs generated as BN(Date.now() * 1000 + random) for collision resistance
  - Each on-chain instruction sent as separate `.rpc()` call with sequential awaiting
  - Console logs prefixed with [GherkinPay] for observable transaction flow debugging
observability_surfaces:
  - "[GherkinPay] Creating simple/milestone payment:" logged with paymentId before first tx
  - Each instruction tx signature logged to console with [GherkinPay] prefix
  - "[GherkinPay] Payment creation failed:" logged to console.error on mutation error
  - React Query cache keys ["agreements"] and ["milestones"] invalidated on success
  - Mutation returns { paymentPDA, signatures } for downstream Explorer links
duration: 15m
verification_result: passed
completed_at: 2026-03-20T15:10:00+02:00
blocker_discovered: false
---

# T02: Create payment mutation hook

**Built useCreatePayment() mutation hook with full simple and milestone payment flows: PDA derivation, sequential multi-instruction submission, all 5 condition type mappings, and React Query cache invalidation.**

## What Happened

Created `useCreatePayment()` in `lib/mutations/create-payment.ts` — a React Query `useMutation` hook that handles the complete on-chain payment creation sequence. For simple payments: `createPayment` → `addCondition` ×N → `finalizeConditions`. For milestone payments: `createMilestonePayment` → per-milestone `addMilestone` → `addCondition` ×N → `finalizeConditions`. Each instruction is sent as a separate `.rpc()` call with sequential confirmation.

Also created the prerequisite infrastructure files that M001 slices documented but that weren't merged into the M002 branch: `lib/anchor.ts` (useAnchorProgram hook), `lib/pda.ts` (PDA derivation helpers), `lib/constants.ts` (PROGRAM_ID), and copied IDL JSON + TypeScript types from the build target. Installed `@coral-xyz/anchor`, `@solana/web3.js`, `@solana/wallet-adapter-react`, `@solana/wallet-adapter-base`, and `@solana/spl-token` as runtime dependencies.

The 5 condition types (TimeBased, Multisig, Oracle, Webhook, TokenGated) are mapped to Anchor instruction arguments via a discriminated union type `ConditionInput` and a `toAnchorCondition()` converter. Used `as never` assertions for Anchor v0.32's deep generic enum types and `accountsPartial()` instead of `accounts()` for PDA-resolved accounts.

## Verification

- `bun run typecheck` exits 0 — no type errors
- `bun run build` exits 0 — all pages compile successfully
- Instruction call signatures cross-checked against `tests/gherkin-pay.ts` ground truth: all account contexts and argument shapes match

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run typecheck` | 0 | ✅ pass | 3.0s |
| 2 | `cd app/web && bun run build` | 0 | ✅ pass | 12.4s |

## Diagnostics

- **Mutation flow:** Call `useCreatePayment()` in a component. The mutation accepts `CreatePaymentInput` and returns `{ paymentPDA, signatures }` on success. Open browser console and filter for `[GherkinPay]` to see each instruction's tx signature.
- **Error inspection:** On failure, `mutation.error` contains the full Anchor error. Console shows `[GherkinPay] Payment creation failed:` with the error object.
- **Cache invalidation:** After success, React Query keys `["agreements"]` and `["milestones"]` are invalidated — any `useQuery` with those keys auto-refetches.
- **PDA helpers:** Import from `~/lib/pda` — `getPaymentPDA(authority, paymentId)`, `getEscrowPDA(paymentPDA)`, `getConditionPDA(paymentPDA, milestoneIndex)`.
- **Anchor program:** `useAnchorProgram()` returns `{ program }` where program is `Program<GherkinPay> | null` (null when wallet disconnected).

## Deviations

- Created prerequisite files (anchor.ts, pda.ts, constants.ts, IDL types) that were supposed to be upstream M001 deliverables — they were never merged into the M002 branch. This is additional scope but necessary for the mutation hook to compile.
- Installed 5 Solana/Anchor npm packages not listed in the task plan — required runtime dependencies.

## Known Issues

- ESLint warnings about type-only imports were fixed (`import type` for PublicKey in create-payment.ts and BN in pda.ts).
- The IDL JSON and types are copied from the main repo's `target/` directory. If the program changes, these need to be regenerated with `anchor build` and re-copied.

## Files Created/Modified

- `app/web/src/lib/mutations/create-payment.ts` — useCreatePayment() mutation hook with simple + milestone payment flows
- `app/web/src/lib/anchor.ts` — useAnchorProgram() hook returning typed Program<GherkinPay>
- `app/web/src/lib/pda.ts` — PDA derivation helpers (getPaymentPDA, getEscrowPDA, getConditionPDA)
- `app/web/src/lib/constants.ts` — PROGRAM_ID and SOLANA_RPC_URL constants
- `app/web/src/types/gherkin_pay.ts` — TypeScript IDL type (copied from target/types/)
- `app/web/src/idl/gherkin_pay.json` — Anchor IDL JSON (copied from target/idl/)
- `app/web/package.json` — added @coral-xyz/anchor, @solana/web3.js, wallet-adapter-react, wallet-adapter-base, spl-token
- `.gsd/milestones/M002/slices/S01/tasks/T02-PLAN.md` — added Observability Impact section
