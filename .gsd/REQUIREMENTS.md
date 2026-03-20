# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R001 — Users can connect a Solana wallet (Phantom, Solflare) to the app and see their connected address in the UI
- Class: primary-user-loop
- Status: active
- Description: Users can connect a Solana wallet (Phantom, Solflare) to the app and see their connected address in the UI
- Why it matters: Everything else in the app requires knowing who the user is
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: S02: Wallet adapter wired (provider, button, Anchor hook), build+typecheck pass. Awaiting human UAT — connecting a real wallet requires browser extension.
- Notes: App Router requires wallet providers in a client boundary. Infrastructure complete in S02; runtime proof requires human with Phantom/Solflare extension.

### R002 — Agreements page shows real PaymentAgreement accounts from devnet, not hardcoded data
- Class: primary-user-loop
- Status: active
- Description: Agreements page shows real PaymentAgreement accounts from devnet, not hardcoded data
- Why it matters: Core utility of the console — see actual escrow state
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Must handle empty state and loading states

### R003 — Milestones page shows real ConditionAccount data per payment, phase status, and amounts
- Class: primary-user-loop
- Status: active
- Description: Milestones page shows real ConditionAccount data per payment, phase status, and amounts
- Why it matters: Payees need to track which milestones are active vs released
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: S04: useMilestones() hook fetches conditionAccount.all() and joins to parent agreements; milestones page renders live status badges, USDC amounts, condition counts; build+typecheck pass; zero mock data.
- Notes: Unfiltered fetch acceptable at devnet scale; will need getProgramAccounts filters for mainnet.

### R004 — Compliance page shows real allowlist entries from the hook program's ComplianceEntry accounts
- Class: primary-user-loop
- Status: active
- Description: Compliance page shows real allowlist entries from the hook program's ComplianceEntry accounts
- Why it matters: Admins need to see current compliance state before Token-2022 transfers
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: unmapped
- Notes: PDA seeds: ["compliance", mint, wallet]

### R005 — Activity page shows real on-chain events (PaymentCreated, PaymentFunded, PaymentReleased, etc.) parsed from program logs
- Class: primary-user-loop
- Status: active
- Description: Activity page shows real on-chain events (PaymentCreated, PaymentFunded, PaymentReleased, etc.) parsed from program logs
- Why it matters: Users need visibility into what happened and when
- Source: user
- Primary owning slice: M001/S06
- Supporting slices: none
- Validation: unmapped
- Notes: Use getParsedTransactions or event subscription

### R006 — All UI elements use shadcn/ui components (Button, Dialog, Table, Form, etc.) on top of Tailwind v4
- Class: quality-attribute
- Status: active
- Description: All UI elements use shadcn/ui components (Button, Dialog, Table, Form, etc.) on top of Tailwind v4
- Why it matters: Consistent accessible components, faster UI development for M002/M003 flows
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: M001/S02, M001/S03, M001/S04, M001/S05, M001/S06
- Validation: S01: shadcn installed, themed to GherkinPay dark green palette, 4 core components (Button/Table/Badge/Dialog) available, bun run build passes. S02: WalletMultiButton uses shadcn Button. S03: Agreements page uses Table/Badge/Skeleton. S04: Milestones page uses Table/Badge/Skeleton. Full validation when S05-S06 adopt components.
- Notes: shadcn canary path (Tailwind v4 compatible); existing design tokens coexist via --gp-border/--gp-sidebar rename pattern. Foundation complete in S01; adoption tracked across supporting slices.

### R007 — Users can create a new payment agreement (simple or milestone), define conditions with AND/OR logic, and finalize the setup
- Class: primary-user-loop
- Status: active
- Description: Users can create a new payment agreement (simple or milestone), define conditions with AND/OR logic, and finalize the setup
- Why it matters: The primary action that starts any escrow flow
- Source: user
- Primary owning slice: M002/S01
- Supporting slices: M002/S02
- Validation: unmapped
- Notes: All 5 condition types; milestone mode up to 8 milestones

