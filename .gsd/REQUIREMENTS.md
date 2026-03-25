# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R026 — A payment created via the frontend wizard with a metadata_uri value appears with that URI in the agreement detail page
- Class: integration
- Status: active
- Description: A payment created via the frontend wizard with a metadata_uri value appears with that URI in the agreement detail page
- Why it matters: Proves the entire M004 stack works end-to-end: contract → IDL → mutation → query → display
- Source: execution
- Primary owning slice: M005/S03
- Supporting slices: none
- Validation: mapped
- Notes: Requires devnet deploy (R025) first

### R031 — Wallet addresses (payer, payee, authority) in the agreement detail page display an "MPC Compatible" badge with a tooltip explaining Fireblocks/Fordefi/MPC custody provider compatibility
- Class: differentiator
- Status: active
- Description: Wallet addresses (payer, payee, authority) in the agreement detail page display an "MPC Compatible" badge with a tooltip explaining Fireblocks/Fordefi/MPC custody provider compatibility
- Why it matters: Fireblocks is a hackathon partner; showing custody awareness signals institutional readiness to judges
- Source: user
- Primary owning slice: M007/S01
- Supporting slices: none
- Validation: mapped
- Notes: No contract changes; badges are informational UI labels based on the fact that escrow PDAs use standard Solana signers

### R032 — The project README includes a Custody Integration section explaining that any MPC custody provider (Fireblocks, Fordefi, etc.) can act as payer or payee since the protocol uses standard Solana signers
- Class: differentiator
- Status: active
- Description: The project README includes a Custody Integration section explaining that any MPC custody provider (Fireblocks, Fordefi, etc.) can act as payer or payee since the protocol uses standard Solana signers
- Why it matters: Documentation proves architectural awareness even without a live Fireblocks integration
- Source: user
- Primary owning slice: M007/S01
- Supporting slices: none
- Validation: mapped
- Notes: Existing README has Key Capabilities table — add Custody row and expanded section

## Validated

### R001 — Users can connect a Solana wallet (Phantom, Solflare) to the app and see their connected address in the UI
- Class: primary-user-loop
- Status: validated
- Description: Users can connect a Solana wallet (Phantom, Solflare) to the app and see their connected address in the UI
- Why it matters: Everything else in the app requires knowing who the user is
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: validated
- Notes: WalletContextProvider in root layout, WalletMultiButton in sidebar, useAnchorProgram hook available. All M002/M003 mutation flows require and use connected wallet. Build passes.

### R002 — Agreements page shows real PaymentAgreement accounts from devnet, not hardcoded data
- Class: primary-user-loop
- Status: validated
- Description: Agreements page shows real PaymentAgreement accounts from devnet, not hardcoded data
- Why it matters: Core utility of the console — see actual escrow state
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: validated
- Notes: useQuery + program.account.paymentAgreement.all() with PDA deduplication, search/filter toolbar, loading/empty/error states. Zero mock data.

### R003 — Milestones page shows real ConditionAccount data per payment, phase status, and amounts
- Class: primary-user-loop
- Status: validated
- Description: Milestones page shows real ConditionAccount data per payment, phase status, and amounts
- Why it matters: Payees need to track which milestones are active vs released
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: validated
- Notes: useMilestones() hook fetches conditionAccount.all() with parent agreement join. Status filter, search toolbar, USDC amounts, condition counts. Build passes.

### R004 — Compliance page shows real allowlist entries from the hook program's ComplianceEntry accounts
- Class: primary-user-loop
- Status: validated
- Description: Compliance page shows real allowlist entries from the hook program's ComplianceEntry accounts
- Why it matters: Admins need to see current compliance state before Token-2022 transfers
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: validated
- Notes: useComplianceEntries() fetches from hook program. Lookup and set-compliance forms with TransactionStatus feedback.

### R005 — Activity page shows real on-chain events (PaymentCreated, PaymentFunded, PaymentReleased, etc.) parsed from program logs
- Class: primary-user-loop
- Status: validated
- Description: Activity page shows real on-chain events (PaymentCreated, PaymentFunded, PaymentReleased, etc.) parsed from program logs
- Why it matters: Users need visibility into what happened and when
- Source: user
- Primary owning slice: M001/S06
- Supporting slices: none
- Validation: validated
- Notes: Anchor EventParser, event type filter pills, search by event/signature. Zero mock data.

