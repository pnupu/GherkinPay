# M001: Foundation

**Gathered:** 2026-03-18
**Status:** Ready for planning

## Project Description

GherkinPay is a Solana escrow protocol with a complete Anchor smart contract and a Next.js 15 frontend. The contract supports condition-gated payments with 5 condition types (Multisig, TimeBased, Oracle/Pyth, Webhook, TokenGated), milestone-based phased releases, and Token-2022 compliance via a transfer hook. The frontend has polished UI with 5 console pages but all data is hardcoded mock arrays — there is no blockchain integration.

## Why This Milestone

The frontend is functionally inert. Before any write flows can be built, the plumbing must exist: shadcn component system installed and themed, wallet adapter wired into the App Router, Anchor program client set up, and all 5 pages reading real on-chain data. This milestone makes the app live — every page shows real devnet state.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Open the app, click "Connect Wallet", and see their Phantom/Solflare address in the header
- See the Agreements page populated with real PaymentAgreement accounts from devnet (or an empty state if none exist)
- See the Milestones page with real ConditionAccount data joined to their parent payments
- See the Compliance page with real ComplianceEntry accounts from the hook program
- See the Relayers page (static registry for now — real registration comes in M003)
- See the Activity page with real on-chain events parsed from program transaction logs

### Entry point / environment

- Entry point: `http://localhost:3000` (dev) / AWS deployed URL (prod)
- Environment: Browser, devnet Solana
- Live dependencies: Solana devnet RPC, Phantom or Solflare wallet extension

## Completion Class

- Contract complete means: TypeScript types generated from IDL, program client instantiates without errors, all accounts can be fetched
- Integration complete means: All 5 pages show live devnet data with no hardcoded arrays remaining
- Operational complete means: App builds and deploys cleanly on AWS with devnet config

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Connect a real Phantom wallet on devnet and see the address in the header
- With at least one PaymentAgreement on devnet, the Agreements page shows it with correct status
- With at least one ComplianceEntry on devnet, the Compliance page shows it
- Activity page shows at least one parsed on-chain event from the program

## Risks and Unknowns

- shadcn CSS variable namespace collision — existing `--bg`/`--green`/`--surface` tokens vs shadcn's `--background`/`--primary`; both must coexist without breaking the current design
- Tailwind v4 + shadcn canary compatibility — this is a relatively new pairing; the init command and component additions must be verified to work
- App Router SSR + wallet adapter — wallet hooks require client boundaries; server components that currently do tRPC calls need to stay server-side while wallet-gated UI goes client-side
- Devnet USDC Token-2022 mint address — need to confirm the correct devnet mint address for USDC (Token-2022 version, not classic SPL)

## Existing Codebase / Prior Art

- `app/web/src/styles/globals.css` — custom dark green design system with CSS vars and all component styles; shadcn tokens must merge here
- `app/web/src/app/(console)/layout.tsx` — sidebar layout; wallet connect button goes in this shell
- `app/web/src/app/(console)/agreements/page.tsx` — currently hardcoded; will be replaced with live reads
- `programs/gherkin-pay/src/lib.rs` — full instruction set; IDL will be in `target/idl/gherkin_pay.json` after build
- `tests/gherkin-pay.ts` — shows exact PDA derivation and account shapes; use as reference for frontend account fetching

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R001 — Wallet connection owned here
- R002 — Live agreement reads owned here
- R003 — Live milestone reads owned here
- R004 — Live compliance reads owned here
- R005 — On-chain activity feed owned here
- R006 — shadcn component system owned here; foundation for all future slices

## Scope

### In Scope

- shadcn/ui installation (canary, Tailwind v4 path) and theming to match GherkinPay dark green palette
- Wallet adapter (ConnectionProvider + WalletProvider) wired into App Router with client boundary
- Wallet connect button in the console layout header
- Anchor program client setup with devnet config and IDL types
- Agreements page: real PaymentAgreement account reads, status badges, empty state
- Milestones page: real ConditionAccount reads joined to payments, phase status
- Compliance page: real ComplianceEntry reads from hook program
- Relayers page: static display for now (real registration in M003)
- Activity page: on-chain event parsing from program transaction logs
- Environment variable setup for RPC endpoint and program IDs
- All pages must handle loading states and empty states gracefully

### Out of Scope / Non-Goals

- Any write transactions (create, fund, release, cancel) — those are M002
- Condition cranking, multisig signing, webhook confirmation — M003
- Compliance allowlist management (writes) — M003
- Mainnet config

## Technical Constraints

- Tailwind v4 — shadcn must use canary path, no tailwind.config.ts
- Next.js 15 App Router — wallet providers require `"use client"` boundaries; server components must remain server-side
- Existing path alias is `~/` (maps to `./src/`) — all new files must use this convention
- Bun is the package manager for `app/web`
- The tRPC `post` router is placeholder scaffolding — it stays but gets ignored once real routers exist

## Integration Points

- Solana devnet RPC — all on-chain reads
- `gherkin_pay` program (2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV) — PaymentAgreement and ConditionAccount reads
- `gherkin_pay_hook` program (3pG9tTyExGA3C7sdvw5AcUvfmwydtRCLV22KPb6SfYRc) — ComplianceEntry reads
- Phantom / Solflare wallet extensions — via Wallet Standard auto-detection

## Open Questions

- Devnet USDC Token-2022 mint address — need to look this up; the standard devnet USDC is classic SPL, Token-2022 version may differ
- Whether to use `getParsedTransactions` or `program.addEventListener` for activity feed — subscription is real-time but requires WebSocket; `getParsedTransactions` is simpler for initial implementation
