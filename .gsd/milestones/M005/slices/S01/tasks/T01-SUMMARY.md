---
id: T01
parent: S01
milestone: M005
provides:
  - Compiled program binaries (gherkin_pay.so, gherkin_pay_hook.so)
  - Generated IDL with metadata_uri (target/idl/gherkin_pay.json)
  - Generated TypeScript types with metadataUri (target/types/gherkin_pay.ts)
key_files:
  - target/idl/gherkin_pay.json
  - target/types/gherkin_pay.ts
  - target/deploy/gherkin_pay.so
key_decisions:
  - none
patterns_established:
  - Anchor generates camelCase field names in TS types (metadataUri) vs snake_case in IDL (metadata_uri)
observability_surfaces:
  - "IDL inspection: jq '.types[] | select(.name==\"PaymentAgreement\")' target/idl/gherkin_pay.json"
  - "Build diagnostics: anchor build 2>&1 | grep -i error"
duration: ~3m
verification_result: passed
completed_at: 2026-03-23
blocker_discovered: false
---

# T01: Build contract and verify IDL generation

**anchor build succeeds with both programs compiled and IDL/types containing metadata_uri in all expected locations**

## What Happened

Ran `bun install` to populate node_modules (190 packages, 3.3s), then `anchor build` which compiled both `gherkin-pay` and `gherkin-pay-hook` programs (~93s). The build produced one deprecation warning in gherkin-pay-hook (`AccountInfo::realloc` → `resize()`), but completed with exit 0. Generated IDL contains `metadata_uri` in exactly 4 locations (PaymentAgreement type, create_payment args, create_milestone_payment args, PaymentCreated event). Generated TypeScript types contain `metadataUri` (camelCase) in 4 locations.

## Verification

- `anchor build` exited 0 — both programs compiled successfully
- `grep -c metadata_uri target/idl/gherkin_pay.json` returned 4 ✅
- `grep -c metadataUri target/types/gherkin_pay.ts` returned 4 ✅
- `test -f target/types/gherkin_pay.ts` confirmed file exists ✅

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `anchor build` | 0 | ✅ pass | 92.7s |
| 2 | `grep -c metadata_uri target/idl/gherkin_pay.json` (expect 4) | 0 | ✅ pass | <1s |
| 3 | `grep -c metadataUri target/types/gherkin_pay.ts` (expect ≥1) | 0 | ✅ pass | <1s |
| 4 | `anchor test` | — | ⏳ pending T02 | — |

## Diagnostics

- Inspect IDL structure: `jq '.types[] | select(.name=="PaymentAgreement")' target/idl/gherkin_pay.json`
- Inspect instruction args: `jq '.instructions[] | select(.name=="createPayment") | .args' target/idl/gherkin_pay.json`
- Check for build warnings: `anchor build 2>&1 | grep -i warning` (currently 1 deprecation warning in hook program)

## Deviations

- Task plan's verification used `grep -q metadata_uri target/types/gherkin_pay.ts` but Anchor generates camelCase in TS types (`metadataUri`). Adapted the check to use `metadataUri` — functionally equivalent, the field is present.

## Known Issues

- `gherkin-pay-hook` emits a deprecation warning: `AccountInfo::realloc` should be replaced with `AccountInfo::resize()`. Non-blocking, does not affect functionality.

## Files Created/Modified

- `target/idl/gherkin_pay.json` — generated IDL with metadata_uri field (4 occurrences)
- `target/types/gherkin_pay.ts` — generated TypeScript types with metadataUri (camelCase, 4 occurrences)
- `target/deploy/gherkin_pay.so` — compiled gherkin-pay program binary
- `target/deploy/gherkin_pay_hook.so` — compiled gherkin-pay-hook program binary
- `.gsd/milestones/M005/slices/S01/S01-PLAN.md` — added Observability / Diagnostics section
- `.gsd/milestones/M005/slices/S01/tasks/T01-PLAN.md` — added Observability Impact section
