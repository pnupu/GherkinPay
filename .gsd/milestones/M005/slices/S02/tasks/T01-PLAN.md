---
estimated_steps: 5
estimated_files: 1
skills_used:
  - test
---

# T01: Add oracle condition test with mock Pyth feed

**Slice:** S02 — Oracle & Token-Gate Test Coverage
**Milestone:** M005

## Description

Add a `describe("Payment with Oracle Condition")` block to `tests/gherkin-pay.ts` that exercises the `crank_oracle` instruction against the mock Pyth feed fixture already loaded by Anchor.toml. This validates R023 — crank_oracle has never been tested on-chain despite existing since M003.

The mock Pyth feed at `JBc8woEgPzyXwLEmZJpnSiNhneGBcectQrQpzm52fvCj` contains:
- Feed ID = the pubkey itself (bytes 41–73)
- Price = `15_000_000_000` (i64 @ bytes 73–81)
- Confidence = `150_000_000` (u64 @ bytes 81–89)
- Exponent = `-8` (effective price $150.00)
- Publish time = `1893456000` (far future, staleness check always passes)

The on-chain validation checks: feed_id matches pubkey, staleness ≤ 60s (passes since publish_time is future), confidence ratio passes (150M ≤ 15B/20 = 750M).

Use operator `{ lt: {} }` with `targetValue = new BN(20_000_000_000)` so the condition evaluates `15B < 20B → true`.

## Steps

1. At the end of `tests/gherkin-pay.ts` (before the final `});`), add a new `describe("Payment with Oracle Condition")` block with `const paymentId = new BN(7)` and local PDA variables.
2. Add test `"Creates a payment for oracle test"` — call `createPayment(paymentId, PAYMENT_AMOUNT, { and: {} }, "https://example.com/travel-rule/test")` with the standard accounts (authority, payer, payee, mint, payment PDA, escrow PDA, condition PDA, TOKEN_2022_PROGRAM_ID). Assert status is `{ created: {} }`.
3. Add test `"Adds an oracle condition"` — call `addCondition` with `{ oracle: { feedAccount: new PublicKey("JBc8woEgPzyXwLEmZJpnSiNhneGBcectQrQpzm52fvCj"), operator: { lt: {} }, targetValue: new BN(20_000_000_000), decimals: 8, met: false } }`. Assert `condAccount.conditions.length === 1`.
4. Add tests for `"Finalizes conditions"` and `"Funds the payment"` — identical pattern to existing blocks (call `finalizeConditions`, then `fundPayment` with payer signer). Assert `isFinalized === true` and `status === { active: {} }`.
5. Add test `"Cranks the oracle condition"` — call `crankOracle(0)` with accounts `{ payment: paymentPDA, conditionAccount: conditionPDA, priceFeed: new PublicKey("JBc8woEgPzyXwLEmZJpnSiNhneGBcectQrQpzm52fvCj") }`. Fetch condition account and assert `conditions[0].oracle.met === true`.
6. Add test `"Evaluates and releases funds"` — call `evaluateAndRelease` with standard accounts. Assert `payment.status === { completed: {} }` and `releasedAmount === PAYMENT_AMOUNT`.

## Must-Haves

- [ ] Payment ID 7 (unique, no collision with existing IDs 1–6)
- [ ] Oracle condition uses feedAccount = `JBc8woEgPzyXwLEmZJpnSiNhneGBcectQrQpzm52fvCj`
- [ ] Operator is `{ lt: {} }` with targetValue `new BN(20_000_000_000)` — ensures 15B < 20B passes
- [ ] `crankOracle` call includes `priceFeed` account pointing to the mock fixture pubkey
- [ ] metadata_uri passed as last arg to createPayment (required since S01)
- [ ] All assertions pass: condition met, payment completed, funds released

## Verification

- `anchor test 2>&1 | grep -E "Oracle|passing"` — shows "Payment with Oracle Condition" block passing
- All 20 existing tests still pass alongside the new oracle tests

## Inputs

- `tests/gherkin-pay.ts` — existing test file with 20 tests across 6 describe blocks; append after last describe block
- `fixtures/mock-pyth-feed.json` — mock Pyth feed loaded by Anchor.toml; provides the price feed account data
- `programs/gherkin-pay/src/instructions/crank_oracle.rs` — reference for CrankOracle account structure (payment, conditionAccount, priceFeed)
- `programs/gherkin-pay/src/state/condition.rs` — reference for Oracle condition variant fields

## Expected Output

- `tests/gherkin-pay.ts` — modified with new "Payment with Oracle Condition" describe block (~60 lines appended)
