# GherkinPay

## What This Is

GherkinPay is a Solana escrow protocol for condition-gated payments. Parties create a payment agreement, lock funds in escrow, define conditions that must be met before release, and the protocol releases funds automatically when conditions pass. The smart contract is complete and deployed on devnet. The frontend is a Next.js 15 console that is fully integrated with the on-chain programs — all escrow lifecycle actions and condition management flows are operable from the browser on devnet.

## Core Value

Trustless structured settlements: funds released only when on-chain conditions are met, with no manual intervention from either party.

## Current State

- Anchor smart contract (`gherkin-pay`) is complete with all instructions implemented and tested locally
- Token-2022 transfer hook (`gherkin-pay-hook`) handles compliance allowlist enforcement
- Next.js 15 frontend (`app/web`) is feature-complete for devnet:
  - All 5 console pages (Agreements, Milestones, Compliance, Relayers, Activity) show live on-chain data
  - Wallet adapter (Phantom, Solflare) integrated with connection UI
  - Full escrow lifecycle: create payment → fund → crank conditions → evaluate & release / cancel
  - All 5 condition types operable: time crank, oracle crank (Pyth), token gate crank, multisig approval, webhook confirmation
  - Admin flows: compliance allowlist management (on-chain), relayer registration (localStorage)
  - 27-variant error decoder maps program errors to human-readable messages
  - Transaction feedback with Solana Explorer links

## Architecture / Key Patterns

- **Smart contract**: Anchor 0.30, Token-2022, two programs — `gherkin_pay` (2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV) and `gherkin_pay_hook` (3pG9tTyExGA3C7sdvw5AcUvfmwydtRCLV22KPb6SfYRc)
- **Frontend**: Next.js 15 App Router, tRPC, Tailwind v4 (CSS-based config), custom dark green design tokens in `globals.css`, shadcn/ui canary components
- **Solana client**: Anchor 0.32 with `Program<Idl>` casting pattern, `(program.methods as any)` accessors, React Query for data fetching, wallet-adapter-react for wallet connection
- **Condition types**: Multisig (threshold), TimeBased (unlock_at), Oracle (Pyth feed + comparison), Webhook (relayer + event hash), TokenGated (mint + min_amount)
- **Condition logic**: AND or OR operator per condition account
- **Milestone payments**: up to N phased releases, each with its own ConditionAccount
- **PDA seeds**: `["payment", authority, payment_id]`, `["escrow", payment]`, `["conditions", payment, milestone_index]`, `["compliance", mint, wallet]`
- **Mutation pattern**: eslint-disable header → `(program.methods as any).instructionName()` → `[GherkinPay]` console logs → `decodeAnchorError` on failure → `queryClient.invalidateQueries` on success
- **Network**: Devnet
- **Token**: USDC (Token-2022 mint on devnet)
- **Oracle**: Pyth price feeds (direct byte parsing at offsets 73-101, no SDK)

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] M001: Foundation — shadcn setup, wallet connect, live on-chain reads for all 5 pages
- [x] M002: Core Flows — create payment wizard, fund, release, cancel
- [x] M003: Advanced Flows — condition cranks, multisig signing, webhook confirm, compliance management, relayer registration
