# S02: Oracle & Token-Gate Test Coverage — UAT

**Milestone:** M005
**Written:** 2026-03-23

## UAT Type

- UAT mode: live-runtime
- Why this mode is sufficient: Both oracle and token-gate instructions execute on localnet validator via `anchor test` — this is real Solana runtime, not mocked

## Preconditions

- Anchor CLI 0.31+ installed (`anchor --version`)
- Solana CLI installed (`solana --version`)
- `bun install` completed in project root (worktree needs own node_modules)
- Mock Pyth feed fixture loaded via `Anchor.toml` test validator config

## Smoke Test

Run `anchor test` from project root — should exit 0 with "33 passing".

## Test Cases

### 1. Full suite passes with oracle and token-gate blocks

1. Run `anchor test`
2. **Expected:** Exit code 0, output shows "33 passing"

### 2. Oracle describe block exists and passes

1. Run `anchor test 2>&1 | grep -A8 "Payment with Oracle Condition"`
2. **Expected:** 6 checkmarks: creates payment, adds oracle condition, finalizes, funds, cranks oracle, evaluates and releases

### 3. Token-gate describe block exists and passes

1. Run `anchor test 2>&1 | grep -A9 "Payment with Token-Gate Condition"`
2. **Expected:** 7 checkmarks: creates gate mint, creates payment, adds token-gate condition, finalizes, funds, cranks token-gate, evaluates and releases

### 4. Both describe blocks present in source

1. Run `grep -c "describe.*Oracle\|describe.*Token" tests/gherkin-pay.ts`
2. **Expected:** Output is `2`

### 5. Assertion density is adequate

1. Run `grep -c 'assert\.\|\.met' tests/gherkin-pay.ts`
2. **Expected:** Output ≥ 100 (actual: 104)

### 6. Existing tests unaffected

1. Run `anchor test 2>&1 | grep -B1 "passing"`
2. **Expected:** No "failing" lines, total count = 33

### 7. Oracle condition met verification

1. In test output, find the "Cranks the oracle condition" test
2. **Expected:** Test passes — internally asserts `conditions[0].oracle.met === true` and payment completes with `{ completed: {} }` status

### 8. Token-gate condition met verification

1. In test output, find the "Cranks the token-gate condition" test
2. **Expected:** Test passes — internally asserts `conditions[0].tokenGated.met === true` and payment completes with `{ completed: {} }` status

## Edge Cases

### Oracle with stale feed

1. This is NOT tested in the current suite — the mock fixture has valid data
2. **Expected:** Would fail with `OraclePriceStale` error (documented in contract, not exercised)

### Token-gate with insufficient balance

1. This is NOT tested in the current suite — holder always has 1000 tokens vs 100 threshold
2. **Expected:** Would fail with `TokenBalanceInsufficient` error (documented in contract, not exercised)

## Failure Signals

- `anchor test` exits non-zero — test regression
- "failing" appears in test output — specific test broke
- Total passing < 33 — some tests were removed or skipped
- `grep -c "describe.*Oracle"` returns 0 — oracle block missing
- `grep -c "describe.*Token"` returns 0 — token-gate block missing

## Not Proven By This UAT

- Failure/rejection paths (stale oracle, insufficient token balance, wrong feed ID, wrong mint)
- Multi-condition payments combining oracle/token-gate with other condition types
- Oracle operators other than `lt` (gt, eq, gte, lte)
- Devnet deployment and live network behavior (deferred to S03)
- Frontend integration with oracle/token-gate conditions

## Notes for Tester

- The test suite takes ~42-47s due to localnet validator startup — this is normal
- Mock Pyth feed is loaded automatically by `Anchor.toml` test validator config — no manual setup needed
- Payment IDs 7 (oracle) and 8 (token-gate) were chosen to avoid collision with existing test payments (IDs 1-6)