### R008 — Payer can deposit USDC into escrow after conditions are finalized
- Class: primary-user-loop
- Status: active
- Description: Payer can deposit USDC into escrow after conditions are finalized
- Why it matters: Nothing is locked until funded; this is the point of no return
- Source: user
- Primary owning slice: M002/S02
- Supporting slices: none
- Validation: unmapped
- Notes: Requires token account lookup; devnet USDC only

### R009 — Any party can trigger evaluate-and-release once conditions are met, moving funds from escrow to payee
- Class: primary-user-loop
- Status: active
- Description: Any party can trigger evaluate-and-release once conditions are met, moving funds from escrow to payee
- Why it matters: The core settlement action
- Source: user
- Primary owning slice: M002/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Must show clear error if conditions not yet met

### R010 — Authority can cancel an active payment, returning escrowed funds to the payer
- Class: primary-user-loop
- Status: active
- Description: Authority can cancel an active payment, returning escrowed funds to the payer
- Why it matters: Agreements can fail; funds must be recoverable
- Source: user
- Primary owning slice: M002/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Only works pre-completion; hook program enforces compliance on refund transfers too

### R011 — Anyone can trigger the time crank for a payment condition once the unlock timestamp has passed
- Class: primary-user-loop
- Status: active
- Description: Anyone can trigger the time crank for a payment condition once the unlock timestamp has passed
- Why it matters: Time conditions are permissionless — any party (or automation) can evaluate them
- Source: inferred
- Primary owning slice: M003/S01
- Supporting slices: none
- Validation: unmapped
- Notes: crankTime instruction; UI should show "Crank" button when unlock_at < now and not yet met

### R012 — Users can trigger the oracle crank for a payment condition using a Pyth price feed
- Class: primary-user-loop
- Status: active
- Description: Users can trigger the oracle crank for a payment condition using a Pyth price feed
- Why it matters: Oracle conditions require real-time price data to evaluate
- Source: user
- Primary owning slice: M003/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Pyth devnet feeds; crankOracle instruction

### R013 — Anyone can trigger the token gate crank to verify a holder's token balance meets the threshold
- Class: primary-user-loop
- Status: active
- Description: Anyone can trigger the token gate crank to verify a holder's token balance meets the threshold
- Why it matters: Token gate conditions prove on-chain ownership without manual attestation
- Source: inferred
- Primary owning slice: M003/S01
- Supporting slices: none
- Validation: unmapped
- Notes: crankTokenGate instruction

### R014 — Registered signers can approve a multisig condition from the UI; threshold tracking is shown
- Class: primary-user-loop
- Status: active
- Description: Registered signers can approve a multisig condition from the UI; threshold tracking is shown
- Why it matters: Multisig conditions require coordinated approvals from multiple parties
- Source: user
- Primary owning slice: M003/S02
- Supporting slices: none
- Validation: unmapped
- Notes: signMultisig instruction; show who has signed and how many remain

### R015 — Registered relayers can submit webhook event hash confirmations from the UI
- Class: primary-user-loop
- Status: active
- Description: Registered relayers can submit webhook event hash confirmations from the UI
- Why it matters: Webhook conditions require an off-chain oracle (relayer) to attest to events
- Source: user
- Primary owning slice: M003/S02
- Supporting slices: none
- Validation: unmapped
- Notes: confirmWebhook instruction; only the registered relayer pubkey can confirm

### R016 — Admins can add or update wallet allowlist entries in the Token-2022 hook program
- Class: admin/support
- Status: active
- Description: Admins can add or update wallet allowlist entries in the Token-2022 hook program
- Why it matters: The transfer hook blocks non-compliant wallets; admins must be able to manage the list
- Source: user
- Primary owning slice: M003/S03
- Supporting slices: none
- Validation: unmapped
- Notes: setCompliance instruction on gherkin_pay_hook program

