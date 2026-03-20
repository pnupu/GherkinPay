# GherkinPay

## What This Is

GherkinPay is a Solana escrow protocol for condition-gated payments. Parties create a payment agreement, lock funds in escrow, define conditions that must be met before release, and the protocol releases funds automatically when conditions pass. The smart contract is complete and deployed on devnet. The frontend is a Next.js 15 console with a polished dark green design system — currently showing only hardcoded mock data.

## Core Value

Trustless structured settlements: funds released only when on-chain conditions are met, with no manual intervention from either party.

## Current State

- Anchor smart contract (`gherkin-pay`) is complete with all instructions implemented and tested locally
- Token-2022 transfer hook (`gherkin-pay-hook`) handles compliance allowlist enforcement
- Next.js 15 frontend (`app/web`) has all five console pages (Agreements, Milestones, Compliance, Relayers, Activity) with polished UI — all hardcoded mock data, zero on-chain reads yet
- shadcn/ui installed and themed to GherkinPay dark green palette (S01 complete)
- Wallet adapter wired into App Router — WalletContextProvider in root layout, WalletMultiButton in sidebar, Anchor Program hook available (S02 complete)
- Agreements page fetches live PaymentAgreement accounts from devnet via React Query with shadcn Table/Badge/Skeleton — zero mock data, zero tRPC (S03 complete)
- PDA derivation helpers and query hook pattern established for remaining pages
- IDL types and constants in place for both programs; devnet RPC endpoint configured via T3 env schema
- Milestones page fetches live conditionAccount data from devnet with parent agreement join, status badges, USDC amounts (S04 complete)
- Compliance page fetches live ComplianceEntry accounts from hook program via useComplianceEntries() with shadcn components (S05 complete)
- Relayers page cleaned of mock data with static placeholder for M003 (S05 complete)
- Activity page parses live on-chain events from program transaction logs via Anchor EventParser (S06 complete)
- All five console pages wired to live on-chain data — zero hardcoded mock arrays remain
- M001 milestone definition of done is fully met

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

- [ ] M001: Foundation — shadcn setup, wallet connect, live on-chain reads for all 5 pages
- [ ] M002: Core Flows — create payment wizard, fund, release, cancel
- [ ] M003: Advanced Flows — condition cranks, multisig signing, webhook confirm, compliance management, relayer registration
