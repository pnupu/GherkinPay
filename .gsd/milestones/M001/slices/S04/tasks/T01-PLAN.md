---
estimated_steps: 5
estimated_files: 1
---

# T01: Build useMilestones query hook

**Slice:** S04 — Milestones — Live Reads
**Milestone:** M001

## Description

Create the `useMilestones()` React Query hook that fetches all `conditionAccount` accounts from devnet and joins them to parent agreement data. This follows the exact same pattern established in `lib/queries/agreements.ts` (S03). The hook is the data layer for the milestones page.

The `conditionAccount` on-chain struct has these fields: `payment` (PublicKey back-ref to parent), `milestoneIndex` (u8), `amount` (u64, USDC 6 decimals), `milestoneStatus` (enum: pending/active/released), `operator` (enum: and/or), `conditions` (vec of condition variants), `isFinalized` (bool), `bump` (u8).

## Steps

1. Read `app/web/src/lib/queries/agreements.ts` to see the exact hook pattern, `Program<GherkinPay>` cast, query key convention, and imports.
2. Create `app/web/src/lib/queries/milestones.ts`:
   - Import `useQuery` from `@tanstack/react-query`, `useWallet` from `@solana/wallet-adapter-react`, `useAnchorProgram` from `~/lib/anchor`, `useAgreements` from `~/lib/queries/agreements`, and the `GherkinPay` IDL type from the types file.
   - Import `Program` from `@coral-xyz/anchor` and cast to `Program<GherkinPay>` (same D008 pattern as agreements.ts).
   - Export a `useMilestones()` hook that:
     - Gets `program` from `useAnchorProgram()` and `publicKey` from `useWallet()`
     - Gets `agreements` from `useAgreements()` (for parent payment context)
     - Calls `useQuery` with key `["milestones", publicKey?.toBase58()]`
     - `enabled: !!program && !!agreements`
     - Query fn: fetch `program.account.conditionAccount.all()` (no filter — client-side join is simpler at devnet scale)
     - Client-side join: for each condition account, find the matching agreement by comparing `account.payment.toBase58()` to agreement pubkeys
     - Return array of objects with condition account data + parent agreement context (paymentId or pubkey for display)
3. Ensure all imports use `~/` alias (not `@/`).
4. Ensure BN is imported from `@coral-xyz/anchor` if needed for amount fields.
5. Run `cd app/web && bun run build && bun run typecheck` to verify.

## Must-Haves

- [ ] `useMilestones()` exported from `lib/queries/milestones.ts`
- [ ] Uses `Program<GherkinPay>` cast (D008 pattern)
- [ ] Query enabled only when program and agreements are available
- [ ] Client-side join of conditionAccount to parent agreement data
- [ ] All imports use `~/` alias
- [ ] BN imported from `@coral-xyz/anchor`

## Verification

- `cd app/web && bun run build` exits 0
- `cd app/web && bun run typecheck` exits 0
- `rg "useMilestones" app/web/src/lib/queries/milestones.ts` shows the export
- `rg "@/" app/web/src/lib/queries/milestones.ts` returns no matches

## Inputs

- `app/web/src/lib/queries/agreements.ts` — pattern source: hook structure, Program cast, query key convention, useWallet/useAnchorProgram imports
- `app/web/src/lib/anchor.ts` — provides `useAnchorProgram()` hook
- `app/web/src/types/gherkin_pay.ts` — IDL types including `conditionAccount` fields and `milestoneStatus`/`conditionOperator` enums
- S03 established: query hooks live in `lib/queries/`, one file per domain; `Program<GherkinPay>` cast required at hook level (D008)

## Expected Output

- `app/web/src/lib/queries/milestones.ts` — new file exporting `useMilestones()` React Query hook that fetches conditionAccount data joined to parent agreements