### R006 — All UI elements use shadcn/ui components (Button, Dialog, Table, Form, etc.) on top of Tailwind v4
- Class: quality-attribute
- Status: validated
- Description: All UI elements use shadcn/ui components (Button, Dialog, Table, Form, etc.) on top of Tailwind v4
- Why it matters: Consistent accessible components, faster UI development
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: M001/S02–S06, M002/S01–S03, M003/S01–S03
- Validation: validated
- Notes: shadcn canary (Tailwind v4), themed to dark green palette. All pages use Table/Badge/Skeleton/Button/Dialog/Input/Card. TableToolbar component for unified search/filter.

### R007 — Users can create a new payment agreement (simple or milestone), define conditions with AND/OR logic, and finalize the setup
- Class: primary-user-loop
- Status: validated
- Description: Users can create a new payment agreement (simple or milestone), define conditions with AND/OR logic, and finalize the setup
- Why it matters: The primary action that starts any escrow flow
- Source: user
- Primary owning slice: M002/S01
- Supporting slices: M002/S02
- Validation: validated
- Notes: Create Payment wizard (289-line create-payment.ts) handles simple and milestone modes, all 5 condition types, sequential multi-instruction transactions. Build passes.

### R008 — Payer can deposit USDC into escrow after conditions are finalized
- Class: primary-user-loop
- Status: validated
- Description: Payer can deposit USDC into escrow after conditions are finalized
- Why it matters: Nothing is locked until funded; this is the point of no return
- Source: user
- Primary owning slice: M002/S02
- Supporting slices: none
- Validation: validated
- Notes: Fund Payment mutation (114-line fund-payment.ts) with USDC ATA lookup, balance check. FundPaymentDialog in agreements-client. Build passes.

### R009 — Any party can trigger evaluate-and-release once conditions are met, moving funds from escrow to payee
- Class: primary-user-loop
- Status: validated
- Description: Any party can trigger evaluate-and-release once conditions are met, moving funds from escrow to payee
- Why it matters: The core settlement action
- Source: user
- Primary owning slice: M002/S03
- Supporting slices: none
- Validation: validated
- Notes: Release Payment mutation (188-line release-payment.ts) with nextConditionAccount logic. ReleasePaymentDialog wired. Build passes.

### R010 — Authority can cancel an active payment, returning escrowed funds to the payer
- Class: primary-user-loop
- Status: validated
- Description: Authority can cancel an active payment, returning escrowed funds to the payer
- Why it matters: Agreements can fail; funds must be recoverable
- Source: user
- Primary owning slice: M002/S03
- Supporting slices: none
- Validation: validated
- Notes: Cancel Payment mutation (101-line cancel-payment.ts) with CancelPaymentDialog. Build passes.

### R011 — Anyone can trigger the time crank for a payment condition once the unlock timestamp has passed
- Class: primary-user-loop
- Status: validated
- Description: Anyone can trigger the time crank for a payment condition once the unlock timestamp has passed
- Why it matters: Time conditions are permissionless — any party (or automation) can evaluate them
- Source: inferred
- Primary owning slice: M003/S01
- Supporting slices: none
- Validation: validated
- Notes: useCrankTime mutation hook wired into ConditionCard CrankAction with time-based visibility. Build passes.

### R012 — Users can trigger the oracle crank for a payment condition using a Pyth price feed
- Class: primary-user-loop
- Status: validated
- Description: Users can trigger the oracle crank for a payment condition using a Pyth price feed
- Why it matters: Oracle conditions require real-time price data to evaluate
- Source: user
- Primary owning slice: M003/S01
- Supporting slices: none
- Validation: validated
- Notes: useCrankOracle mutation with Pyth price display, staleness warning, byte-offset parsing (73-101). Build passes.

### R013 — Anyone can trigger the token gate crank to verify a holder's token balance meets the threshold
- Class: primary-user-loop
- Status: validated
- Description: Anyone can trigger the token gate crank to verify a holder's token balance meets the threshold
- Why it matters: Token gate conditions prove on-chain ownership without manual attestation
- Source: inferred
- Primary owning slice: M003/S01
- Supporting slices: none
- Validation: validated
- Notes: useCrankTokenGate mutation with ATA derivation for TOKEN_2022. Build passes.

