---
estimated_steps: 5
estimated_files: 1
skills_used:
  - test
---

# T02: Add token-gate condition test with second mint

**Slice:** S02 — Oracle & Token-Gate Test Coverage
**Milestone:** M005

## Description

Add a `describe("Payment with Token-Gate Condition")` block to `tests/gherkin-pay.ts` that exercises the `crank_token_gate` instruction. This validates R024 — crank_token_gate has never been tested on-chain despite existing since M003.

This test creates a **second** Token-2022 mint (the "gate mint" — distinct from the payment/escrow mint), creates a holder token account owned by `payer`, mints tokens to it, then uses a TokenGated condition requiring the holder to have ≥ 100 tokens of the gate mint.

The `crankTokenGate` instruction validates: `holderTokenAccount.mint === required_mint`, `holderTokenAccount.owner === holder`, and `holderTokenAccount.amount >= min_amount`.

## Steps

1. At the end of `tests/gherkin-pay.ts` (after the Oracle describe block from T01, before the final `});`), add a new `describe("Payment with Token-Gate Condition")` block with `const paymentId = new BN(8)` and local variables for PDA, gate mint, and holder token account.
2. Add test `"Creates gate mint and holder token account"` — use `createMint` to create a second Token-2022 mint (6 decimals, authority as mint authority). Use `createAccount` to create a token account for `payer` on this gate mint. Use `mintTo` to mint 1000 tokens (1000 * 10^6) to the holder account. Assert the holder account has the expected balance.
3. Add test `"Creates a payment for token-gate test"` — call `createPayment(paymentId, PAYMENT_AMOUNT, { and: {} }, "https://example.com/travel-rule/test")`. Assert status is `{ created: {} }`.
4. Add test `"Adds a token-gate condition"` — call `addCondition` with `{ tokenGated: { requiredMint: gateMint, minAmount: new BN(100_000_000), holder: payer.publicKey, met: false } }`. Assert `condAccount.conditions.length === 1`. Note: minAmount uses raw units (100 tokens * 10^6 decimals = 100_000_000).
5. Add tests for `"Finalizes conditions"` and `"Funds the payment"` — identical pattern to all existing blocks.
6. Add test `"Cranks the token-gate condition"` — call `crankTokenGate(0)` with accounts `{ payment: paymentPDA, conditionAccount: conditionPDA, holderTokenAccount: holderTokenAccountPubkey }`. Fetch condition account and assert `conditions[0].tokenGated.met === true`.
7. Add test `"Evaluates and releases funds"` — call `evaluateAndRelease` with standard accounts. Assert `payment.status === { completed: {} }`.

## Must-Haves

- [ ] Payment ID 8 (unique, no collision with existing IDs 1–7)
- [ ] Gate mint is a **separate** Token-2022 mint from the payment mint
- [ ] Holder token account owned by `payer`, with ≥ 100 tokens of gate mint
- [ ] TokenGated condition has `requiredMint = gateMint`, `holder = payer.publicKey`
- [ ] `crankTokenGate` call includes `holderTokenAccount` pointing to payer's gate mint token account
- [ ] metadata_uri passed as last arg to createPayment
- [ ] All assertions pass: condition met, payment completed, funds released
- [ ] Full test suite passes ≥ 28 tests (20 existing + oracle + token-gate)

## Verification

- `anchor test` exits 0 with ≥ 28 passing tests
- `anchor test 2>&1 | grep -E "Token-Gate\|Token Gate\|passing"` — shows token-gate block passing
- `grep -c "describe.*Oracle\|describe.*Token" tests/gherkin-pay.ts` returns 2

## Inputs

- `tests/gherkin-pay.ts` — test file after T01 (now has oracle describe block appended)
- `programs/gherkin-pay/src/instructions/crank_token_gate.rs` — reference for CrankTokenGate account structure (payment, conditionAccount, holderTokenAccount)
- `programs/gherkin-pay/src/state/condition.rs` — reference for TokenGated condition variant fields (required_mint, min_amount, holder, met)

## Expected Output

- `tests/gherkin-pay.ts` — modified with new "Payment with Token-Gate Condition" describe block (~70 lines appended)

## Observability Impact

- **New signal:** `ConditionMet` event emitted with `condition_type: "TokenGated"` when `crankTokenGate` succeeds — observable in `anchor test` logs and on-chain event listeners.
- **Inspection:** Fetch `ConditionAccount` after crank to verify `conditions[0].tokenGated.met` flipped to `true`. Payment status transitions `active` → `completed` after `evaluateAndRelease`.
- **Failure visibility:** `TokenBalanceInsufficient` if holder balance < min_amount, `ConditionTypeMismatch` if mint or holder doesn't match. Both are descriptive program-level errors.
