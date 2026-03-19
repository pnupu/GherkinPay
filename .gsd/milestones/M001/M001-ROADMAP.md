# M001: Foundation

**Vision:** Wire the existing GherkinPay frontend to the Solana devnet — shadcn component system installed and themed, wallet connect live in the header, and all five console pages showing real on-chain data instead of hardcoded mock arrays.

## Success Criteria

- Wallet connects in the browser (Phantom/Solflare); connected address visible in header
- Agreements page shows real PaymentAgreement accounts from devnet (or proper empty state)
- Milestones page shows real ConditionAccount data joined to their parent payments
- Compliance page shows real ComplianceEntry accounts from the hook program
- Activity page shows real parsed on-chain events from program transaction logs
- All pages use shadcn/ui components; the dark green GherkinPay theme is intact
- Zero hardcoded mock arrays remain in any page

## Key Risks / Unknowns

- CSS variable namespace collision between existing GherkinPay tokens and shadcn's token set — both must coexist in globals.css
- shadcn canary + Tailwind v4 compatibility on this exact Next.js 15 setup
- App Router SSR + wallet adapter client boundary — server components must not try to use wallet hooks
- Devnet Token-2022 USDC mint address needs confirmation

## Proof Strategy

- CSS collision risk → retire in S01 by running the dev server with shadcn Button rendering correctly inside the existing app shell
- Tailwind v4 + shadcn compatibility → retire in S01 by adding 3+ component types (Button, Table, Badge) and verifying no build errors
- App Router SSR + wallet → retire in S02 by connecting a real Phantom wallet on devnet and seeing the address rendered
- Devnet USDC mint → retire in S03 by fetching real USDC token accounts from devnet

## Verification Classes

- Contract verification: TypeScript build passes, no type errors, IDL types resolve correctly
- Integration verification: real Phantom wallet connects on devnet; at least one PaymentAgreement account fetched from devnet RPC
- Operational verification: `bun run build` succeeds with no errors; app serves on AWS with devnet config
- UAT / human verification: user connects wallet and sees real data on all 5 pages

## Milestone Definition of Done

This milestone is complete only when all are true:

- shadcn init'd, themed, and building without errors alongside existing CSS
- Wallet provider wired into App Router; wallet connects in the browser
- All 5 pages fetch and display real on-chain data with loading + empty states
- `bun run build` passes clean
- Zero hardcoded mock arrays remain in any console page

## Requirement Coverage

- Covers: R001, R002, R003, R004, R005, R006
- Partially covers: none
- Leaves for later: R007–R017 (M002, M003)
- Orphan risks: none

## Slices

- [x] **S01: shadcn Setup and Design System** `risk:medium` `depends:[]`
  > After this: shadcn CLI installed, Button/Table/Badge/Dialog components rendering inside the existing app shell with GherkinPay's dark green theme visually intact; `bun run build` passes.

- [ ] **S02: Wallet Connect and Anchor Client** `risk:high` `depends:[S01]`
  > After this: Phantom/Solflare wallet connects from the console header; connected pubkey visible in UI; Anchor program client initialised for both programs pointing at devnet.

- [ ] **S03: Agreements — Live Reads** `risk:medium` `depends:[S02]`
  > After this: Agreements page fetches and displays real PaymentAgreement accounts from devnet with correct status badges and empty state; zero hardcoded arrays.

- [ ] **S04: Milestones — Live Reads** `risk:low` `depends:[S03]`
  > After this: Milestones page fetches real ConditionAccount data joined to their parent PaymentAgreement accounts; milestone status and amounts are live.

- [ ] **S05: Compliance and Relayers — Live Reads** `risk:low` `depends:[S02]`
  > After this: Compliance page shows real ComplianceEntry accounts from the hook program; Relayers page is statically clean (registration comes in M003).

- [ ] **S06: Activity Event Feed** `risk:medium` `depends:[S02]`
  > After this: Activity page parses and displays real on-chain events from gherkin_pay program transactions; events labelled by type with timestamp and affected payment.

## Boundary Map

### S01 → S02

Produces:
- `app/web/src/components/ui/` — shadcn component library (Button, Badge, Table, Dialog, Form, etc.)
- `app/web/src/lib/utils.ts` — `cn()` utility
- `app/web/src/styles/globals.css` — merged GherkinPay + shadcn CSS variable namespaces
- `app/web/components.json` — shadcn config file

Consumes:
- nothing (first slice)

### S01 → S03, S04, S05, S06

Produces:
- All shadcn components available for use in any page
- `cn()` utility importable as `~/lib/utils`

Consumes:
- nothing (first slice)

### S02 → S03, S04, S05, S06

Produces:
- `app/web/src/components/wallet-provider.tsx` — `WalletContextProvider` (client component wrapping ConnectionProvider + WalletProvider + WalletModalProvider)
- `app/web/src/lib/anchor.ts` — `useAnchorProgram()` hook returning typed `Program<GherkinPay>` and `Program<GherkinPayHook>`
- `app/web/src/lib/constants.ts` — `PROGRAM_ID`, `HOOK_PROGRAM_ID`, `DEVNET_USDC_MINT`, `RPC_ENDPOINT`
- Wallet connect button rendered in `(console)/layout.tsx` header
- `target/types/gherkin_pay.d.ts` and `target/types/gherkin_pay_hook.d.ts` — IDL type exports

Consumes:
- S01: shadcn Button component (used for the wallet connect button)

### S03 → S04

Produces:
- `app/web/src/lib/queries/agreements.ts` — `useAgreements()` React Query hook returning `PaymentAgreement[]`
- `app/web/src/lib/pda.ts` — `getPaymentPDA()`, `getEscrowPDA()`, `getConditionPDA()` helpers
- Agreements page fully live

Consumes from S02:
- `useAnchorProgram()` hook
- `PROGRAM_ID`, `DEVNET_USDC_MINT` constants

### S04 → (S05, S06 are independent)

Produces:
- `app/web/src/lib/queries/milestones.ts` — `useMilestones(paymentPubkeys)` hook returning joined milestone data
- Milestones page fully live

Consumes from S02:
- `useAnchorProgram()`, `getConditionPDA()`

Consumes from S03:
- `useAgreements()` — payment pubkeys as input

### S05 → S06 (independent)

Produces:
- `app/web/src/lib/queries/compliance.ts` — `useComplianceEntries()` hook
- Compliance page fully live
- Relayers page static but clean

Consumes from S02:
- `useAnchorProgram()` (hook program), `HOOK_PROGRAM_ID`

### S06 (terminal)

Produces:
- `app/web/src/lib/queries/activity.ts` — `useActivityFeed()` hook parsing program events from recent transactions
- Activity page fully live

Consumes from S02:
- `RPC_ENDPOINT`, `PROGRAM_ID` (for `getParsedTransactions`)
