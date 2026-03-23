# M004: StableHacks Institutional Readiness

**Vision:** Make GherkinPay hackathon-ready for StableHacks Track 3 (Programmable Stablecoin Payments) by adding Travel Rule metadata to the contract, a compliance audit log to the UI, and a crank automation bot — proving institutional-grade compliance awareness and programmable settlement without manual intervention.

## Success Criteria

- Payment agreements carry Travel Rule metadata (sender/receiver identity URI) set during creation and visible in the detail view
- A dedicated Compliance Audit Log page shows a filterable timeline of compliance-relevant on-chain events
- A standalone crank bot automatically evaluates satisfiable conditions (time, oracle, token gate) without human interaction
- All existing UI flows continue working after contract redeploy
- `bun run build` passes clean

## Key Risks / Unknowns

- Contract layout change requires devnet redeploy — existing test payments become inaccessible
- Anchor build toolchain must be available locally (anchor build + deploy)
- Pyth devnet feed staleness may cause oracle auto-crank failures

## Proof Strategy

- Contract layout change → retire in S01 by redeploying, regenerating IDL, and proving a payment with metadata_uri roundtrips through create wizard → detail view
- Crank automation reliability → retire in S03 by proving the bot detects and cranks a time condition past unlock_at

## Verification Classes

- Contract verification: `anchor build` succeeds, `anchor deploy` to devnet succeeds, IDL matches new struct
- Integration verification: Create payment with metadata_uri via UI, see it in detail view; audit log page renders events; crank bot sends successful transaction
- Operational verification: Crank bot runs as persistent process, detects and cranks conditions automatically
- UAT / human verification: Full flow — create payment with metadata → fund → bot cranks time condition → release

## Milestone Definition of Done

This milestone is complete only when all are true:

- Contract redeployed with metadata_uri field, IDL regenerated, frontend updated
- Create wizard includes Travel Rule metadata fields, detail page displays them
- Compliance Audit Log page shows filterable compliance events
- Crank bot runs and auto-cranks at least one condition type
- `bun run build` passes clean
- All existing pages (agreements, milestones, compliance, relayers, activity) still work

## Requirement Coverage

- Covers: R007 (extended with metadata_uri), R016 (extended with audit log)
- New implicit requirements: Travel Rule metadata, automated cranking
- Leaves for later: R018, R019

## Slices

- [x] **S01: Travel Rule Contract Extension** `risk:high` `depends:[]`
  > After this: A payment created via the wizard carries sender/receiver identity metadata URI, stored on-chain and visible in the agreement detail view. Contract redeployed to devnet.

- [x] **S02: Compliance Audit Log** `risk:medium` `depends:[]`
  > After this: A new Compliance Audit Log page in the console shows a filterable timeline of compliance-relevant events (allowlist changes, payment settlements, condition evaluations) parsed from on-chain program logs.

- [x] **S03: Crank Automation Bot** `risk:medium` `depends:[S01]`
  > After this: A standalone TypeScript bot monitors on-chain conditions and automatically sends crank transactions when conditions are satisfiable — no manual UI interaction required. Proven with a time-based condition.

## Boundary Map

### S01 → S02

Produces:
- Updated `PaymentAgreement` struct with `metadata_uri: String` field
- Updated `create_payment` and `create_milestone_payment` instructions accepting metadata_uri
- New `ComplianceEvent` on-chain event (or extended existing events with compliance context)
- Regenerated IDL JSON for both programs
- Updated frontend create-payment mutation and detail page

Consumes:
- nothing (first slice)

### S01 → S03

Produces:
- Redeployed program on devnet with new program address or same address
- Updated IDL that crank bot reads for account deserialization

Consumes:
- nothing (first slice)

### S02 (independent)

Produces:
- Compliance Audit Log page at `/audit` route
- `useComplianceAuditLog()` query hook parsing compliance events from transaction logs

Consumes from S01:
- Updated IDL with any new event types (or uses existing events if sufficient)

### S03

Produces:
- `scripts/crank-bot.ts` — standalone TypeScript crank automation
- Bot configuration (RPC URL, keypair path, poll interval)
- README section documenting bot setup and operation

Consumes from S01:
- Redeployed program address and IDL for account deserialization
- Condition evaluation logic (time comparison, oracle price check, token balance check)
