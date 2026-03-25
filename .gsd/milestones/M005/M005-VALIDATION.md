---
verdict: needs-attention
remediation_round: 0
---

# Milestone Validation: M005

## Success Criteria Checklist

- [x] `anchor test` exits 0 with all test suites passing (existing flows updated for metadata_uri + new oracle and token-gate tests) — evidence: S02 summary confirms 33 passing tests (20 existing + 6 oracle + 7 token-gate), all create calls thread metadata_uri
- [x] Generated IDL and types in `target/types/` include metadata_uri field — evidence: S01 summary confirms `grep -c metadata_uri target/idl/gherkin_pay.json` → 4, `grep -c metadataUri target/types/gherkin_pay.ts` → 4
- [x] Frontend IDL at `app/web/src/idl/gherkin_pay.json` matches the generated IDL — evidence: S03 summary confirms types synced with 4 metadataUri fields; S03-UAT Test Case 2 specifies `diff` returns exit 0
- [x] Contract deployed to devnet with current account layout — evidence: S03 summary confirms deployment; R025 validated; `solana program show` confirms 422944 bytes at `2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV`
- [ ] At least one payment with metadata_uri created via frontend and visible in detail page — gap: S03 summary states "R026 pending manual UI roundtrip UAT"; Test Case 6 in S03-UAT documents the manual steps but no evidence of execution
- [x] Crank bot runs against devnet without errors — evidence: S03 summary confirms crank bot operational readiness; S03-UAT Test Case 4 specifies dry-run with 0 errors

## Slice Delivery Audit

| Slice | Claimed | Delivered | Status |
|-------|---------|-----------|--------|
| S01 | `anchor build` succeeds with updated IDL/types; `anchor test` passes all 20 existing tests with metadata_uri | Both programs compiled, IDL has metadata_uri in 4 locations, TS types have metadataUri in 4 locations, 20/20 tests pass | pass |
| S02 | Two new describe blocks prove crank_oracle and crank_token_gate — both pass in `anchor test` | 6-test oracle block + 7-test token-gate block added; full suite 33 passing | pass |
| S03 | Contract redeployed to devnet, frontend IDL synced, payment with metadata_uri via UI visible in detail page, crank bot runs against devnet | Deploy confirmed, types synced, frontend builds clean, crank bot dry-run works. **UI roundtrip not yet executed** (manual UAT pending) | needs-attention |

## Cross-Slice Integration

All boundary map entries align with delivered artifacts:

- **S01 → S02:** S01 produced working anchor build, test infrastructure, and metadata_uri in IDL/types. S02 consumed these successfully — added 13 new tests on top of S01's 20 without any setup changes.
- **S01 → S03:** S01 produced built program artifacts in `target/deploy/`. S03 consumed these for devnet deployment.
- **S02 → S03:** S02 provided confidence (33 passing tests) that all instruction paths work. S03 deployed with that confidence.

No boundary mismatches detected.

## Requirement Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| R022 (test metadata_uri threading) | validated | S01: all 20 tests pass with metadata_uri; IDL has 4 occurrences |
| R023 (oracle condition test) | validated | S02: 6-test oracle block passes, crankOracle against mock Pyth feed succeeds |
| R024 (token-gate condition test) | **active → should be validated** | S02: 7-test token-gate block passes, crankTokenGate with holder exceeding threshold succeeds. Evidence is complete but requirement status not yet updated. |
| R025 (devnet deploy with metadata_uri) | validated | S03: program deployed, types synced, frontend builds |
| R026 (UI roundtrip with metadata_uri) | **active — pending manual UAT** | S03-UAT Test Case 6 documents the manual steps. No execution evidence yet. This is by-design human verification. |

### Minor gaps:
1. **R024** has full evidence from S02 but its status remains "active" — should be updated to "validated"
2. **R026** requires manual human UAT — automated verification cannot substitute for this. S03-UAT provides a detailed test script.

## Verdict Rationale

**needs-attention** — All automated success criteria are met. All three slices delivered their core artifacts. The single gap is R026 (UI roundtrip with metadata_uri on devnet), which is explicitly a manual/human UAT step that cannot be executed by automation. S03-UAT Test Case 6 provides thorough step-by-step instructions for this verification. This does not warrant remediation slices — it requires human execution of the documented UAT.

Additionally, R024 should be marked "validated" based on S02's clear evidence (7 passing token-gate tests).

## Action Items (non-blocking)

1. **R024 status update:** Mark R024 as validated — S02 provides complete evidence
2. **R026 human UAT:** Execute S03-UAT Test Case 6 manually to validate R026 and close the milestone
