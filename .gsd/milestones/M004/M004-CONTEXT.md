# M004: StableHacks Institutional Readiness

**Gathered:** 2026-03-23
**Status:** Ready for planning

## Project Description

GherkinPay is a Solana escrow protocol for condition-gated payments with a working devnet deployment and full browser UI. For the StableHacks hackathon (Track 3: Programmable Stablecoin Payments), the project needs institutional compliance infrastructure to match the judging criteria: KYC/KYT awareness, Travel Rule compliance, audit trails, and programmable automation without manual intervention.

## Why This Milestone

The hackathon deadline is March 29, 2026. GherkinPay's core escrow protocol is strong for Track 3 but lacks three capabilities the judges (AMINA Bank, UBS, Fireblocks) will evaluate: compliance audit visibility, Travel Rule metadata, and automated condition evaluation.

## User-Visible Outcome

### When this milestone is complete, the user can:

- View a Compliance Audit Log page showing all compliance-relevant events (allowlist changes, transfer blocks, settlement approvals) with filterable timeline
- Attach Travel Rule metadata (sender/receiver identity URI) when creating a payment, visible in the agreement detail view
- Run a crank bot that automatically evaluates conditions (time, oracle, token gate) without manual intervention

### Entry point / environment

- Entry point: Browser at gherkinpay.lacertalabs.xyz + CLI crank bot
- Environment: Devnet + local dev
- Live dependencies: Solana devnet RPC, Pyth devnet feeds

## Completion Class

- Contract complete means: PaymentAgreement includes metadata_uri field, IDL regenerated, program redeployed to devnet
- Integration complete means: Create wizard passes metadata_uri, detail page shows it, audit log page renders real events, crank bot auto-evaluates conditions
- Operational complete means: Crank bot runs as a persistent process and auto-cranks satisfiable conditions

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- A payment created through the wizard carries Travel Rule metadata and it's visible in the detail view
- The compliance audit log shows real on-chain compliance events
- The crank bot detects a time-based condition past unlock_at and cranks it without manual UI interaction
- bun run build passes clean

## Risks and Unknowns

- Contract modification requires redeploy to devnet — all existing payments become inaccessible (new program ID or account layout change)
- Crank bot needs a funded keypair for transaction fees
- Pyth oracle staleness may affect automated cranking reliability

## Existing Codebase / Prior Art

- `programs/gherkin-pay/src/state/payment.rs` — PaymentAgreement struct (needs metadata_uri field)
- `programs/gherkin-pay/src/instructions/create_payment.rs` — create instruction (needs metadata_uri param)
- `programs/gherkin-pay/src/events.rs` — on-chain events (compliance events may need additions)
- `programs/gherkin-pay-hook/src/lib.rs` — transfer hook with ComplianceEntry (206 lines)
- `app/web/src/lib/mutations/create-payment.ts` — frontend create mutation
- `app/web/src/app/(console)/activity/page.tsx` — event feed (pattern for audit log)
- `app/web/src/lib/queries/activity.ts` — event parsing with Anchor EventParser

## Relevant Requirements

- R016 (Compliance Management) — validated, extend with audit log view
- R007 (Create Payment) — validated, extend with metadata_uri field

## Scope

### In Scope

- Travel Rule metadata_uri field on PaymentAgreement (contract + IDL + frontend)
- Compliance Audit Log page (frontend, reads existing on-chain events)
- Crank bot script (Node/TypeScript, standalone)
- Contract redeploy to devnet

### Out of Scope / Non-Goals

- Actual KYC provider integration (Jumio, Sumsub, etc.)
- Encryption of metadata (just a URI field — encryption is the off-chain system's job)
- Mainnet deployment
- Full FATF Travel Rule implementation (this is architectural proof, not production compliance)
- FX / cross-border currency conversion

## Technical Constraints

- Anchor 0.30 program, Token-2022
- Devnet only
- Must not break existing UI flows (agreements, milestones, compliance, relayers, activity pages)

## Integration Points

- Solana devnet — program redeploy
- Pyth devnet feeds — oracle crank automation
- Existing frontend — new page + wizard modification

## Open Questions

- Whether to emit new compliance-specific events from the hook program or rely on parsing existing transfer hook execution logs
