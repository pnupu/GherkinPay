---
id: S02
parent: M005
milestone: M005
provides:
  - "Payment with Oracle Condition" describe block (6 tests) proving crankOracle against mock Pyth feed
  - "Payment with Token-Gate Condition" describe block (7 tests) proving crankTokenGate with second Token-2022 mint
  - Full anchor test suite at 33 passing (20 existing + 6 oracle + 7 token-gate)
requires:
  - slice: S01
    provides: Working anchor build with metadata_uri, test infrastructure (provider, mint, PDAs, Token-2022 setup)
affects:
  - S03
key_files:
  - tests/gherkin-pay.ts
key_decisions:
  - Oracle test uses payment ID 7, operator { lt: {} }, targetValue 20B against mock price 15B (15B < 20B → true)
  - Token-gate test uses payment ID 8, separate Token-2022 gate mint, minAmount 100M raw units (100 tokens at 6 decimals), holder minted 1000 tokens
patterns_established:
  - Oracle test pattern: create payment → add oracle condition (feedAccount, operator, targetValue, decimals) → finalize → fund → crankOracle(index, priceFeed) → evaluateAndRelease
  - Token-gate test pattern: create gate mint → create holder account → mintTo → create payment → add tokenGated condition (requiredMint, minAmount, holder) → finalize → fund → crankTokenGate(index, holderTokenAccount) → evaluateAndRelease
observability_surfaces:
  - ConditionMet event emitted on crankOracle with condition_type "Oracle"
  - ConditionMet event emitted on crankTokenGate with condition_type "TokenGated"
  - ConditionAccount.conditions[0].oracle.met and .tokenGated.met flip to true after respective cranks
drill_down_paths:
  - .gsd/milestones/M005/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M005/slices/S02/tasks/T02-SUMMARY.md
duration: ~23m
verification_result: passed
completed_at: 2026-03-23
---

# S02: Oracle & Token-Gate Test Coverage

**Two new test describe blocks (13 tests total) prove crankOracle and crankTokenGate instructions end-to-end on localnet, bringing the full suite to 33 passing tests.**

## What Happened

T01 added a 6-test "Payment with Oracle Condition" block. It creates payment ID 7 with an oracle condition targeting the mock Pyth feed at `JBc8woEgPzyXwLEmZJpnSiNhneGBcectQrQpzm52fvCj`, using `{ lt: {} }` operator with targetValue 20B. The mock feed contains price 15B, so 15B < 20B evaluates true. After crank, the condition flips to met and evaluateAndRelease completes the payment.

T02 added a 7-test "Payment with Token-Gate Condition" block. It creates a second Token-2022 mint ("gate mint"), mints 1000 tokens to a holder account owned by `payer`, then creates payment ID 8 with a `tokenGated` condition requiring ≥100 tokens. After crank, the holder's 1000-token balance exceeds the 100-token threshold, condition flips to met, and evaluateAndRelease completes the payment.

Both tasks completed without deviation — the contract instructions worked exactly as designed. The full suite now has 33 passing tests (target was ≥28).

## Verification

- `anchor test` exits 0 with 33 passing (20 existing + 6 oracle + 7 token-gate) — exceeds ≥28 target
- `grep -c "describe.*Oracle\|describe.*Token" tests/gherkin-pay.ts` → 2
- `grep -c "assert\.\|\.met" tests/gherkin-pay.ts` → 104 (strong assertion density)
- Both oracle and token-gate condition `.met` fields verified as `true` after crank
- Both payments reach `{ completed: {} }` status after evaluateAndRelease
- All 20 pre-existing tests continue to pass unaffected

## New Requirements Surfaced

- none

## Deviations

none

## Known Limitations

- Oracle test only covers the `lt` (less-than) operator path — other operators (gt, eq, gte, lte) are not exercised
- Token-gate test only covers the happy path where holder exceeds threshold — no test for insufficient balance rejection
- Both tests use a single condition per payment — AND/OR multi-condition combinations with oracle/token-gate are not tested

## Follow-ups

- none — S03 (devnet deploy, frontend IDL sync, UI roundtrip) is the natural next step

## Files Created/Modified

- `tests/gherkin-pay.ts` — Added "Payment with Oracle Condition" (~75 lines, 6 tests) and "Payment with Token-Gate Condition" (~170 lines, 7 tests) describe blocks
- `.gsd/milestones/M005/slices/S02/S02-PLAN.md` — Added Observability/Diagnostics section, marked tasks done

## Forward Intelligence

### What the next slice should know
- All instruction paths now have test coverage — S03 can deploy to devnet with confidence that create, fund, crank (time/multisig/webhook/oracle/token-gate), evaluate, release, and cancel all work
- The test suite takes ~42-47s to run due to localnet validator startup; `anchor test` is the single command to validate everything

### What's fragile
- Mock Pyth feed fixture at `JBc8woEgPzyXwLEmZJpnSiNhneGBcectQrQpzm52fvCj` — if the fixture account data changes or the feed address is reused with different data, oracle tests will break silently (price comparison would evaluate differently)

### Authoritative diagnostics
- `anchor test 2>&1 | grep -c "passing"` — single number showing total test count; if less than 33, something regressed
- `anchor test 2>&1 | grep "failing"` — shows which specific tests broke if any fail

### What assumptions changed
- Plan estimated ≥4 tests per block — actual was 6 (oracle) and 7 (token-gate), providing finer-grained lifecycle coverage
- Plan estimated ≥28 total — actual is 33, giving more headroom for S03 confidence
