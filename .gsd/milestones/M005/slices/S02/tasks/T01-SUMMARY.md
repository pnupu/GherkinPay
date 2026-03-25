---
id: T01
parent: S02
milestone: M005
provides:
  - "Payment with Oracle Condition" describe block with 6 tests covering crank_oracle against mock Pyth feed
key_files:
  - tests/gherkin-pay.ts
key_decisions:
  - Used payment ID 7 and operator { lt: {} } with targetValue 20B to evaluate against mock price 15B
patterns_established:
  - Oracle test pattern: create payment → add oracle condition → finalize → fund → crankOracle(index, priceFeed) → evaluateAndRelease
observability_surfaces:
  - ConditionMet event emitted on successful crankOracle — includes payment pubkey, milestone_index, condition_index
  - ConditionAccount.conditions[0].oracle.met flips to true after crank
duration: ~15m
verification_result: passed
completed_at: 2026-03-23
blocker_discovered: false
---

# T01: Add oracle condition test with mock Pyth feed

**Added 6-test "Payment with Oracle Condition" describe block exercising crankOracle against mock Pyth feed fixture, validating full create→crank→release lifecycle with price 15B < target 20B.**

## What Happened

Appended a new `describe("Payment with Oracle Condition")` block to `tests/gherkin-pay.ts` with payment ID 7. The block creates a payment, adds an oracle condition targeting the mock Pyth feed at `JBc8woEgPzyXwLEmZJpnSiNhneGBcectQrQpzm52fvCj` with operator `{ lt: {} }` and `targetValue = new BN(20_000_000_000)`, finalizes, funds, cranks the oracle (which reads the mock feed's embedded price of 15B and evaluates 15B < 20B → true), then evaluates and releases funds. All 6 tests pass, confirming `crankOracle` works end-to-end for the first time.

Also added the `## Observability / Diagnostics` section and a failure-path verification check to `S02-PLAN.md` as required by pre-flight.

## Verification

- `anchor test` exits 0 with 26 passing (20 existing + 6 new oracle tests)
- All existing test blocks unaffected
- Oracle describe block visible: `grep -c "describe.*Oracle" tests/gherkin-pay.ts` → 1
- Condition met assertion verified: `conditions[0].oracle.met === true`
- Payment completed and funds released: `payment.status === { completed: {} }`, `releasedAmount === PAYMENT_AMOUNT`

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `anchor test` | 0 | ✅ pass | 42.6s |
| 2 | `grep -c "describe.*Oracle\|describe.*Token" tests/gherkin-pay.ts` | 0 | ✅ pass (returns 1, T02 will add second) | <1s |
| 3 | `anchor test 2>&1 \| grep -E "Oracle\|passing"` | 0 | ✅ pass (26 passing, Oracle block shown) | 38s |

## Diagnostics

- Fetch `ConditionAccount` at the oracle payment's condition PDA to inspect `conditions[0].oracle.met`
- On-chain `ConditionMet` event logged with condition_type "Oracle" during `crankOracle`
- If oracle crank fails: check for `OraclePriceStale` (publish_time too old or data too short), `OracleConfidenceTooWide` (confidence > price/20), or `ConditionTypeMismatch` (feed_id mismatch)

## Deviations

None — implementation followed the task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `tests/gherkin-pay.ts` — Added "Payment with Oracle Condition" describe block (~75 lines) with 6 tests
- `.gsd/milestones/M005/slices/S02/S02-PLAN.md` — Added Observability/Diagnostics section, failure-path verification check, marked T01 done
