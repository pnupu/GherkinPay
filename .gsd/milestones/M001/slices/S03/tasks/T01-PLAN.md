---
estimated_steps: 5
estimated_files: 2
---

# T01: Create PDA helpers and agreements query hook

**Slice:** S03 — Agreements — Live Reads
**Milestone:** M001

## Description

Build the data layer for the Agreements page: a shared PDA derivation module and a React Query hook that fetches `paymentAgreement` accounts from devnet. These are pure logic modules with no UI — the page rewrite in T02 consumes them. The PDA helpers are also consumed by S04 for condition/milestone PDAs.

**Skill:** No special skill needed — standard TypeScript/Solana module work.

## Steps

1. Create `app/web/src/lib/pda.ts` with three PDA derivation functions:
   - `getPaymentPDA(authority: PublicKey, paymentId: BN): [PublicKey, number]` — seeds: `["payment", authority.toBuffer(), paymentId.toArrayLike(Buffer, "le", 8)]`, program: `PROGRAM_ID`
   - `getEscrowPDA(paymentPDA: PublicKey): [PublicKey, number]` — seeds: `["escrow", paymentPDA.toBuffer()]`, program: `PROGRAM_ID`
   - `getConditionPDA(paymentPDA: PublicKey, milestoneIndex: number): [PublicKey, number]` — seeds: `["conditions", paymentPDA.toBuffer(), Buffer.from([milestoneIndex])]`, program: `PROGRAM_ID`
   - Import `PublicKey` from `@solana/web3.js`, `BN` from `bn.js`, `PROGRAM_ID` from `~/lib/constants`
   - Use `PublicKey.findProgramAddressSync()` for all three
2. Create directory `app/web/src/lib/queries/` and file `agreements.ts`:
   - Import `useQuery` from `@tanstack/react-query`
   - Import `useWallet` from `@solana/wallet-adapter-react`
   - Import `useAnchorProgram` from `~/lib/anchor`
   - Export `useAgreements()` hook:
     - Get `{ program }` from `useAnchorProgram()` and `{ publicKey }` from `useWallet()`
     - Call `useQuery` with key `["agreements", publicKey?.toBase58() ?? "disconnected"]`
     - Set `enabled: !!program` — query is disabled when wallet disconnected
     - Query function: call `program!.account.paymentAgreement.all()` (no filter initially — add memcmp filter for authority at offset 16 using `publicKey` bytes if `publicKey` is available)
     - The memcmp filter: `{ memcmp: { offset: 16, bytes: publicKey!.toBase58() } }` — filters accounts where the `authority` field (offset 8 discriminator + 8 paymentId = 16) matches the connected wallet
     - Return the full `useQuery` result (data, isLoading, isError, error)
   - The return type from `program.account.paymentAgreement.all()` is an array of `{ publicKey: PublicKey, account: { paymentId: BN, authority: PublicKey, payer: PublicKey, payee: PublicKey, tokenMint: PublicKey, escrowTokenAccount: PublicKey, totalAmount: BN, releasedAmount: BN, status: object, isMilestone: boolean, milestoneCount: number, currentMilestone: number, createdAt: BN } }`
3. Verify imports use `~/` alias (not `@/`)
4. Run `cd app/web && bun run build` to verify compilation
5. Run `cd app/web && bun run typecheck` to verify types (must run after build)

## Must-Haves

- [ ] `pda.ts` exports `getPaymentPDA`, `getEscrowPDA`, `getConditionPDA`
- [ ] All PDA functions use `PublicKey.findProgramAddressSync` with correct seeds
- [ ] `useAgreements()` uses `useQuery` with `enabled: !!program`
- [ ] `useAgreements()` applies memcmp filter on authority field (offset 16) when publicKey available
- [ ] All imports use `~/` alias, not `@/`
- [ ] `bun run build` passes
- [ ] `bun run typecheck` passes (after build)

## Verification

- `bun run build` exits 0
- `bun run typecheck` exits 0
- `grep -r "@/" app/web/src/lib/pda.ts app/web/src/lib/queries/agreements.ts` returns no matches
- `grep "getPaymentPDA\|getEscrowPDA\|getConditionPDA" app/web/src/lib/pda.ts` shows all three exports
- `grep "useAgreements" app/web/src/lib/queries/agreements.ts` shows the export

## Inputs

- `app/web/src/lib/anchor.ts` — `useAnchorProgram()` hook returning `{ program: Program<GherkinPay> | null, hookProgram: Program<GherkinPayHook> | null }`
- `app/web/src/lib/constants.ts` — `PROGRAM_ID` (PublicKey) for PDA derivation
- `app/web/src/types/gherkin_pay.ts` — IDL type definitions; `paymentAgreement` account struct defines field order for memcmp offset calculation
- Account field order (from IDL): discriminator(8) → paymentId(u64, 8) → authority(pubkey, 32) at offset 16

## Expected Output

- `app/web/src/lib/pda.ts` — three PDA derivation functions for payment, escrow, and condition accounts
- `app/web/src/lib/queries/agreements.ts` — `useAgreements()` React Query hook returning typed paymentAgreement accounts with loading/error state
