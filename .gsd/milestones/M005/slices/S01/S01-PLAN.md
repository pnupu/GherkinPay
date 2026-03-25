# S01: Contract Rebuild & Test Fixup

**Goal:** `anchor build` succeeds with updated IDL/types containing metadata_uri, and `anchor test` passes all existing test suites with metadata_uri threaded through every create call.
**Demo:** `anchor test` exits 0 with all 6 describe blocks passing.

## Must-Haves

- `anchor build` exits 0, generating `target/types/gherkin_pay.ts` and `target/idl/gherkin_pay.json`
- Generated IDL contains `metadata_uri` in PaymentAgreement type, create_payment args, create_milestone_payment args, and PaymentCreated event (4 occurrences)
- All 6 test call sites (5 × `createPayment`, 1 × `createMilestonePayment`) pass `metadata_uri` as the last argument
- `anchor test` exits 0 — all existing test suites pass

## Proof Level

- This slice proves: contract
- Real runtime required: yes (localnet validator via `anchor test`)
- Human/UAT required: no

## Verification

- `anchor build` exits 0
- `grep -c metadata_uri target/idl/gherkin_pay.json` returns 4
- `grep -c metadata_uri target/types/gherkin_pay.ts` returns ≥ 1
- `anchor test` exits 0
- `anchor build 2>&1 | grep -ci "error"` returns 0 (no compilation errors in build output)

## Tasks

- [x] **T01: Build contract and verify IDL generation** `est:20m`
  - Why: No build artifacts exist in this worktree — `anchor build` must succeed before tests can import generated types. This also retires the "Anchor build compatibility" risk.
  - Files: `target/types/gherkin_pay.ts`, `target/idl/gherkin_pay.json`
  - Do: Run `bun install` at repo root if needed, then `anchor build`. Verify both programs compile and IDL/types include `metadata_uri`. If build fails, debug and fix (likely version or dependency issues).
  - Verify: `anchor build` exits 0 && `grep -c metadata_uri target/idl/gherkin_pay.json` returns 4 && `test -f target/types/gherkin_pay.ts`
  - Done when: Build artifacts exist with metadata_uri in all expected locations

- [x] **T02: Thread metadata_uri into all test call sites and run test suite** `est:15m`
  - Why: The 6 test call sites still use the old 3-arg signatures — they must pass metadata_uri as the last argument to match the updated contract. This directly satisfies R022.
  - Files: `tests/gherkin-pay.ts`
  - Do: Add a metadata_uri string (e.g. `"https://example.com/travel-rule/test"`) as the 4th argument to all 5 `createPayment` calls and as the 4th argument to the 1 `createMilestonePayment` call. Then run `anchor test` to verify all suites pass.
  - Verify: `anchor test` exits 0 && `rg -c "createPayment.*metadata\|createMilestonePayment.*metadata" tests/gherkin-pay.ts` shows all 6 lines updated
  - Done when: `anchor test` exits 0 with all describe blocks passing

## Observability / Diagnostics

- **Build output:** `anchor build` emits compiler warnings/errors to stderr — capture and inspect on failure.
- **IDL inspection:** `cat target/idl/gherkin_pay.json | jq '.types[] | select(.name=="PaymentAgreement")' ` shows the generated type structure including metadata_uri.
- **Test runner output:** `anchor test` produces per-describe pass/fail counts; failures include assertion messages and stack traces.
- **Failure visibility:** Build failures surface as non-zero exit codes with Rust compiler diagnostics. Test failures include Mocha assertion diffs.
- **Diagnostic verification:** `anchor build 2>&1 | grep -i "error\|warning"` surfaces any compilation issues.

## Files Likely Touched

- `tests/gherkin-pay.ts`
- `target/types/gherkin_pay.ts` (generated)
- `target/idl/gherkin_pay.json` (generated)
