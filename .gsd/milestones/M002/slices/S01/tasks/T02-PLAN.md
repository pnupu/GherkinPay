---
estimated_steps: 8
estimated_files: 2
---

# T02: Create payment mutation hook

**Slice:** S01 — Create Payment Wizard
**Milestone:** M002

## Description

Build the `useCreatePayment()` React Query mutation hook that handles the full multi-instruction sequence for creating both simple and milestone payment agreements on-chain. This is the core business logic: PDA derivation, instruction building, sequential transaction submission, and cache invalidation.

## Steps

1. Create `app/web/src/lib/mutations/create-payment.ts`
2. Define the mutation payload type: `{ totalAmount: BN, payerWallet: PublicKey, payee: PublicKey, tokenMint: PublicKey, isMilestone: boolean, operator: 'and' | 'or', conditions: ConditionInput[], milestones?: { amount: BN, operator: 'and' | 'or', conditions: ConditionInput[] }[] }` where `ConditionInput` is a discriminated union matching the 5 Anchor condition variants
3. Implement payment ID generation: `new BN(Date.now() * 1000 + Math.floor(Math.random() * 1000))`
4. For simple payments: derive paymentPDA, escrowPDA, conditionPDA(milestone_index=0). Send `createPayment(paymentId, totalAmount, operator)` → for each condition send `addCondition(condition)` → send `finalizeConditions()`. Each as a separate transaction awaiting confirmation.
5. For milestone payments: send `createMilestonePayment(paymentId, totalAmount, milestoneCount)` → for each milestone send `addMilestone(index, amount, operator)` → for each milestone's conditions send `addCondition(condition)` targeting that milestone's conditionPDA → for each milestone send `finalizeConditions()`. Sequential transactions.
6. Use `useAnchorProgram()` for the program instance and `useWallet().sendTransaction` or `program.methods.X().rpc()` for signing
7. On success: invalidate `queryClient.invalidateQueries({ queryKey: ["agreements"] })` and `["milestones"]`
8. Return the mutation with `paymentPDA` and `signature` in the success data

## Must-Haves

- [ ] Handles both simple and milestone payment creation
- [ ] All 5 condition types correctly map to Anchor instruction arguments
- [ ] Sequential transaction submission with confirmation between each
- [ ] Cache invalidation on success
- [ ] Payment ID generation avoids collisions

## Verification

- `cd app/web && bun run typecheck` exits 0
- The hook's instruction calls match the exact account shapes from `tests/gherkin-pay.ts`

## Inputs

- `app/web/src/lib/anchor.ts` — `useAnchorProgram()` hook
- `app/web/src/lib/pda.ts` — `getPaymentPDA()`, `getEscrowPDA()`, `getConditionPDA()`
- `app/web/src/types/gherkin_pay.ts` — TypeScript types for instruction arguments
- `tests/gherkin-pay.ts` — ground truth for instruction call signatures and account contexts

## Expected Output

- `app/web/src/lib/mutations/create-payment.ts` — `useCreatePayment()` mutation hook with full simple + milestone flow
