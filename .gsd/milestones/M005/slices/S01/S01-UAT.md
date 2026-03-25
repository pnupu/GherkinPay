# S01: Contract Rebuild & Test Fixup — UAT

**Milestone:** M005
**Written:** 2026-03-23

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: This slice produces build artifacts (IDL, types, binaries) and passes an automated test suite — no UI or human interaction involved. All verification is command-output based.

## Preconditions

- Working directory is the M005 worktree with `node_modules` installed (`bun install` at repo root)
- Anchor CLI available (0.31.x)
- Solana CLI available with localnet validator support

## Smoke Test

Run `anchor test` — expect exit 0 with "20 passing" in output.

## Test Cases

### 1. Anchor build produces correct IDL

1. Run `anchor build`
2. **Expected:** Exit 0, no error lines in output
3. Run `grep -c metadata_uri target/idl/gherkin_pay.json`
4. **Expected:** Returns `4` (PaymentAgreement type, create_payment args, create_milestone_payment args, PaymentCreated event)
5. Run `jq '.types[] | select(.name=="PaymentAgreement") | .type.fields[] | select(.name=="metadata_uri")' target/idl/gherkin_pay.json`
6. **Expected:** Returns a JSON object with `"name": "metadata_uri"` and `"type": "string"`

### 2. TypeScript types include metadataUri

1. Run `grep -c metadataUri target/types/gherkin_pay.ts`
2. **Expected:** Returns `4` (camelCase conversion of the 4 IDL locations)
3. Run `test -f target/types/gherkin_pay.ts`
4. **Expected:** Exit 0 (file exists)

### 3. All test call sites pass metadata_uri

1. Run `rg "createPayment\(" tests/gherkin-pay.ts`
2. **Expected:** 5 lines, each with 4 arguments including a URI string as the last arg
3. Run `rg "createMilestonePayment\(" tests/gherkin-pay.ts`
4. **Expected:** 1 line with 4 arguments including a URI string as the last arg

### 4. Full test suite passes

1. Run `anchor test`
2. **Expected:** Exit 0
3. **Expected:** Output contains "20 passing"
4. **Expected:** All 6 describe blocks present:
   - "Simple Payment with Time-Based Condition" (6 tests)
   - "Payment with Multisig Condition" (4 tests)
   - "Payment with Webhook Condition" (1 test)
   - "Payment with OR Logic" (1 test)
   - "Cancellation" (1 test)
   - "Milestone Payment" (7 tests)

### 5. No build errors

1. Run `anchor build 2>&1 | grep -ci "error"`
2. **Expected:** Returns `0`

## Edge Cases

### Empty metadata_uri string

1. In tests, temporarily change one createPayment call to pass `""` instead of a URL
2. Run `anchor test`
3. **Expected:** The contract accepts empty strings (metadata_uri is not validated on-chain) — test should still pass

### Build from clean state

1. Run `rm -rf target/`
2. Run `anchor build`
3. **Expected:** Full rebuild succeeds, IDL and types regenerated with metadata_uri

## Failure Signals

- `anchor build` exits non-zero — Rust compilation or Anchor framework issue
- `grep -c metadata_uri target/idl/gherkin_pay.json` returns anything other than 4 — IDL generation regression
- `anchor test` shows any failing tests — test call signature mismatch or contract behavior change
- Test output shows fewer than 20 passing — missing test cases

## Not Proven By This UAT

- Oracle condition (crank_oracle) with mock Pyth feed — deferred to S02
- Token-gate condition (crank_token_gate) — deferred to S02
- Devnet deployment — deferred to S03
- Frontend IDL sync — deferred to S03
- End-to-end UI roundtrip with metadata_uri — deferred to S03

## Notes for Tester

- The `MODULE_TYPELESS_PACKAGE_JSON` Node warning is expected and harmless — ignore it
- The `AccountInfo::realloc` deprecation warning in hook program build output is pre-existing and non-blocking
- `anchor test` takes ~35-40s due to localnet validator startup and multiple on-chain transactions
