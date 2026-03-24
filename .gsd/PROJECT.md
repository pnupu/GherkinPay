# GherkinPay

## What This Is

GherkinPay is a Solana escrow protocol for condition-gated payments. Parties create a payment agreement, lock funds in escrow, define conditions that must be met before release, and the protocol releases funds automatically when conditions pass. The smart contract is complete and deployed on devnet. The frontend is a Next.js 15 console with a polished dark green design system — currently showing only hardcoded mock data.

## Core Value

Trustless structured settlements: funds released only when on-chain conditions are met, with no manual intervention from either party.

## Current State

- Anchor smart contract (`gherkin-pay`) is complete with all instructions implemented, including Travel Rule metadata_uri field
- Token-2022 transfer hook (`gherkin-pay-hook`) handles compliance allowlist enforcement
- Next.js 15 frontend (`app/web`) has all console pages with live on-chain data — zero mock data
- shadcn/ui themed to GherkinPay dark green palette
- Wallet adapter wired into App Router with full Anchor Program integration
- All five original console pages (Agreements, Milestones, Compliance, Relayers, Activity) live on devnet data
- Create payment wizard supports simple and milestone modes with all 5 condition types and Travel Rule metadata
- Fund, release, cancel flows implemented
- Advanced flows: condition cranks (time, oracle, webhook, token-gate), multisig signing, compliance management, relayer registration
- Agreement detail page shows Travel Rule metadata URI (clickable for HTTP links)
- Compliance Audit Log page at /audit with filterable timeline of 7 on-chain event types
- Standalone crank automation bot (`scripts/crank-bot.ts`) auto-cranks time, oracle, and token-gate conditions
- M004 StableHacks Institutional Readiness complete — hackathon-ready for Track 3
- M005 complete: contract rebuilt with metadata_uri, full test suite expanded to 33 passing (20 existing + 6 oracle + 7 token-gate), deployed to devnet, frontend types synced, crank bot validated against devnet

## Architecture / Key Patterns

- **Smart contract**: Anchor 0.30, Token-2022, two programs — `gherkin_pay` (2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV) and `gherkin_pay_hook` (3pG9tTyExGA3C7sdvw5AcUvfmwydtRCLV22KPb6SfYRc)
- **Frontend**: Next.js 15 App Router, tRPC, Tailwind v4 (CSS-based config), custom dark green design tokens in `globals.css`
- **Condition types**: Multisig (threshold), TimeBased (unlock_at), Oracle (Pyth feed + comparison), Webhook (relayer + event hash), TokenGated (mint + min_amount)
- **Condition logic**: AND or OR operator per condition account
- **Milestone payments**: up to N phased releases, each with its own ConditionAccount
- **PDA seeds**: `["payment", authority, payment_id]`, `["escrow", payment]`, `["conditions", payment, milestone_index]`, `["compliance", mint, wallet]`
- **Network**: Devnet
- **Token**: USDC (Token-2022 mint on devnet)
- **Oracle**: Pyth price feeds

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] M001: Foundation — shadcn setup, wallet connect, live on-chain reads for all 5 pages
- [x] M002: Core Flows — create payment wizard, fund, release, cancel
- [x] M003: Advanced Flows — condition cranks, multisig signing, webhook confirm, compliance management, relayer registration
- [x] M004: StableHacks Institutional Readiness — Travel Rule metadata, compliance audit log, crank automation bot
  - [x] S01: Travel Rule Contract Extension — metadata_uri field on contract, IDL, wizard, and detail page
  - [x] S02: Compliance Audit Log — filterable compliance event timeline page
  - [x] S03: Crank Automation Bot — standalone bot auto-cranks time, oracle, and token-gate conditions
- [x] M005: On-Chain Verification & Devnet Deploy — contract rebuild, test coverage (33 tests), devnet deployment
  - [x] S01: Contract Rebuild & Test Fixup — anchor build succeeds, all 20 tests pass with metadata_uri
  - [x] S02: Oracle & Token-Gate Test Coverage — 13 new tests (6 oracle + 7 token-gate), suite at 33 passing
  - [x] S03: Devnet Deploy & Smoke Test — deployed to devnet, frontend IDL synced, crank bot validated
