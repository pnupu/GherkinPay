---
estimated_steps: 5
estimated_files: 2
---

# T01: Fund payment mutation hook and ATA lookup

**Slice:** S02 — Fund Payment
**Milestone:** M002

## Description

Create the Token-2022 ATA lookup helper and the `useFundPayment()` mutation hook that handles the fund instruction — transferring USDC from payer's token account to escrow.

## Steps

1. Create `app/web/src/lib/token.ts` with `getUsdcAta(owner: PublicKey): PublicKey` using `getAssociatedTokenAddressSync(USDC_MINT, owner, false, TOKEN_2022_PROGRAM_ID)`. Export the USDC devnet mint constant.
2. Create `app/web/src/lib/mutations/fund-payment.ts` with `useFundPayment()` mutation hook
3. The mutation accepts `paymentPDA: PublicKey`. It fetches the PaymentAgreement account to get `tokenMint` and `payer`. Derives escrowPDA via `getEscrowPDA(paymentPDA)`, conditionPDA via `getConditionPDA(paymentPDA, 0)` (for simple) or `getConditionPDA(paymentPDA, currentMilestone)`. Looks up payer ATA via `getUsdcAta()`.
4. Calls `program.methods.fundPayment().accounts({ payer: wallet.publicKey, payment: paymentPDA, conditionAccount: conditionPDA, tokenMint, payerTokenAccount: payerAta, escrowTokenAccount: escrowPDA, tokenProgram: TOKEN_2022_PROGRAM_ID }).rpc()`
5. On success: invalidate `["agreements"]` query cache. Return signature.

## Must-Haves

- [ ] `getUsdcAta()` uses TOKEN_2022_PROGRAM_ID for ATA derivation
- [ ] Mutation correctly derives all account PDAs
- [ ] Cache invalidated on success

## Verification

- `cd app/web && bun run typecheck` exits 0
- Instruction accounts match `tests/gherkin-pay.ts` fundPayment call

## Inputs

- `app/web/src/lib/anchor.ts` — useAnchorProgram hook
- `app/web/src/lib/pda.ts` — PDA helpers
- `tests/gherkin-pay.ts` — fundPayment account context (ground truth)

## Expected Output

- `app/web/src/lib/token.ts` — USDC mint constant + getUsdcAta helper
- `app/web/src/lib/mutations/fund-payment.ts` — useFundPayment mutation hook
