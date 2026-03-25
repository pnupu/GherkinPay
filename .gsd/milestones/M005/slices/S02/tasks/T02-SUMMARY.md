---
id: T02
parent: S02
milestone: M005
provides:
  - "Payment with Token-Gate Condition" describe block with 7 tests covering crank_token_gate with second Token-2022 mint
key_files:
  - tests/gherkin-pay.ts
key_decisions:
  - Used payment ID 8 with gate mint (separate Token-2022 mint), holder=payer, minAmount=100_000_000 (100 tokens * 10^6 decimals)
patterns_established:
  - Token-gate test pattern: create gate mint → create holder account → mintTo → create payment → add tokenGated condition → finalize → fund → crankTokenGate(index, holderTokenAccount) → evaluateAndRelease
observability_surfaces:
  - ConditionMet event emitted on successful crankTokenGate — includes payment pubkey, milestone_index, condition_index, condition_type "TokenGated"
  - ConditionAccount.conditions[0].tokenGated.met flips to true after crank
  - If token-gate crank fails: check for TokenBalanceInsufficient (balance < min_amount) or ConditionTypeMismatch (mint/holder mismatch)
duration: ~8m
verification_result: passed
completed_at: 2026-03-23
blocker_discovered: false
---

# T02: Add token-gate condition test with second mint

**Added 7-test "Payment with Token-Gate Condition" describe block exercising crankTokenGate with a separate Token-2022 gate mint, validating full create→crank→release lifecycle with 1000 tokens vs 100-token threshold.**

## What Happened

Appended a new `describe("Payment with Token-Gate Condition")` block to `tests/gherkin-pay.ts` with payment ID 8. The block creates a second Token-2022 mint ("gate mint"), creates a holder token account owned by `payer`, mints 1000 tokens (1B raw units at 6 decimals) to it, then creates a payment with a `tokenGated` condition requiring ≥100 tokens (100M raw units) of the gate mint. After finalize and fund, `crankTokenGate(0)` validates the holder's balance meets the threshold and marks the condition as met. EvaluateAndRelease then transitions payment to completed. All 7 tests pass.

Full suite now has 33 passing tests (20 existing + 6 oracle + 7 token-gate), exceeding the ≥28 target.

## Verification

- `anchor test` exits 0 with 33 passing tests (target was ≥28)
- Token-gate describe block visible and all 7 tests pass
- `grep -c "describe.*Oracle\|describe.*Token" tests/gherkin-pay.ts` → 2
- `grep -c "assert\.\|\.met" tests/gherkin-pay.ts` → 104 (strong assertion density)
- Condition met assertion verified: `conditions[0].tokenGated.met === true`
- Payment completed and funds released: `payment.status === { completed: {} }`, `releasedAmount === PAYMENT_AMOUNT`

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `anchor test` | 0 | ✅ pass | 47.2s |
| 2 | `grep -c "describe.*Oracle\|describe.*Token" tests/gherkin-pay.ts` | 0 | ✅ pass (returns 2) | <1s |
| 3 | `grep -c "assert\.\|\.met" tests/gherkin-pay.ts` | 0 | ✅ pass (returns 104) | <1s |
| 4 | `anchor test 2>&1 \| grep -c "passing"` | 0 | ✅ pass (33 passing) | 47s |

## Diagnostics

- Fetch `ConditionAccount` at the token-gate payment's condition PDA to inspect `conditions[0].tokenGated.met`
- On-chain `ConditionMet` event logged with condition_type "TokenGated" during `crankTokenGate`
- If token-gate crank fails: check for `TokenBalanceInsufficient` (holder balance < min_amount), `ConditionTypeMismatch` (mint or holder mismatch)
- Gate mint is a distinct Token-2022 mint from the payment escrow mint — verify with `getAccount` on holderTokenAccount

## Deviations

None — implementation followed the task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `tests/gherkin-pay.ts` — Added "Payment with Token-Gate Condition" describe block (~170 lines) with 7 tests
