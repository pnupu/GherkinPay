---
estimated_steps: 5
estimated_files: 2
---

# T01: Wire signMultisig mutation and multisig approval UI into condition card

**Slice:** S02 — Permissioned Actions
**Milestone:** M003

## Description

Create the `useSignMultisig()` mutation hook and replace the placeholder text in the multisig branch of `CrankAction` with an interactive approval UI gated on the connected wallet's identity. This delivers R014 (Multisig Signing).

The mutation hook follows the exact pattern established by `crank-time.ts` in S01: eslint-disable header, `(program.methods as any).signMultisig()`, `queryClient.invalidateQueries` on success, `decodeAnchorError` on error, `[GherkinPay]` console logs.

The UI must check if the connected wallet is one of the signers in `MultisigData.signers[]` using `PublicKey.equals()` (NOT string comparison — see KNOWLEDGE.md). It shows per-signer approval status and an "Approve" button only when the connected wallet is a signer who hasn't yet approved.

## Steps

1. Create `app/web/src/lib/mutations/sign-multisig.ts`:
   - Export `useSignMultisig()` hook using `useMutation` from `@tanstack/react-query`
   - Params interface: `{ paymentPubkey: PublicKey, conditionAccountPubkey: PublicKey, conditionIndex: number }`
   - Call `(program.methods as any).signMultisig(conditionIndex).accounts({ payment: paymentPubkey, conditionAccount: conditionAccountPubkey, signer: program.provider.publicKey }).rpc()`
   - The `signer` account is the connected wallet — Anchor's provider signs automatically
   - On success: invalidate `["conditions", paymentPubkey.toBase58()]`
   - On error: `decodeAnchorError` and console.error with `[GherkinPay]` prefix
   - Include the standard eslint-disable header for Anchor untyped accessors

2. In `condition-card.tsx`, add `import { useWallet } from "@solana/wallet-adapter-react"` and `import { useSignMultisig } from "~/lib/mutations/sign-multisig"`

3. In `CrankAction`, instantiate `useSignMultisig()` alongside existing crank hooks and get `const { publicKey: walletPubkey } = useWallet()`

4. Replace the multisig placeholder span in CrankAction with a `MultisigAction` inline component that:
   - If wallet disconnected (`!walletPubkey`): show "Connect wallet to approve"
   - Find signer index: `data.signers.findIndex(s => new PublicKey(s).equals(walletPubkey))`
   - If not a signer (index === -1): show "Not a signer for this condition"
   - If already approved (`data.approvals[signerIndex]`): show "You already approved ✓"
   - Otherwise: show "Approve" button that calls `signMultisig.mutate()`
   - Always show per-signer approval list: each signer as truncated pubkey with ✓ (approved) or ○ (pending) badge
   - Add TransactionStatus feedback for the signMultisig mutation

5. Verify: `cd app/web && bun run build` exits 0

## Must-Haves

- [ ] `useSignMultisig()` exported from `sign-multisig.ts` with correct Anchor method call and account wiring
- [ ] Wallet identity check uses `PublicKey.equals()` not string comparison
- [ ] "Approve" button only visible for connected signers who haven't approved
- [ ] Per-signer approval status list with visual indicators
- [ ] Disconnected wallet shows "Connect wallet" message
- [ ] TransactionStatus feedback wired to signMultisig mutation
- [ ] `bun run build` passes with zero type errors

## Verification

- `cd app/web && bun run build` exits 0
- `test -f app/web/src/lib/mutations/sign-multisig.ts`
- `grep -q "useSignMultisig" app/web/src/components/condition-card.tsx`
- `grep -q "Approve" app/web/src/components/condition-card.tsx`
- `grep -q "useWallet" app/web/src/components/condition-card.tsx`
- `grep -q "\.equals(" app/web/src/components/condition-card.tsx`

## Inputs

- `app/web/src/lib/mutations/crank-time.ts` — mutation hook pattern to follow exactly
- `app/web/src/components/condition-card.tsx` — CrankAction component to extend (multisig branch currently shows placeholder "Requires signer approvals")
- `app/web/src/lib/queries/conditions.ts` — MultisigData type (signers: string[], threshold: number, approvals: boolean[], met: boolean)
- `app/web/src/lib/errors.ts` — decodeAnchorError (already handles codes 6005 SignerNotInList, 6006 AlreadyApproved)
- `app/web/src/lib/anchor.ts` — useAnchorProgram() hook

## Expected Output

- `app/web/src/lib/mutations/sign-multisig.ts` — new mutation hook file
- `app/web/src/components/condition-card.tsx` — modified with multisig approval UI, useWallet import, useSignMultisig import
