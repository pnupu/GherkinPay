---
id: S01
parent: M005
milestone: M005
provides:
  - Compiled program binaries (gherkin_pay.so, gherkin_pay_hook.so) with metadata_uri support
  - Generated IDL with metadata_uri in 4 locations (target/idl/gherkin_pay.json)
  - Generated TypeScript types with metadataUri in 4 locations (target/types/gherkin_pay.ts)
  - All 20 existing tests passing with metadata_uri threaded through every create call
requires:
  - slice: none
    provides: first slice in M005
affects:
  - S02
  - S03
key_files:
  - tests/gherkin-pay.ts
  - target/idl/gherkin_pay.json
  - target/types/gherkin_pay.ts
  - target/deploy/gherkin_pay.so
  - target/deploy/gherkin_pay_hook.so
key_decisions:
  - none
patterns_established:
  - Anchor generates camelCase field names in TS types (metadataUri) vs snake_case in IDL (metadata_uri) — verify with appropriate casing per artifact
observability_surfaces:
  - "IDL inspection: jq '.types[] | select(.name==\"PaymentAgreement\")' target/idl/gherkin_pay.json"
  - "Build diagnostics: anchor build 2>&1 | grep -i error"
  - "Test runner: anchor test — 20 passing across 6 describe blocks"
drill_down_paths:
  - .gsd/milestones/M005/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M005/slices/S01/tasks/T02-SUMMARY.md
duration: ~5m
verification_result: passed
completed_at: 2026-03-23
---

# S01: Contract Rebuild & Test Fixup

**Anchor build succeeds with metadata_uri in IDL/types; all 20 tests pass with metadata_uri threaded through every create call**

## What Happened

T01 ran `bun install` (190 packages) then `anchor build`, compiling both `gherkin-pay` and `gherkin-pay-hook` programs. The build produced one non-blocking deprecation warning (`AccountInfo::realloc` → `resize()` in the hook program) but completed successfully. Generated IDL contains `metadata_uri` in exactly 4 locations: PaymentAgreement type, create_payment args, create_milestone_payment args, and PaymentCreated event. TypeScript types contain the camelCase equivalent `metadataUri` in 4 locations.

T02 added `"https://example.com/travel-rule/test"` as the 4th argument to all 5 `createPayment` calls and `"https://example.com/travel-rule/milestone"` to the 1 `createMilestonePayment` call in `tests/gherkin-pay.ts`. `anchor test` passed all 20 tests across all 6 describe blocks (35s).

## Verification

- `anchor build` exits 0 — both programs compiled ✅
- `grep -c metadata_uri target/idl/gherkin_pay.json` returns 4 ✅
- `grep -c metadataUri target/types/gherkin_pay.ts` returns 4 ✅
- `anchor build 2>&1 | grep -ci "error"` returns 0 (no compilation errors) ✅
- All 6 create call sites in tests have metadata_uri argument ✅
- `anchor test` exits 0 — 20 passing, 0 failing ✅

## New Requirements Surfaced

- none

## Deviations

None — execution matched the plan exactly. The only adaptation was using `metadataUri` (camelCase) when verifying TS types, which was already documented in KNOWLEDGE.md.

## Known Limitations

- `gherkin-pay-hook` emits a deprecation warning for `AccountInfo::realloc` — cosmetic, no functional impact
- Node emits `MODULE_TYPELESS_PACKAGE_JSON` warning suggesting `"type": "module"` in package.json — non-blocking

## Follow-ups

- none

## Files Created/Modified

- `tests/gherkin-pay.ts` — added metadata_uri as 4th argument to all 5 createPayment and 1 createMilestonePayment call sites
- `target/idl/gherkin_pay.json` — generated IDL with metadata_uri (4 occurrences)
- `target/types/gherkin_pay.ts` — generated TypeScript types with metadataUri (4 occurrences)
- `target/deploy/gherkin_pay.so` — compiled gherkin-pay program binary
- `target/deploy/gherkin_pay_hook.so` — compiled gherkin-pay-hook program binary

## Forward Intelligence

### What the next slice should know
- The test infrastructure is fully working: localnet validator spins up, Token-2022 mint is created, and all PDA derivations work. S02 can add new describe blocks for oracle and token-gate tests without any setup changes.
- The metadata_uri argument is always the last positional argument to createPayment and createMilestonePayment — any new test calls must include it.

### What's fragile
- The hook program's `AccountInfo::realloc` deprecation — if Anchor or Solana SDK bumps enforce this, the hook will need a `realloc` → `resize()` rename.

### Authoritative diagnostics
- `anchor test` output (20 passing, 6 describe blocks) — this is the single source of truth for test suite health. If S02 adds tests and the count doesn't increase, something was missed.
- `grep -c metadata_uri target/idl/gherkin_pay.json` returning 4 — confirms IDL integrity for S03's sync step.

### What assumptions changed
- No assumptions changed — the Anchor 0.30/0.31 build compatibility risk was retired cleanly, and all test signatures matched expectations.
