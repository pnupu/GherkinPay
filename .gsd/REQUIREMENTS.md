# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R001 — Wallet Connection
- Class: primary-user-loop
- Status: active
- Description: Users can connect a Solana wallet (Phantom, Solflare) to the app and see their connected address in the UI
- Why it matters: Everything else in the app requires knowing who the user is
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: unmapped
- Notes: App Router requires wallet providers in a client boundary

### R002 — Live Agreement Reads
- Class: primary-user-loop
- Status: active
- Description: Agreements page shows real PaymentAgreement accounts from devnet, not hardcoded data
- Why it matters: Core utility of the console — see actual escrow state
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Must handle empty state and loading states

### R003 — Live Milestone Reads
- Class: primary-user-loop
- Status: active
- Description: Milestones page shows real ConditionAccount data per payment, phase status, and amounts
- Why it matters: Payees need to track which milestones are active vs released
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: unmapped
- Notes: Requires joining PaymentAgreement + ConditionAccount data

### R004 — Live Compliance Reads
- Class: primary-user-loop
- Status: active
- Description: Compliance page shows real allowlist entries from the hook program's ComplianceEntry accounts
- Why it matters: Admins need to see current compliance state before Token-2022 transfers
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: unmapped
- Notes: PDA seeds: ["compliance", mint, wallet]

### R005 — On-Chain Activity Feed
- Class: primary-user-loop
- Status: active
- Description: Activity page shows real on-chain events (PaymentCreated, PaymentFunded, PaymentReleased, etc.) parsed from program logs
- Why it matters: Users need visibility into what happened and when
- Source: user
- Primary owning slice: M001/S06
- Supporting slices: none
- Validation: unmapped
- Notes: Use getParsedTransactions or event subscription

### R006 — shadcn/ui Component System
- Class: quality-attribute
- Status: active
- Description: All UI elements use shadcn/ui components (Button, Dialog, Table, Form, etc.) on top of Tailwind v4
- Why it matters: Consistent accessible components, faster UI development for M002/M003 flows
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: M001/S02, M001/S03, M001/S04, M001/S05, M001/S06
- Validation: unmapped
- Notes: shadcn canary path (Tailwind v4 compatible); existing design tokens must coexist

### R007 — Create Payment Wizard
- Class: primary-user-loop
- Status: active
- Description: Users can create a new payment agreement (simple or milestone), define conditions with AND/OR logic, and finalize the setup
- Why it matters: The primary action that starts any escrow flow
- Source: user
- Primary owning slice: M002/S01
- Supporting slices: M002/S02
- Validation: unmapped
- Notes: All 5 condition types; milestone mode up to 8 milestones

### R008 — Fund Payment
- Class: primary-user-loop
- Status: active
- Description: Payer can deposit USDC into escrow after conditions are finalized
- Why it matters: Nothing is locked until funded; this is the point of no return
- Source: user
- Primary owning slice: M002/S02
- Supporting slices: none
- Validation: unmapped
- Notes: Requires token account lookup; devnet USDC only

### R009 — Evaluate and Release
- Class: primary-user-loop
- Status: active
- Description: Any party can trigger evaluate-and-release once conditions are met, moving funds from escrow to payee
- Why it matters: The core settlement action
- Source: user
- Primary owning slice: M002/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Must show clear error if conditions not yet met

### R010 — Cancel Payment and Refund
- Class: primary-user-loop
- Status: active
- Description: Authority can cancel an active payment, returning escrowed funds to the payer
- Why it matters: Agreements can fail; funds must be recoverable
- Source: user
- Primary owning slice: M002/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Only works pre-completion; hook program enforces compliance on refund transfers too

### R011 — Time Condition Crank
- Class: primary-user-loop
- Status: validated
- Description: Anyone can trigger the time crank for a payment condition once the unlock timestamp has passed
- Why it matters: Time conditions are permissionless — any party (or automation) can evaluate them
- Source: inferred
- Primary owning slice: M003/S01
- Supporting slices: none
- Validation: M003/S01 delivered — useCrankTime mutation hook wired into ConditionCard CrankAction with time-based visibility. Build passes.
- Notes: crankTime instruction; UI shows "Crank Time" button when unlock_at < now and not yet met

### R012 — Oracle Condition Crank (Pyth)
- Class: primary-user-loop
- Status: validated
- Description: Users can trigger the oracle crank for a payment condition using a Pyth price feed
- Why it matters: Oracle conditions require real-time price data to evaluate
- Source: user
- Primary owning slice: M003/S01
- Supporting slices: none
- Validation: M003/S01 delivered — useCrankOracle mutation with Pyth price display, staleness warning, byte-offset parsing (73-101). Build passes.
- Notes: Pyth devnet feeds; crankOracle instruction

### R013 — Token Gate Crank
- Class: primary-user-loop
- Status: validated
- Description: Anyone can trigger the token gate crank to verify a holder's token balance meets the threshold
- Why it matters: Token gate conditions prove on-chain ownership without manual attestation
- Source: inferred
- Primary owning slice: M003/S01
- Supporting slices: none
- Validation: M003/S01 delivered — useCrankTokenGate mutation with ATA derivation for TOKEN_2022. Build passes.
- Notes: crankTokenGate instruction

