# M005: On-Chain Verification & Devnet Deploy

**Vision:** Close the verification gap from M004 by rebuilding the contract, fixing and extending the test suite to cover metadata_uri + oracle + token-gate conditions, running all tests on localnet, deploying to devnet, and proving the frontend and crank bot work against the live program.

## Success Criteria

- `anchor test` exits 0 with all test suites passing (existing flows updated for metadata_uri + new oracle and token-gate tests)
- Generated IDL and types in `target/types/` include metadata_uri field
- Frontend IDL at `app/web/src/idl/gherkin_pay.json` matches the generated IDL
- Contract deployed to devnet with current account layout
- At least one payment with metadata_uri created via frontend and visible in detail page
- Crank bot runs against devnet without errors

## Key Risks / Unknowns

- Anchor CLI 0.31.1 vs code targeting 0.30 — build may surface version differences
- Mock Pyth fixture may need updating for oracle test (price data, feed ID, timestamps)
- Generated IDL may differ from manually-patched frontend IDL — reconciliation needed
- Devnet deploy authority needs SOL balance

## Proof Strategy

- Anchor build compatibility → retire in S01 by successfully running `anchor build`
- Mock Pyth fixture validity → retire in S02 by running oracle test against it
- IDL reconciliation → retire in S03 by diffing generated vs frontend IDL and syncing

## Verification Classes

- Contract verification: `anchor build` succeeds, `anchor test` passes all suites
- Integration verification: frontend creates payment with metadata_uri on devnet, detail page displays it
- Operational verification: crank bot polls devnet and logs structured output
- UAT / human verification: full flow — create payment with metadata → fund → observe in audit log

## Milestone Definition of Done

This milestone is complete only when all are true:

- `anchor build` succeeds and generates updated IDL/types with metadata_uri
- All existing tests pass with metadata_uri threaded through create calls
- New oracle condition test passes with mock Pyth feed
- New token-gate condition test passes
- `anchor test` exits 0 (full suite)
- Contract deployed to devnet
- Frontend IDL synced with generated IDL
- `bun run build` passes clean
- At least one payment with metadata_uri proven via UI roundtrip on devnet

## Requirement Coverage

- Covers: R022, R023, R024, R025, R026
- Partially covers: none
- Leaves for later: R018, R019
- Orphan risks: none

## Slices

- [x] **S01: Contract Rebuild & Test Fixup** `risk:high` `depends:[]`
  > After this: `anchor build` succeeds with updated IDL/types, and `anchor test` passes all existing test suites with metadata_uri threaded through every createPayment and createMilestonePayment call.

- [x] **S02: Oracle & Token-Gate Test Coverage** `risk:medium` `depends:[S01]`
  > After this: Two new test describe blocks prove crank_oracle with the mock Pyth feed and crank_token_gate with a gated mint — both pass in `anchor test`.

- [x] **S03: Devnet Deploy & Smoke Test** `risk:medium` `depends:[S02]`
  > After this: Contract redeployed to devnet, frontend IDL synced, a payment with metadata_uri created via the UI is visible in the detail page, and the crank bot runs against devnet.

## Boundary Map

### S01 → S02

Produces:
- Updated `target/types/gherkin_pay.ts` with metadata_uri in PaymentAgreement and create instructions
- Updated `target/idl/gherkin_pay.json` generated from `anchor build`
- All existing tests passing with metadata_uri as 4th arg to createPayment / createMilestonePayment
- Working `anchor test` localnet validator setup

Consumes:
- nothing (first slice)

### S01 → S03

Produces:
- Built program artifacts in `target/deploy/`
- Confirmed Anchor build toolchain works locally

Consumes:
- nothing (first slice)

### S02 → S03

Produces:
- Oracle test exercising mock Pyth fixture and crank_oracle instruction
- Token-gate test exercising crank_token_gate with second mint
- Full `anchor test` suite passing (existing + new)

Consumes from S01:
- Working anchor build with metadata_uri
- Test infrastructure (provider, helper PDAs, Token-2022 setup)

### S03

Produces:
- Deployed program on devnet
- Frontend IDL at `app/web/src/idl/gherkin_pay.json` synced with generated IDL
- Proof of metadata_uri roundtrip via UI
- Proof of crank bot running against devnet

Consumes from S01:
- Built program in `target/deploy/`
- Generated IDL in `target/idl/`

Consumes from S02:
- Confidence that all instruction paths work (tests pass)
