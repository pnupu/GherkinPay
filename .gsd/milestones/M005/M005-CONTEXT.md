# M005: On-Chain Verification & Devnet Deploy

**Gathered:** 2026-03-23
**Status:** Ready for planning

## Project Description

GherkinPay is a Solana escrow protocol with a Next.js console and a standalone crank bot. M004 added Travel Rule metadata_uri to the contract, a compliance audit log page, and the crank automation bot — but all changes were validated only at the compilation/type-check level. No on-chain testing has been done since the contract shape changed.

## Why This Milestone

M004 shipped code that compiles but has never been proven on-chain. The test suite doesn't know about `metadata_uri` (every `createPayment` call passes 3 args where the contract now expects 4). Oracle and token-gate condition cranks have never been tested on-chain despite having contract instructions and a mock Pyth fixture. The contract needs to be redeployed to devnet before the frontend or crank bot can work with real data.

This milestone closes the verification gap before StableHacks submission.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Run `anchor test` and see all existing + new test cases pass (time, multisig, webhook, oracle, token-gate, cancellation, milestone payments — all with metadata_uri)
- Deploy the contract to devnet with the current account layout
- Create a payment with a Travel Rule metadata URI through the frontend wizard and see it in the detail page
- Run the crank bot against devnet and watch it crank a real condition

### Entry point / environment

- Entry point: `anchor test` (localnet), `anchor deploy` (devnet), `http://localhost:3000` (frontend), `bun run scripts/crank-bot.ts` (crank bot)
- Environment: local dev + devnet
- Live dependencies involved: Solana devnet RPC, local validator (anchor test)

## Completion Class

- Contract complete means: `anchor test` passes all cases including oracle and token-gate
- Integration complete means: frontend creates payment with metadata_uri that roundtrips to detail page on devnet
- Operational complete means: crank bot cranks at least one real condition on devnet

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- `anchor test` exits 0 with all test suites passing
- Contract deployed to devnet with new program address or updated at existing address
- IDL in `target/types/` and `app/web/src/idl/gherkin_pay.json` match the deployed program
- At least one payment with metadata_uri created and visible in the frontend

## Risks and Unknowns

- Anchor CLI version mismatch (0.31.1 locally vs code targeting 0.30) — likely fine but could surface in build
- Mock Pyth fixture may need updating for oracle tests — the fixture exists but has never been used in a test
- Token-gate test needs a second Token-2022 mint and holder account setup
- Devnet deploy may require SOL airdrop for deploy authority
- Existing devnet payments will be inaccessible after redeploy due to layout change

## Existing Codebase / Prior Art

- `tests/gherkin-pay.ts` — 1007-line test suite with 7 describe blocks covering simple payment, multisig, webhook, OR logic, cancellation, milestone payments. No oracle/token-gate tests. No metadata_uri.
- `Anchor.toml` — configured for localnet with mock Pyth feed fixture at `fixtures/mock-pyth-feed.json`
- `programs/gherkin-pay/src/instructions/crank_oracle.rs` — on-chain oracle instruction parsing Pyth PriceUpdateV2 at byte offsets 73/93
- `programs/gherkin-pay/src/instructions/crank_token_gate.rs` — on-chain token-gate instruction checking holder ATA balance
- `target/types/gherkin_pay.ts` — stale generated types (pre-metadata_uri)
- `app/web/src/idl/gherkin_pay.json` — manually patched IDL with metadata_uri (4 occurrences)
- `scripts/crank-bot.ts` — 611-line standalone bot with time/oracle/token-gate handlers

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R022 — All contract instructions pass localnet integration tests including metadata_uri
- R023 — Oracle condition crank proven by on-chain test with mock Pyth feed
- R024 — Token-gate condition crank proven by on-chain test
- R025 — Contract deployed to devnet with current account layout
- R026 — Payment with metadata_uri roundtrips through UI

## Scope

### In Scope

- Rebuild contract with `anchor build`, regenerate IDL and types
- Update all existing test `createPayment`/`createMilestonePayment` calls to pass metadata_uri
- Add oracle condition test using mock Pyth fixture
- Add token-gate condition test with second mint
- Run full `anchor test` suite on localnet
- Deploy to devnet
- Sync frontend IDL with generated IDL
- Smoke test frontend payment creation with metadata_uri
- Smoke test crank bot against devnet

### Out of Scope / Non-Goals

- New features or UI changes
- Mainnet deployment
- CI/CD pipeline setup
- Performance optimization
- Additional contract instructions

## Technical Constraints

- Anchor CLI 0.31.1 available locally
- Solana CLI 2.1.22, devnet configured
- Mock Pyth feed fixture at `fixtures/mock-pyth-feed.json` — preloaded into test validator
- Token-2022 mint used throughout (not standard SPL token)
- `bun run build` in app/web must continue to pass after any IDL changes

## Integration Points

- Solana localnet (anchor test validator) — all test execution
- Solana devnet — deployment target
- Pyth mock fixture — oracle test data source
- Frontend IDL at `app/web/src/idl/gherkin_pay.json` — must match generated IDL
- Crank bot at `scripts/crank-bot.ts` — reads IDL for account deserialization

## Open Questions

- Whether the generated IDL from `anchor build` will match the manually-patched frontend IDL exactly — may need minor adjustments
- Whether the mock Pyth fixture data is valid for the oracle test (price, timestamps, feed ID)