### R014 — Multisig Signing
- Class: primary-user-loop
- Status: validated
- Description: Registered signers can approve a multisig condition from the UI; threshold tracking is shown
- Why it matters: Multisig conditions require coordinated approvals from multiple parties
- Source: user
- Primary owning slice: M003/S02
- Supporting slices: none
- Validation: M003/S02 delivered — useSignMultisig hook, MultisigAction component with per-signer ✓/○ status, wallet-gated Approve button, error decoding (6005/6006). Build passes.
- Notes: signMultisig instruction; shows who has signed and how many remain

### R015 — Webhook Confirmation
- Class: primary-user-loop
- Status: validated
- Description: Registered relayers can submit webhook event hash confirmations from the UI
- Why it matters: Webhook conditions require an off-chain oracle (relayer) to attest to events
- Source: user
- Primary owning slice: M003/S02
- Supporting slices: none
- Validation: M003/S02 delivered — useConfirmWebhook hook, WebhookAction component with hex input validation (64-char regex), wallet-gated Confirm button, error decoding (6019/6020). Build passes.
- Notes: confirmWebhook instruction; only the registered relayer pubkey can confirm

### R016 — Compliance Allowlist Management
- Class: admin/support
- Status: validated
- Description: Admins can add or update wallet allowlist entries in the Token-2022 hook program
- Why it matters: The transfer hook blocks non-compliant wallets; admins must be able to manage the list
- Source: user
- Primary owning slice: M003/S03
- Supporting slices: none
- Validation: M003/S03 delivered — useSetCompliance mutation via hookProgram, Compliance page with lookup/set forms, PDA derivation, TransactionStatus feedback. Build passes.
- Notes: setCompliance instruction on gherkin_pay_hook program

### R017 — Relayer Registration
- Class: admin/support
- Status: validated
- Description: Relayer operators can register their pubkey and metadata in the app
- Why it matters: The Relayers page needs to show which relayers are active and trusted
- Source: user
- Primary owning slice: M003/S03
- Supporting slices: none
- Validation: M003/S03 delivered — localStorage registry with getRelayers/addRelayer/removeRelayer, Relayers page with registration form, pubkey validation, table display with delete. Build passes.
- Notes: Off-chain localStorage registry (D009); adequate for devnet

## Deferred

### R018 — Pyth Oracle Feed Browser
- Class: differentiator
- Status: deferred
- Description: UI for browsing and selecting Pyth price feeds by symbol when creating oracle conditions
- Why it matters: UX improvement — users shouldn't need to paste raw feed addresses
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred to post-M003; paste-address approach works for M002

### R019 — Mobile Wallet Support
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

### R020 — Multi-token Support
- Class: anti-feature
- Status: out-of-scope
- Description: Payments denominated in tokens other than USDC are not supported in the UI
- Why it matters: Prevents scope creep; contract supports any Token-2022 mint but UI hardwires USDC
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Contract is generic; UI restriction only. Can revisit.

### R021 — Mainnet Deployment
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
| R001 | primary-user-loop | active | M001/S02 | none | unmapped |
| R002 | primary-user-loop | active | M001/S03 | none | unmapped |
| R003 | primary-user-loop | active | M001/S04 | none | unmapped |
| R004 | primary-user-loop | active | M001/S05 | none | unmapped |
| R005 | primary-user-loop | active | M001/S06 | none | unmapped |
| R006 | quality-attribute | active | M001/S01 | M001/S02–S06 | unmapped |
| R007 | primary-user-loop | active | M002/S01 | M002/S02 | unmapped |
| R008 | primary-user-loop | active | M002/S02 | none | unmapped |
| R009 | primary-user-loop | active | M002/S03 | none | unmapped |
| R010 | primary-user-loop | active | M002/S03 | none | unmapped |
| R011 | primary-user-loop | validated | M003/S01 | none | useCrankTime mutation, build passes |
| R012 | primary-user-loop | validated | M003/S01 | none | useCrankOracle with Pyth display, build passes |
| R013 | primary-user-loop | validated | M003/S01 | none | useCrankTokenGate with ATA, build passes |
| R014 | primary-user-loop | validated | M003/S02 | none | useSignMultisig, MultisigAction wallet-gated, build passes |
| R015 | primary-user-loop | validated | M003/S02 | none | useConfirmWebhook, WebhookAction hex input, build passes |
| R016 | admin/support | validated | M003/S03 | none | useSetCompliance via hookProgram, build passes |
| R017 | admin/support | validated | M003/S03 | none | localStorage registry, Relayers page, build passes |
| R018 | differentiator | deferred | none | none | unmapped |
| R019 | quality-attribute | deferred | none | none | unmapped |
| R020 | anti-feature | out-of-scope | none | none | n/a |
| R021 | constraint | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 10
- Mapped to slices: 10
- Validated: 7
- Unmapped active requirements: 0