### R017 — Relayer operators can register their pubkey and metadata in the app
- Class: admin/support
- Status: active
- Description: Relayer operators can register their pubkey and metadata in the app
- Why it matters: The Relayers page needs to show which relayers are active and trusted
- Source: user
- Primary owning slice: M003/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Likely an off-chain registry (database or on-chain account) — design in M003

## Deferred

### R018 — UI for browsing and selecting Pyth price feeds by symbol when creating oracle conditions
- Class: differentiator
- Status: deferred
- Description: UI for browsing and selecting Pyth price feeds by symbol when creating oracle conditions
- Why it matters: UX improvement — users shouldn't need to paste raw feed addresses
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred to post-M003; paste-address approach works for M002

### R019 — Full Mobile Wallet Adapter support for iOS/Android wallets
- Class: quality-attribute
- Status: deferred
- Description: Full Mobile Wallet Adapter support for iOS/Android wallets
- Why it matters: Mobile users
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Wallet Standard auto-detects most wallets; explicit MWA needed for in-app browsers

## Out of Scope

### R020 — Payments denominated in tokens other than USDC are not supported in the UI
- Class: anti-feature
- Status: out-of-scope
- Description: Payments denominated in tokens other than USDC are not supported in the UI
- Why it matters: Prevents scope creep; contract supports any Token-2022 mint but UI hardwires USDC
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Contract is generic; UI restriction only. Can revisit.

### R021 — The app targets devnet only during all three milestones
- Class: constraint
- Status: out-of-scope
- Description: The app targets devnet only during all three milestones
- Why it matters: Prevents accidental real-money transactions during development
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Network config is a single env var change when ready

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | primary-user-loop | active | M001/S02 | none | S02: Wallet adapter wired (provider, button, Anchor hook), build+typecheck pass. Awaiting human UAT — connecting a real wallet requires browser extension. |
| R002 | primary-user-loop | active | M001/S03 | none | unmapped |
| R003 | primary-user-loop | active | M001/S04 | none | S04: useMilestones() hook fetches conditionAccount.all() and joins to parent agreements; milestones page renders live status badges, USDC amounts, condition counts; build+typecheck pass; zero mock data. |
| R004 | primary-user-loop | active | M001/S05 | none | unmapped |
| R005 | primary-user-loop | active | M001/S06 | none | unmapped |
| R006 | quality-attribute | active | M001/S01 | M001/S02, M001/S03, M001/S04, M001/S05, M001/S06 | S01: shadcn installed, themed to GherkinPay dark green palette, 4 core components (Button/Table/Badge/Dialog) available, bun run build passes. S02: WalletMultiButton uses shadcn Button. S03: Agreements page uses Table/Badge/Skeleton. S04: Milestones page uses Table/Badge/Skeleton. Full validation when S05-S06 adopt components. |
| R007 | primary-user-loop | active | M002/S01 | M002/S02 | unmapped |
| R008 | primary-user-loop | active | M002/S02 | none | unmapped |
| R009 | primary-user-loop | active | M002/S03 | none | unmapped |
| R010 | primary-user-loop | active | M002/S03 | none | unmapped |
| R011 | primary-user-loop | active | M003/S01 | none | unmapped |
| R012 | primary-user-loop | active | M003/S01 | none | unmapped |
| R013 | primary-user-loop | active | M003/S01 | none | unmapped |
| R014 | primary-user-loop | active | M003/S02 | none | unmapped |
| R015 | primary-user-loop | active | M003/S02 | none | unmapped |
| R016 | admin/support | active | M003/S03 | none | unmapped |
| R017 | admin/support | active | M003/S03 | none | unmapped |
| R018 | differentiator | deferred | none | none | unmapped |
| R019 | quality-attribute | deferred | none | none | unmapped |
| R020 | anti-feature | out-of-scope | none | none | n/a |
| R021 | constraint | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 17
- Mapped to slices: 17
- Validated: 0
- Unmapped active requirements: 0