### R014 — Registered signers can approve a multisig condition from the UI; threshold tracking is shown
- Class: primary-user-loop
- Status: validated
- Description: Registered signers can approve a multisig condition from the UI; threshold tracking is shown
- Why it matters: Multisig conditions require coordinated approvals from multiple parties
- Source: user
- Primary owning slice: M003/S02
- Supporting slices: none
- Validation: validated
- Notes: useSignMultisig hook, MultisigAction component with per-signer approval status, wallet-gated Approve button, error decoding for 6005/6006. Build passes.

### R015 — Registered relayers can submit webhook event hash confirmations from the UI
- Class: primary-user-loop
- Status: validated
- Description: Registered relayers can submit webhook event hash confirmations from the UI
- Why it matters: Webhook conditions require an off-chain oracle (relayer) to attest to events
- Source: user
- Primary owning slice: M003/S02
- Supporting slices: none
- Validation: validated
- Notes: useConfirmWebhook hook, WebhookAction component with 64-char hex input validation, wallet-gated Confirm button, error decoding for 6019/6020. Build passes.

### R016 — Admins can add or update wallet allowlist entries in the Token-2022 hook program
- Class: admin/support
- Status: validated
- Description: Admins can add or update wallet allowlist entries in the Token-2022 hook program
- Why it matters: The transfer hook blocks non-compliant wallets; admins must be able to manage the list
- Source: user
- Primary owning slice: M003/S03
- Supporting slices: none
- Validation: validated
- Notes: useSetCompliance mutation via hookProgram, Compliance page with lookup/set forms, PDA derivation, TransactionStatus feedback. Build passes.

### R017 — Relayer operators can register their pubkey and metadata in the app
- Class: admin/support
- Status: validated
- Description: Relayer operators can register their pubkey and metadata in the app
- Why it matters: The Relayers page needs to show which relayers are active and trusted
- Source: user
- Primary owning slice: M003/S03
- Supporting slices: none
- Validation: validated
- Notes: localStorage CRUD registry with SSR-safe guards, shape validation, duplicate prevention. Registration form with pubkey validation. Build passes.

### R022 — Every createPayment and createMilestonePayment test call passes metadata_uri; all existing test suites pass under `anchor test`
- Class: quality-attribute
- Status: validated
- Description: Every createPayment and createMilestonePayment test call passes metadata_uri; all existing test suites pass under `anchor test`
- Why it matters: The contract shape changed in M004 but tests were never updated — they will fail against the new program
- Source: execution
- Primary owning slice: M005/S01
- Supporting slices: none
- Validation: anchor test exits 0 with 33 passing; all 6 create call sites pass metadata_uri; IDL contains metadata_uri in 4 locations
- Notes: 5 createPayment calls and 1 createMilestonePayment call need metadata_uri as 4th arg

### R023 — A new test case creates a payment with an oracle condition, cranks it against the mock Pyth feed fixture, and verifies the condition is met
- Class: quality-attribute
- Status: validated
- Description: A new test case creates a payment with an oracle condition, cranks it against the mock Pyth feed fixture, and verifies the condition is met
- Why it matters: crank_oracle instruction has never been tested on-chain despite existing since M003
- Source: execution
- Primary owning slice: M005/S02
- Supporting slices: none
- Validation: anchor test passes with 6-test "Payment with Oracle Condition" block — crankOracle succeeds against mock Pyth feed, condition.met flips true, payment completes
- Notes: Mock Pyth fixture exists at fixtures/mock-pyth-feed.json; loaded into test validator via Anchor.toml

### R024 — A new test case creates a payment with a token-gate condition, cranks it with a holder that meets the balance threshold, and verifies the condition is met
- Class: quality-attribute
- Status: validated
- Description: A new test case creates a payment with a token-gate condition, cranks it with a holder that meets the balance threshold, and verifies the condition is met
- Why it matters: crank_token_gate instruction has never been tested on-chain despite existing since M003
- Source: execution
- Primary owning slice: M005/S02
- Supporting slices: none
- Validation: anchor test passes with 7-test "Payment with Token-Gate Condition" block — crankTokenGate succeeds with holder's 1000 tokens exceeding 100-token threshold, condition.met flips true, payment completes
- Notes: Needs a second Token-2022 mint for the gated token and a holder token account with sufficient balance

