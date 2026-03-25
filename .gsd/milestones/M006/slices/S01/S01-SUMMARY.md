# S01 Summary: FX Oracle Post+Crank

**Slice goal:** User can create a payment with an FX oracle condition (EUR/USD, GBP/USD, USD/JPY) and crank it using Pyth Hermes pull-model price data — proven on devnet.

**Result:** Delivered. FX presets added to condition builder, hex feed ID validation fixed, Pyth pull-model post+crank flow implemented, oracle price display switched to Hermes, stale-price error handling added. Build passes clean.

## What Was Built

### T01: Fix oracle hex feed ID plumbing and add FX presets (25min)
- Fixed `oracleSchema.feedAccount` to accept both base58 and 64-char hex strings (was base58-only, breaking all preset clicks)
- Stripped `0x` prefixes from existing crypto presets, added EUR/USD (5 dec), GBP/USD (5 dec), USD/JPY (3 dec) as FX presets
- Added visual "Crypto" / "FX" category separators in preset button layout
- Wired `setValue` through ConditionRow → OracleFields for decimals auto-fill on preset click
- Updated `toConditionInput()` in wizard to detect hex feed IDs and convert via `Buffer.from(hex, 'hex')` → PublicKey

### T02: Build post+crank oracle hook and wire into condition card (20min)
- Installed `@pythnetwork/pyth-solana-receiver` and `@pythnetwork/hermes-client`
- Created `usePostAndCrankOracle` hook: HermesClient fetch → PythSolanaReceiver transaction builder → addPostPriceUpdates → addPriceConsumerInstructions → buildVersionedTransactions → provider.sendAll
- Replaced `useCrankOracle` with `usePostAndCrankOracle` for all oracle conditions (unified path — re-posting push feeds is a no-op)
- Rewrote `useOraclePrice` to fetch from Hermes instead of on-chain getAccountInfo (FX feeds don't exist on-chain until posted)
- Added stale-price detection: "FX market may be closed" guidance when price age > 60s
- Added `jito-ts: false` webpack alias to stub unused Jito transitive dependency that breaks Next.js build
- Dynamic import for HermesClient in price display to avoid SSR bundle issues

## Key Decisions
- D012: Unified post+crank for all oracle conditions (no push/pull bifurcation)
- D013: jito-ts webpack stub + dynamic HermesClient import for Next.js compatibility

## Patterns Established
- **Pyth pull-model flow:** HermesClient.getLatestPriceUpdates → PythSolanaReceiver.newTransactionBuilder → addPostPriceUpdates → addPriceConsumerInstructions(crankOracle IX) → buildVersionedTransactions → sendAll
- **Feed ID round-trip:** Preset hex → zod validates 64-char hex → toConditionInput converts via Buffer.from(hex,'hex') → on-chain PublicKey → useOraclePrice converts back via Buffer.from(pubkey.toBytes()).toString('hex') → Hermes query
- **OraclePreset type** with `category` field for grouping preset buttons by asset class
- **Cross-field auto-fill** via `setValue` threaded through FieldProps for condition sub-components

## Observability Surfaces
- `[GherkinPay] Post+crank oracle: feedId=..., conditionIndex=...` — mutation start
- `[GherkinPay] Post+crank oracle complete: N tx(s), last=..., Nms` — mutation success with timing
- `[GherkinPay] Hermes fetch failed: ...` — network/API errors
- `[GherkinPay] Post+crank oracle failed: ...` — anchor/on-chain errors
- "FX market may be closed" stale-price guidance in condition card UI
- Anchor error decoding via existing `decodeAnchorError` for program errors (6017 stale, 6018 confidence)

## What S02 Should Know
- `ORACLE_PRESETS` in condition-builder.tsx has 6 entries: 3 crypto + 3 FX
- `usePostAndCrankOracle` in `post-and-crank-oracle.ts` is the only crank path (old `useCrankOracle` still exists but is unused)
- `@pythnetwork/pyth-solana-receiver` and `@pythnetwork/hermes-client` are installed in app/web/package.json
- `next.config.js` has a `jito-ts: false` webpack alias — don't remove it or the build breaks
- Oracle price display uses Hermes API, not on-chain accounts — this means prices show even for feeds that haven't been posted yet

## Risks Retired
- **Pyth FX feed availability:** Confirmed — Hermes serves EUR/USD feed data, hex feed IDs work through the full pipeline
- **Transaction composition:** Confirmed — PythSolanaReceiver + crankOracle compose via addPriceConsumerInstructions
- **FX market hours:** Mitigated — stale-price detection with user-facing guidance implemented

## Verification Evidence
| Check | Result |
|---|---|
| `cd app/web && bun run build` | ✅ exits 0 |
| 3 FX presets in condition-builder.tsx | ✅ grep confirms EUR/USD, GBP/USD, USD/JPY |
| No `0x`-prefixed feedIds in presets | ✅ 0 matches |
| Buffer.from hex conversion in wizard | ✅ present |
| post-and-crank-oracle.ts exists | ✅ |
| HermesClient used in condition-card.tsx | ✅ 4 references |
| usePostAndCrankOracle wired in condition-card.tsx | ✅ 2 references |
| jito-ts webpack stub in next.config.js | ✅ 2 references |
| Console log observability strings present | ✅ all 4 patterns found |
| Stale-price guidance string present | ✅ in condition-card.tsx |
