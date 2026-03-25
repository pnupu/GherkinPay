# S02: Oracle & Token-Gate Test Coverage

**Goal:** Two new test describe blocks prove `crank_oracle` with the mock Pyth feed and `crank_token_gate` with a gated mint — both pass in `anchor test`.
**Demo:** `anchor test` exits 0 with test count ≥ 28 (20 existing + ≥ 4 oracle + ≥ 4 token-gate).

## Must-Haves

- Oracle describe block: creates payment (ID=7), adds Oracle condition targeting mock Pyth feed, finalizes, funds, cranks with `crankOracle`, asserts condition met, evaluates and releases
- Token-gate describe block: creates payment (ID=8), creates a second Token-2022 "gate" mint, adds TokenGated condition, finalizes, funds, cranks with `crankTokenGate`, asserts condition met, evaluates and releases
- Both tests assert `payment.status === { completed: {} }` after evaluate-and-release
- All 20 existing tests continue to pass alongside the new ones

## Proof Level

- This slice proves: contract
- Real runtime required: yes (localnet validator via `anchor test`)
- Human/UAT required: no

## Verification

- `anchor test` exits 0 — full suite including new oracle and token-gate blocks
- `anchor test 2>&1 | grep -c "passing"` shows total ≥ 28
- `grep -c "describe.*Oracle\|describe.*Token" tests/gherkin-pay.ts` returns 2
- `grep -c "assert\.\|\.met" tests/gherkin-pay.ts` — confirms assertion density covers condition-met and status checks (diagnostic: failure paths produce descriptive Anchor errors like OraclePriceStale, ConditionTypeMismatch)

## Observability / Diagnostics

- **Runtime signals:** `ConditionMet` event emitted when `crankOracle` or `crankTokenGate` succeeds — includes payment pubkey, milestone_index, condition_index, and condition_type string. Can be observed via `anchor test` log output or on-chain event listeners.
- **Inspection surfaces:** Fetch `ConditionAccount` after crank to verify `conditions[i].oracle.met` or `conditions[i].tokenGated.met` flipped to `true`. Payment status transitions from `active` → `completed` after `evaluateAndRelease`.
- **Failure visibility:** Oracle crank fails with `OraclePriceStale` (stale publish_time or unparseable data), `OracleConfidenceTooWide` (confidence > price/20), or `ConditionTypeMismatch` (feed_id mismatch or wrong condition type at index). Token-gate crank fails with `TokenGateNotMet` if holder balance < min_amount. All are program-level errors with descriptive names.
- **Redaction:** No sensitive data in test accounts — all pubkeys and amounts are test fixtures.

## Integration Closure

- Upstream surfaces consumed: `target/types/gherkin_pay.ts` (generated types from S01), `fixtures/mock-pyth-feed.json` (loaded by Anchor.toml), test infrastructure from `tests/gherkin-pay.ts` (provider, mint, PDAs, Token-2022 setup)
- New wiring introduced in this slice: none — tests only
- What remains before the milestone is truly usable end-to-end: S03 (devnet deploy, frontend IDL sync, UI roundtrip)

## Tasks

- [x] **T01: Add oracle condition test with mock Pyth feed** `est:30m`
  - Why: Proves `crank_oracle` instruction works against the mock Pyth feed fixture (R023). This is the higher-risk item — the fixture's embedded price/feed_id/staleness data must match on-chain validation.
  - Files: `tests/gherkin-pay.ts`
  - Do: Add a new `describe("Payment with Oracle Condition")` block using payment ID 7. Create payment, add Oracle condition with `feedAccount = JBc8woEgPzyXwLEmZJpnSiNhneGBcectQrQpzm52fvCj`, operator `{ lt: {} }`, targetValue `new BN(20_000_000_000)`, decimals 8. Finalize, fund, crank with `crankOracle(0)` passing `priceFeed` account, assert condition met, evaluate and release, assert completed.
  - Verify: `anchor test 2>&1 | grep -E "Oracle|passing"`
  - Done when: Oracle describe block has ≥ 4 passing test cases and all 20 existing tests still pass

- [x] **T02: Add token-gate condition test with second mint** `est:30m`
  - Why: Proves `crank_token_gate` instruction works with a holder meeting the balance threshold (R024). Lower risk — follows identical pattern to existing tests but with a second mint.
  - Files: `tests/gherkin-pay.ts`
  - Do: Add a new `describe("Payment with Token-Gate Condition")` block using payment ID 8. Create a second Token-2022 mint ("gate mint"), create a holder token account owned by `payer`, mint ≥ 100 tokens to it. Create payment, add TokenGated condition with `requiredMint = gateMint`, `minAmount = new BN(100)`, `holder = payer.publicKey`. Finalize, fund, crank with `crankTokenGate(0)` passing `holderTokenAccount`, assert condition met, evaluate and release, assert completed.
  - Verify: `anchor test 2>&1 | grep -E "Token-Gate\|Token Gate\|passing"`
  - Done when: Token-gate describe block has ≥ 4 passing test cases and full suite passes with ≥ 28 tests

## Files Likely Touched

- `tests/gherkin-pay.ts`