### R025 — The gherkin_pay program is deployed to devnet with the account layout that includes metadata_uri
- Class: operability
- Status: validated
- Description: The gherkin_pay program is deployed to devnet with the account layout that includes metadata_uri
- Why it matters: All frontend and crank bot functionality depends on the deployed program matching the IDL
- Source: execution
- Primary owning slice: M005/S03
- Supporting slices: none
- Validation: solana program show confirms program deployed at 2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV with 422944 bytes data length; types synced with 4 metadataUri fields; frontend builds clean
- Notes: Existing devnet payments will be inaccessible after redeploy due to layout change

### R027 — The condition builder's Oracle type includes FX currency pair presets (EUR/USD, GBP/USD, JPY/USD) using Pyth feed IDs, alongside existing crypto presets
- Class: differentiator
- Status: validated
- Description: The condition builder's Oracle type includes FX currency pair presets (EUR/USD, GBP/USD, JPY/USD) using Pyth feed IDs, alongside existing crypto presets
- Why it matters: Directly addresses Track 3 "integrated institutional on-chain FX venue" judging criteria
- Source: user
- Primary owning slice: M006/S01
- Supporting slices: none
- Validation: EUR/USD, GBP/USD, USD/JPY presets present in condition-builder.tsx with correct Pyth feed IDs and decimals. Category separators show Crypto and FX groupings. Hex feed IDs pass zod validation. Build passes clean.
- Notes: Uses Pyth pull-model feed IDs (hex format); same feed_id validation as crypto presets

### R028 — When cranking an oracle condition that uses a non-push-sponsored feed (FX pairs), the UI automatically fetches the latest price from Pyth Hermes, posts it as a PriceUpdateV2 account on Solana, then cranks the oracle condition — all in one user action
- Class: core-capability
- Status: validated
- Description: When cranking an oracle condition that uses a non-push-sponsored feed (FX pairs), the UI automatically fetches the latest price from Pyth Hermes, posts it as a PriceUpdateV2 account on Solana, then cranks the oracle condition — all in one user action
- Why it matters: FX feeds aren't on Pyth's Solana push-sponsored list; without the post step, the price data doesn't exist on-chain and the crank fails
- Source: user
- Primary owning slice: M006/S01
- Supporting slices: none
- Validation: usePostAndCrankOracle hook implements full Hermes fetch → PriceUpdateV2 post → crankOracle flow via PythSolanaReceiver SDK. Replaces old useCrankOracle for all oracle conditions. Stale price errors surface FX market guidance. Build passes clean. Runtime verification deferred to UAT.
- Notes: Uses @pythnetwork/pyth-solana-receiver SDK; PriceUpdateV2 accounts are ephemeral and can be closed after use

### R029 — The landing page includes a dedicated FX Oracle Settlement feature card highlighting cross-border FX settlement via Pyth FX rate feeds, and the stats bar reflects the expanded feed coverage
- Class: differentiator
- Status: validated
- Description: The landing page includes a dedicated FX Oracle Settlement feature card highlighting cross-border FX settlement via Pyth FX rate feeds, and the stats bar reflects the expanded feed coverage
- Why it matters: Surfaces FX capability prominently for hackathon judges evaluating institutional readiness
- Source: user
- Primary owning slice: M006/S02
- Supporting slices: none
- Validation: grep -c "FX" app/web/src/app/page.tsx returns 3 (card title, description, stats label); stats bar shows "6 Condition types" and "3 FX pairs"; bun run build exits 0
- Notes: New feature card in the existing features grid; stats bar update from "5 condition types" to reflect FX+crypto feed count

