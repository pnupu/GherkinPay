---
id: T01
parent: S01
milestone: M006
provides:
  - Hex-accepting oracleSchema.feedAccount validator (base58 or 64-char hex)
  - FX oracle presets (EUR/USD, GBP/USD, USD/JPY) alongside normalized crypto presets
  - Decimals auto-fill on preset click
  - Hex feed ID → PublicKey conversion in toConditionInput()
key_files:
  - app/web/src/components/condition-builder.tsx
  - app/web/src/components/create-payment-wizard.tsx
key_decisions:
  - Presets store bare 64-char hex (no 0x prefix) since zod refinement validates that format directly
  - Category separators use nested div groups with Label headers rather than injecting separator elements into the button array
patterns_established:
  - OraclePreset type with category field for grouping preset buttons by asset class
  - setValue threaded via FieldProps for cross-field auto-fill in condition sub-components
observability_surfaces:
  - Zod validation message "Invalid feed ID (base58 address or 64-char hex)" identifies schema rejection
  - Hex detection regex in toConditionInput isolates conversion path for debugging
duration: 25min
verification_result: passed
completed_at: 2026-03-25
blocker_discovered: false
---

# T01: Fix oracle hex feed ID plumbing and add FX presets

**Fixed oracle preset validation (base58→hex), added EUR/USD, GBP/USD, USD/JPY FX presets with category grouping and decimals auto-fill**

## What Happened

The `oracleSchema.feedAccount` used a `publicKeyString` validator requiring base58, but ORACLE_PRESETS stored Pyth feed IDs as `0x`-prefixed hex strings — clicking any preset failed validation. Fixed the schema to accept both base58 and 64-char hex via a custom zod refinement. Stripped `0x` prefixes from all existing crypto presets, added EUR/USD (5 decimals), GBP/USD (5 decimals), USD/JPY (3 decimals) as FX presets with a typed `category` field. Added visual category separators ("Crypto" / "FX") in the preset button layout. Wired `setValue` through ConditionRow → OracleFields so clicking a preset auto-fills the decimals field. Updated `toConditionInput()` in the wizard to detect hex feed IDs and convert via `Buffer.from(hex, 'hex')` before constructing a PublicKey.

## Verification

- `cd app/web && bun run build` exits 0 — compiled successfully, all pages generated
- `grep -c` confirms all 3 FX presets present in condition-builder.tsx
- Zero `0x`-prefixed feedIds remain in presets
- `Buffer.from` hex conversion present in create-payment-wizard.tsx

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run build` | 0 | ✅ pass | 29.6s |
| 2 | `grep -c "EUR / USD\|GBP / USD\|USD / JPY" condition-builder.tsx` | 0 (output: 3) | ✅ pass | <1s |
| 3 | `grep "0x" condition-builder.tsx \| grep -c feedId` | 1 (output: 0) | ✅ pass | <1s |
| 4 | `grep -c "Buffer.from" create-payment-wizard.tsx` | 0 (output: 1) | ✅ pass | <1s |

## Diagnostics

- Schema validation errors for oracle feedAccount now display "Invalid feed ID (base58 address or 64-char hex)" — this message identifies the field and format expected.
- If a preset click fails to populate, check that `setValue` is being called in `handlePresetClick` within `OracleFields`.
- If hex→PublicKey conversion fails at submission time, the error will originate from `toConditionInput()` at the `Buffer.from(c.feedAccount, 'hex')` line — inspect whether the feedAccount string is actually 64-char hex.

## Deviations

None — all five steps executed as planned.

## Known Issues

None.

## Files Created/Modified

- `app/web/src/components/condition-builder.tsx` — Updated oracleSchema to accept hex, normalized presets, added FX presets with categories, added category separators, wired decimals auto-fill
- `app/web/src/components/create-payment-wizard.tsx` — Updated toConditionInput() oracle case with hex detection and Buffer.from conversion
- `.gsd/milestones/M006/slices/S01/tasks/T01-PLAN.md` — Added Observability Impact section per pre-flight requirement
