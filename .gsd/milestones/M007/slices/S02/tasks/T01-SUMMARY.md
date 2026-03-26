---
id: T01
parent: S02
milestone: M007
provides:
  - Custody Integration section in README documenting MPC wallet compatibility
key_files:
  - README.md
key_decisions:
  - Used table format for provider listing to match existing README style
patterns_established: []
observability_surfaces:
  - none (documentation-only change)
duration: 5m
verification_result: passed
completed_at: 2026-03-25
blocker_discovered: false
---

# T01: Add Custody Integration Section to README

**Added ### Custody Integration subsection to README documenting MPC custody provider compatibility (Fireblocks, Fordefi, Anchorage) with PDA-based escrow design**

## What Happened

Inserted a `### Custody Integration` subsection into `README.md` between the Compliance Stack code fence and `## Tech Stack`, at line 80. The section explains that GherkinPay's standard Ed25519 signer model means any MPC wallet works as payer/payee/authority, that funds are held in PDAs (not user wallets), and lists Fireblocks, Fordefi, and Anchorage Digital as example providers in a table. Content is 14 lines — well under the 20-line limit.

Also applied pre-flight observability fixes: added a diagnostic verification step to S02-PLAN.md (journalctl error check) and an Observability Impact section to T01-PLAN.md.

## Verification

All six task-level checks pass:
- `grep -c "### Custody Integration" README.md` → 1
- `grep -c "Fireblocks" README.md` → 1
- `grep -c "Fordefi" README.md` → 1
- `grep -c "Anchorage" README.md` → 1
- `grep -c "PDA\|program-derived" README.md` → 2
- Section positioned at line 80, between Compliance Stack (line 62) and Tech Stack (line 94)

Slice-level README checks also pass:
- `grep -c "Custody Integration" README.md` → 1
- `grep -c "Fireblocks\|Fordefi\|Anchorage" README.md` → 1

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -c "### Custody Integration" README.md` | 0 | ✅ pass | <1s |
| 2 | `grep -c "Fireblocks" README.md` | 0 | ✅ pass | <1s |
| 3 | `grep -c "Fordefi" README.md` | 0 | ✅ pass | <1s |
| 4 | `grep -c "Anchorage" README.md` | 0 | ✅ pass | <1s |
| 5 | `grep -c "PDA\|program-derived" README.md` | 0 | ✅ pass | <1s |
| 6 | `grep -n "Compliance Stack\|Custody Integration\|## Tech Stack" README.md` | 0 | ✅ pass | <1s |

## Diagnostics

Documentation-only change — no runtime behavior, logs, or error states affected. Inspect with `grep -n "Custody Integration" README.md` to verify section exists and position.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `README.md` — Added ### Custody Integration subsection (14 lines) between Compliance Stack and Tech Stack
- `.gsd/milestones/M007/slices/S02/S02-PLAN.md` — Added diagnostic verification step (pre-flight fix)
- `.gsd/milestones/M007/slices/S02/tasks/T01-PLAN.md` — Added Observability Impact section (pre-flight fix)