### R030 — The Next.js app builds cleanly and is deployed to the existing EC2 instance via the documented rsync procedure, serving the latest features at gherkinpay.lacertalabs.xyz
- Class: operability
- Status: validated
- Description: The Next.js app builds cleanly and is deployed to the existing EC2 instance via the documented rsync procedure, serving the latest features at gherkinpay.lacertalabs.xyz
- Why it matters: Judges need a live demo URL; local-only features don't count
- Source: user
- Primary owning slice: M006/S02
- Supporting slices: M007/S01
- Validation: rsync + remote npm install/build + systemctl restart completed; curl https://gherkinpay.lacertalabs.xyz returns HTTP 200; all M006 features (FX presets, post+crank, FX landing page card) live at demo URL
- Notes: Deploy procedure documented in infra/README.md; EC2 at 3.8.170.147, Nginx + systemd

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
- Notes: Deferred to post-M003; paste-address approach works. M006 partially addresses this with FX presets.

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
| R001 | primary-user-loop | validated | M001/S02 | none | validated |
| R002 | primary-user-loop | validated | M001/S03 | none | validated |
| R003 | primary-user-loop | validated | M001/S04 | none | validated |
| R004 | primary-user-loop | validated | M001/S05 | none | validated |
| R005 | primary-user-loop | validated | M001/S06 | none | validated |
| R006 | quality-attribute | validated | M001/S01 | M001/S02–S06, M002/S01–S03, M003/S01–S03 | validated |
| R007 | primary-user-loop | validated | M002/S01 | M002/S02 | validated |
| R008 | primary-user-loop | validated | M002/S02 | none | validated |
| R009 | primary-user-loop | validated | M002/S03 | none | validated |
| R010 | primary-user-loop | validated | M002/S03 | none | validated |
| R011 | primary-user-loop | validated | M003/S01 | none | validated |
| R012 | primary-user-loop | validated | M003/S01 | none | validated |
| R013 | primary-user-loop | validated | M003/S01 | none | validated |
| R014 | primary-user-loop | validated | M003/S02 | none | validated |
| R015 | primary-user-loop | validated | M003/S02 | none | validated |
| R016 | admin/support | validated | M003/S03 | none | validated |
| R017 | admin/support | validated | M003/S03 | none | validated |
| R018 | differentiator | deferred | none | none | unmapped |
| R019 | quality-attribute | deferred | none | none | unmapped |
| R020 | anti-feature | out-of-scope | none | none | n/a |
| R021 | constraint | out-of-scope | none | none | n/a |
| R022 | quality-attribute | validated | M005/S01 | none | anchor test exits 0 with 33 passing; all 6 create call sites pass metadata_uri; IDL contains metadata_uri in 4 locations |
| R023 | quality-attribute | validated | M005/S02 | none | anchor test passes with 6-test "Payment with Oracle Condition" block — crankOracle succeeds against mock Pyth feed, condition.met flips true, payment completes |
| R024 | quality-attribute | validated | M005/S02 | none | anchor test passes with 7-test "Payment with Token-Gate Condition" block — crankTokenGate succeeds with holder's 1000 tokens exceeding 100-token threshold, condition.met flips true, payment completes |
| R025 | operability | validated | M005/S03 | none | solana program show confirms program deployed at 2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV with 422944 bytes data length; types synced with 4 metadataUri fields; frontend builds clean |
| R026 | integration | active | M005/S03 | none | mapped |
| R027 | differentiator | validated | M006/S01 | none | EUR/USD, GBP/USD, USD/JPY presets present in condition-builder.tsx with correct Pyth feed IDs and decimals. Category separators show Crypto and FX groupings. Hex feed IDs pass zod validation. Build passes clean. |
| R028 | core-capability | validated | M006/S01 | none | usePostAndCrankOracle hook implements full Hermes fetch → PriceUpdateV2 post → crankOracle flow via PythSolanaReceiver SDK. Replaces old useCrankOracle for all oracle conditions. Stale price errors surface FX market guidance. Build passes clean. Runtime verification deferred to UAT. |
| R029 | differentiator | validated | M006/S02 | none | grep -c "FX" app/web/src/app/page.tsx returns 3 (card title, description, stats label); stats bar shows "6 Condition types" and "3 FX pairs"; bun run build exits 0 |
| R030 | operability | validated | M006/S02 | M007/S01 | rsync + remote npm install/build + systemctl restart completed; curl https://gherkinpay.lacertalabs.xyz returns HTTP 200; all M006 features (FX presets, post+crank, FX landing page card) live at demo URL |
| R031 | differentiator | active | M007/S01 | none | mapped |
| R032 | differentiator | active | M007/S01 | none | mapped |

## Coverage Summary

- Active requirements: 3
- Mapped to slices: 3
- Validated: 25 (R001, R002, R003, R004, R005, R006, R007, R008, R009, R010, R011, R012, R013, R014, R015, R016, R017, R022, R023, R024, R025, R027, R028, R029, R030)
- Unmapped active requirements: 0
