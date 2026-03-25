# M006: FX Oracle Settlement

**Gathered:** 2026-03-24
**Status:** Ready for planning

## Project Description

GherkinPay is a Solana escrow protocol for condition-gated stablecoin payments. M006 extends the existing oracle condition system to support FX currency pair presets, enabling "oracle-triggered FX settlement" — a payment that releases only when an FX rate condition is met.

## Why This Milestone

Track 3 of StableHacks 2026 explicitly mentions "integrated institutional on-chain FX venue." The oracle condition engine already supports Pyth price feeds for crypto assets. Adding FX pairs (EUR/USD, GBP/USD, JPY/USD) with a seamless post+crank flow demonstrates that GherkinPay handles real-world institutional FX settlement — a direct hit on the judging criteria with relatively low implementation effort.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Select EUR/USD, GBP/USD, or JPY/USD as oracle condition presets in the create payment wizard
- Click "Crank Oracle" on an FX oracle condition and have the system fetch the live FX rate from Pyth Hermes, post it on-chain, and evaluate the condition — all in one click
- See an "FX Oracle Settlement" feature card on the landing page at gherkinpay.lacertalabs.xyz

### Entry point / environment

- Entry point: https://gherkinpay.lacertalabs.xyz (and localhost:3000 for dev)
- Environment: Browser → Next.js → Solana Devnet
- Live dependencies involved: Pyth Hermes API (hermes.pyth.network), Solana Devnet RPC, EC2 instance

## Completion Class

- Contract complete means: no contract changes needed — existing crank_oracle instruction handles PriceUpdateV2 accounts from any feed
- Integration complete means: the post+crank flow works end-to-end on devnet using `@pythnetwork/pyth-solana-receiver` to post FX price data, then our crank_oracle instruction to evaluate it
- Operational complete means: the app is deployed to EC2 and the FX flow is accessible at the live URL

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- A payment with an EUR/USD oracle condition can be created via the wizard, and the "Crank Oracle" button successfully fetches the FX rate from Hermes, posts it on-chain, and evaluates the condition on devnet
- The landing page at gherkinpay.lacertalabs.xyz shows the FX Settlement feature card
- The app is deployed and running on EC2

## Risks and Unknowns

- **Pyth FX feed availability on devnet** — FX feeds (EUR/USD, GBP/USD, JPY/USD) are not on Pyth's Solana push-sponsored feed list. They use the pull model, meaning price data must be fetched from Hermes and posted on-chain. The Hermes API is universal (not chain-specific), but we haven't confirmed FX feed IDs are served on it. This is the key risk — if Hermes doesn't serve FX feeds, we'd need to use a different data source or use crypto feeds as a fallback demonstration.
- **Transaction composition** — Composing a Pyth price post + our crank_oracle instruction in one transaction (or transaction set) using `@pythnetwork/pyth-solana-receiver`'s `PythSolanaReceiver` class hasn't been tested with our Anchor program. The SDK uses versioned transactions and ephemeral signers, which may complicate integration.
- **Staleness on devnet** — FX markets have trading hours. Outside market hours, FX price data may be stale (>60s), which our contract rejects. The crank may fail during off-hours.

## Existing Codebase / Prior Art

- `app/web/src/components/condition-builder.tsx` — Oracle presets array (`ORACLE_PRESETS`) with 4 crypto feeds; FX feeds are added here
- `app/web/src/components/condition-card.tsx` — Oracle crank button and price display; post+crank logic integrates here
- `app/web/src/lib/mutations/crank-oracle.ts` — Current crank oracle mutation; needs to handle post+crank when feed isn't push-sponsored
- `programs/gherkin-pay/src/instructions/crank_oracle.rs` — On-chain oracle handler; already reads PriceUpdateV2 at byte offsets 73-101, validates feed_id, checks staleness (60s)
- `app/web/src/app/page.tsx` — Landing page with features grid and stats bar
- `infra/README.md` — EC2 deploy procedure (rsync + systemd restart)
- `scripts/crank-bot.ts` — Existing crank bot; may need FX feed support later

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R027 — FX oracle presets in condition builder (primary)
- R028 — Post+crank flow for non-push-sponsored feeds (primary)
- R029 — Landing page FX feature card (primary)
- R030 — EC2 deploy (primary)

## Scope

### In Scope

- FX oracle presets (EUR/USD, GBP/USD, JPY/USD) in the condition builder
- Post+crank flow using `@pythnetwork/pyth-solana-receiver` for pull-model feeds
- Landing page FX Settlement feature card and stats update
- Build and deploy to EC2

### Out of Scope / Non-Goals

- Smart contract changes (existing crank_oracle handles PriceUpdateV2 from any feed)
- Crank bot FX support (the bot uses the same on-chain mechanism; adding FX feeds to the bot is out of scope for this milestone)
- Cross-currency escrow (pay in USDC, receive in USDT) — this would need contract changes
- FX feed browser/search UI (R018 remains deferred)

## Technical Constraints

- Pyth FX feeds use pull model — must use Hermes API + PriceUpdateV2 posting, not direct account reads
- The `@pythnetwork/pyth-solana-receiver` SDK requires versioned transactions and may use ephemeral signers
- FX market hours may cause staleness failures outside trading hours — the UI should handle this gracefully
- The condition builder stores feed IDs as hex strings (Pyth feed ID format), not base58 pubkeys
- EC2 deploy uses npm (not bun) for `npm install --legacy-peer-deps` on server

## Integration Points

- **Pyth Hermes API** — `https://hermes.pyth.network/v2/updates/price/latest?ids[]=<feedId>` for fetching latest FX price data
- **@pythnetwork/pyth-solana-receiver** — SDK for posting price updates to Solana and deriving PriceUpdateV2 account addresses
- **Solana Devnet** — Target network for all transactions
- **EC2 (gherkinpay.lacertalabs.xyz)** — Production deploy target

## Open Questions

- **FX feed IDs** — Need to confirm exact Pyth feed IDs for EUR/USD, GBP/USD, JPY/USD from Hermes API — fetching from `https://hermes.pyth.network/v2/price_feeds?query=EUR/USD&asset_type=fx` during research/planning phase
- **Market hours handling** — Should the UI disable the crank button during off-hours, or let it fail with a clear error? Current thinking: let it attempt and show a clear "Price data stale — FX market may be closed" message on failure
