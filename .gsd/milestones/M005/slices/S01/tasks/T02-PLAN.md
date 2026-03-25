---
estimated_steps: 4
estimated_files: 1
skills_used: []
---

# T02: Thread metadata_uri into all test call sites and run test suite

**Slice:** S01 — Contract Rebuild & Test Fixup
**Milestone:** M005

## Description

The test file `tests/gherkin-pay.ts` has 6 call sites that use the old 3-argument signatures for `createPayment` and `createMilestonePayment`. The contract now requires `metadata_uri: String` as the last parameter on both instructions. Add a test URI string to all 6 calls and run `anchor test` to verify the full suite passes. This directly satisfies requirement R022.

## Steps

1. Open `tests/gherkin-pay.ts` and locate all 6 call sites:
   - Line 152: `.createPayment(paymentId, PAYMENT_AMOUNT, { and: {} })` — add `"https://example.com/travel-rule/test"` as 4th arg
   - Line 328: `.createPayment(paymentId, PAYMENT_AMOUNT, { and: {} })` — same
   - Line 479: `.createPayment(paymentId, PAYMENT_AMOUNT, { and: {} })` — same
   - Line 596: `.createPayment(paymentId, PAYMENT_AMOUNT, { or: {} })` — same
   - Line 720: `.createPayment(paymentId, PAYMENT_AMOUNT, { and: {} })` — same
   - Line 835: `.createMilestonePayment(paymentId, totalAmount, 2)` — add `"https://example.com/travel-rule/milestone"` as 4th arg
2. For `createPayment` calls, the signature is `(payment_id, total_amount, operator, metadata_uri)` — metadata_uri goes after the operator object.
3. For `createMilestonePayment`, the signature is `(payment_id, total_amount, milestone_count, metadata_uri)` — metadata_uri goes after the count `2`.
4. Run `anchor test` to execute all test suites on localnet. All 6 describe blocks must pass.
5. If any test fails, read the error output. Common issues: wrong argument position, missing comma. Fix and rerun.

## Must-Haves

- [ ] All 5 `createPayment` calls include metadata_uri as the 4th argument
- [ ] The 1 `createMilestonePayment` call includes metadata_uri as the 4th argument
- [ ] `anchor test` exits 0 with all describe blocks passing

## Verification

- `anchor test` exits 0
- `rg "createPayment\(" tests/gherkin-pay.ts` — all 5 lines show 4 arguments including a URI string
- `rg "createMilestonePayment\(" tests/gherkin-pay.ts` — the 1 line shows 4 arguments including a URI string

## Inputs

- `tests/gherkin-pay.ts` — test file with 6 call sites needing metadata_uri
- `target/types/gherkin_pay.ts` — generated types from T01 (imported by tests)
- `target/idl/gherkin_pay.json` — generated IDL from T01 (used by Anchor Program constructor)

## Expected Output

- `tests/gherkin-pay.ts` — updated with metadata_uri on all 6 call sites, all tests passing
