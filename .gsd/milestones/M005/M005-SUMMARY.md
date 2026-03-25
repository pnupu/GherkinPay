---
id: M005
title: "On-Chain Verification & Devnet Deploy"
status: complete
started: 2026-03-23
completed: 2026-03-23
slices_total: 3
slices_done: 3
verification_result: passed
requirement_outcomes:
  - id: R022
    from_status: active
    to_status: validated
    proof: "anchor test exits 0 with 33 passing; all 6 create call sites pass metadata_uri; IDL contains metadata_uri in 4 locations"
  - id: R023
    from_status: active
    to_status: validated
    proof: "6-test 'Payment with Oracle Condition' block passes — crankOracle succeeds against mock Pyth feed, condition.met flips true, payment completes"
  - id: R024
    from_status: active
    to_status: validated
    proof: "7-test 'Payment with Token-Gate Condition' block passes — crankTokenGate succeeds with 1000 tokens exceeding 100-token threshold, condition.met flips true, payment completes"
  - id: R025
    from_status: active
    to_status: validated
    proof: "solana program show confirms program deployed at 2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV with 422944 bytes; frontend types synced with 4 metadataUri fields; frontend builds clean"
  - id: R026
    from_status: active
    to_status: active
    proof: "Pending manual UAT — devnet deployed and frontend IDL synced, but no human-verified UI roundtrip yet"
key_decisions: []
risks_retired:
  - "Anchor CLI 0.31.1 vs code targeting 0.30 — build compatibility confirmed, no issues"
  - "Mock Pyth fixture validity — oracle test passes against fixture at JBc8woEgPzyXwLEmZJpnSiNhneGBcectQrQpzm52fvCj"
  - "IDL reconciliation — generated IDL synced to frontend with 4 metadata_uri fields confirmed"
risks_discovered: []
---

# M005: On-Chain Verification & Devnet Deploy

**Closed the verification gap from M004: contract rebuilt with metadata_uri, full test suite expanded from 20 to 33 passing tests (oracle + token-gate coverage), deployed to devnet, frontend types synced, crank bot validated against devnet.**

## What This Milestone Delivered

M004 added Travel Rule metadata_uri to the contract but left the test suite untouched and the contract undeployed. M005 addressed that gap across three slices:

1. **S01 — Contract Rebuild & Test Fixup**: Ran `anchor build` (both gherkin_pay and gherkin_pay_hook compiled cleanly), verified metadata_uri appears in 4 IDL locations and 4 TS type locations, then threaded metadata_uri through all 6 create call sites in the test file. All 20 existing tests pass.

2. **S02 — Oracle & Token-Gate Test Coverage**: Added 13 new tests across two describe blocks. Oracle tests exercise crankOracle against the mock Pyth feed (price 15B < target 20B → condition met). Token-gate tests create a second Token-2022 mint, mint 1000 tokens to a holder, and verify crankTokenGate passes the 100-token threshold. Full suite: 33 passing.

3. **S03 — Devnet Deploy & Smoke Test**: Deployed gherkin_pay to devnet at `2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV` (422944 bytes). Synced frontend IDL and types (4 metadata_uri / 4 metadataUri fields). Frontend builds clean with 10 routes. Crank bot connects to devnet and polls without errors.

## Success Criteria Verification

| Criterion | Met? | Evidence |
|-----------|------|----------|
| `anchor test` exits 0, all suites pass | ✅ | 33 passing across 8 describe blocks (S02 summary) |
| Generated IDL/types include metadata_uri | ✅ | `grep -c` returns 4 for both IDL and TS types |
| Frontend IDL matches generated IDL | ✅ | 4 metadata_uri in frontend IDL, 4 metadataUri in frontend types |
| Contract deployed to devnet | ✅ | `solana program show` confirms 422944 bytes at program ID |
| Payment with metadata_uri via frontend + detail page | ⚠️ | R026 pending manual UAT — infrastructure ready but no human verification |
| Crank bot runs against devnet without errors | ✅ | S03/T02 dry-run confirmed connection and polling |

## Definition of Done

- ✅ `anchor build` succeeds with updated IDL/types
- ✅ All existing tests pass with metadata_uri threaded through
- ✅ New oracle condition test passes with mock Pyth feed (6 tests)
- ✅ New token-gate condition test passes (7 tests)
- ✅ `anchor test` exits 0 (33 passing)
- ✅ Contract deployed to devnet
- ✅ Frontend IDL synced with generated IDL
- ✅ `bun run build` passes clean (10 routes)
- ⚠️ Payment with metadata_uri proven via UI roundtrip on devnet — **pending manual UAT (R026)**

All automated criteria met. R026 (UI roundtrip) requires human interaction with the frontend on devnet — the infrastructure is fully in place.

## Code Changes

3 non-`.gsd/` files changed (434 insertions, 7 deletions):
- `tests/gherkin-pay.ts` — +364 lines: metadata_uri threaded through all create calls, 6-test oracle block, 7-test token-gate block
- `app/web/src/types/gherkin_pay.ts` — +18/-7: synced with generated types including metadataUri in 4 locations
- `scripts/verify-s03-smoke.sh` — +59 lines: S03 smoke test verification script

## Requirement Outcomes

| Req | Description | From → To | Proof |
|-----|-------------|-----------|-------|
| R022 | Test suite updated for metadata_uri | active → validated | 33 tests passing, all create calls include metadata_uri |
| R023 | Oracle condition test coverage | active → validated | 6-test oracle block passes with mock Pyth feed |
| R024 | Token-gate condition test coverage | active → validated | 7-test token-gate block passes with Token-2022 mint |
| R025 | Devnet deployment with metadata_uri | active → validated | Program deployed, 422944 bytes confirmed |
| R026 | Frontend metadata_uri roundtrip | active → active | Infra ready, pending manual UAT |

## Risks Retired

- **Anchor 0.30/0.31 build compatibility** — `anchor build` succeeds without issues; the only warning is a cosmetic `AccountInfo::realloc` deprecation in the hook program
- **Mock Pyth fixture validity** — Oracle tests pass cleanly against the fixture at `JBc8woEgPzyXwLEmZJpnSiNhneGBcectQrQpzm52fvCj`
- **IDL reconciliation** — Generated IDL synced to frontend with exact field counts confirmed via grep

## Known Limitations

- Oracle test only covers `lt` operator — other comparison operators (gt, eq, gte, lte) untested
- Token-gate test only covers happy path (sufficient balance) — insufficient balance rejection untested
- Multi-condition AND/OR combinations with oracle/token-gate not tested
- Hook program emits `AccountInfo::realloc` deprecation warning — cosmetic, no functional impact

## What the Next Milestone Should Know

- The full test suite is at 33 passing tests with ~42-47s runtime (localnet validator startup dominates)
- All instruction paths have test coverage: create, fund, crank (time/multisig/webhook/oracle/token-gate), evaluate, release, cancel
- The mock Pyth feed fixture at `JBc8woEgPzyXwLEmZJpnSiNhneGBcectQrQpzm52fvCj` is fragile — if the fixture data changes, oracle tests break silently
- R026 (UI roundtrip) is the only remaining gap — everything else is automated and verified
- The `gherkin-pay-hook` deprecation warning (`realloc` → `resize()`) will eventually need fixing if Solana SDK enforces it
