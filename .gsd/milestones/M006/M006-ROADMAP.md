# M006: FX Oracle Settlement

**Vision:** Extend GherkinPay's oracle condition engine with FX currency pair presets and a seamless post+crank flow, enabling oracle-triggered FX settlement on Solana using Pyth pull-model feeds. Update the landing page to highlight FX settlement as a key institutional capability. Deploy to production.

## Success Criteria

- User can select EUR/USD, GBP/USD, or JPY/USD as oracle condition presets in the create payment wizard
- Clicking "Crank Oracle" on an FX condition fetches the live FX rate from Pyth Hermes, posts it on-chain as a PriceUpdateV2 account, and evaluates the oracle condition — all in one user action
- The landing page at gherkinpay.lacertalabs.xyz features an FX Oracle Settlement card
- The app is deployed and running on EC2 with all M006 features live

## Key Risks / Unknowns

- **Pyth FX feed availability** — FX feeds aren't push-sponsored on Solana; they must be fetched via Hermes pull model. If Hermes doesn't serve FX feeds, the demo falls back to reframing crypto feeds as "cross-asset oracle settlement."
- **Transaction composition** — The `@pythnetwork/pyth-solana-receiver` SDK's transaction builder + our Anchor crank instruction haven't been composed together. Versioned transactions and ephemeral signers may complicate integration.
- **FX market hours** — Outside trading hours, FX prices may be stale (>60s), causing the contract's staleness check to reject the crank.

## Proof Strategy

- Pyth FX feed availability → retire in S01 by confirming Hermes serves EUR/USD feed data and the price can be posted to devnet
- Transaction composition → retire in S01 by proving PythSolanaReceiver + crank_oracle compose into a working transaction on devnet
- FX market hours → retire in S01 by testing during market hours and implementing graceful error handling for stale prices

## Verification Classes

- Contract verification: none — no contract changes
- Integration verification: post+crank flow works on devnet with a real FX feed from Hermes
- Operational verification: app deployed to EC2, landing page accessible, FX presets visible
- UAT / human verification: judge-perspective walkthrough of creating an FX-conditioned payment and cranking it

## Milestone Definition of Done

This milestone is complete only when all are true:

- FX oracle presets appear in condition builder alongside existing crypto presets
- Post+crank flow successfully evaluates an FX oracle condition on devnet
- Landing page shows FX Settlement feature card with updated stats
- App is deployed and running at gherkinpay.lacertalabs.xyz with all M006 features
- Build passes clean (`bun run build` exits 0)

## Requirement Coverage

- Covers: R027, R028, R029, R030
- Partially covers: none
- Leaves for later: R031, R032 (M007)
- Orphan risks: none

## Slices

- [x] **S01: FX Oracle Post+Crank** `risk:high` `depends:[]`
  > After this: user creates a payment with an EUR/USD oracle condition, clicks "Crank Oracle," and GherkinPay fetches the FX rate from Pyth Hermes, posts it on-chain, and evaluates the condition — proven on devnet.

- [x] **S02: Landing Page FX Framing & Deploy** `risk:low` `depends:[S01]`
  > After this: landing page at gherkinpay.lacertalabs.xyz shows FX Settlement feature card; all M006 features deployed and accessible at the live URL.

## Boundary Map

### S01 → S02

Produces:
- `ORACLE_PRESETS` array in `condition-builder.tsx` updated with EUR/USD, GBP/USD, JPY/USD feed IDs
- `usePostAndCrankOracle` hook (or enhanced `useCrankOracle`) that handles Hermes fetch → PriceUpdateV2 post → crank_oracle for pull-model feeds
- `@pythnetwork/pyth-solana-receiver` integrated as a dependency in `app/web/package.json`
- FX feeds working on devnet — the full post+crank flow is proven

Consumes:
- nothing (first slice)

### S02

Produces:
- Updated `features` array in `app/web/src/app/page.tsx` with FX Settlement card
- Updated stats bar reflecting FX+crypto feed coverage
- Deployed build on EC2 at gherkinpay.lacertalabs.xyz

Consumes from S01:
- FX presets in condition builder (must be present for deploy to include them)
- Post+crank mutation (must be working for deployed app to demonstrate FX flow)
