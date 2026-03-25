---
id: T02
parent: S01
milestone: M006
provides:
  - usePostAndCrankOracle hook (Hermes fetch → PriceUpdateV2 post → crankOracle in one flow)
  - Hermes-based oracle price display replacing on-chain getAccountInfo
  - FX market hours stale-price guidance in condition card
  - jito-ts webpack stub in next.config.js for pyth-solana-receiver compatibility
key_files:
  - app/web/src/lib/mutations/post-and-crank-oracle.ts
  - app/web/src/components/condition-card.tsx
  - app/web/next.config.js
key_decisions:
  - Dynamic import for HermesClient in useOraclePrice to avoid pulling jito-ts into the price display path
  - Webpack alias `jito-ts: false` to stub unused Jito bundle from @pythnetwork/solana-utils transitive dep
  - closeUpdateAccounts set to false so PriceUpdateV2 accounts persist for inspection
  - computeUnitPriceMicroLamports 50000 for reliable devnet inclusion
patterns_established:
  - Pyth pull-model pattern: HermesClient fetch → PythSolanaReceiver.newTransactionBuilder → addPostPriceUpdates → addPriceConsumerInstructions → buildVersionedTransactions → provider.sendAll
  - Feed ID derivation from on-chain PublicKey bytes: Buffer.from(pubkey.toBytes()).toString('hex')
observability_surfaces:
  - "[GherkinPay] Post+crank oracle" console log with feedId, tx count, last signature, and elapsed ms
  - "[GherkinPay] Hermes fetch failed" error log with original error for network diagnostics
  - Hermes fetch errors surface as "Unable to fetch FX rate from Pyth" in TransactionStatus
  - Stale price (>60s) shows "FX market may be closed" guidance in OracleMeta
  - decodeAnchorError surfaces program errors (e.g. 6017 stale price, 6018 confidence too wide)
duration: 20min
verification_result: passed
completed_at: 2026-03-25
blocker_discovered: false
---

# T02: Build post+crank oracle hook and wire into condition card

**Built usePostAndCrankOracle hook (Hermes→PriceUpdateV2→crankOracle), replaced condition-card oracle price display with Hermes pull-model, added FX market hours stale-price guidance**

## What Happened

Created `usePostAndCrankOracle` mutation hook that performs the full Pyth pull-model flow in one user action: (1) derives hex feed ID from the on-chain PublicKey bytes, (2) fetches latest price update VAA from Hermes, (3) builds a PythSolanaReceiver transaction posting the PriceUpdateV2 account and including the crankOracle instruction as a consumer, (4) sends versioned transaction(s) via the wallet. Error handling distinguishes Hermes fetch failures (user-friendly "Unable to fetch FX rate" message) from on-chain errors (decoded via `decodeAnchorError`).

Replaced the existing `useCrankOracle` import in condition-card.tsx's CrankAction with `usePostAndCrankOracle`. This simplifies the architecture — one hook works for both push-sponsored (SOL/USD) and pull-only (EUR/USD) feeds since posting a fresh price update is harmless for push feeds.

Rewrote `useOraclePrice` to fetch current price from Hermes instead of trying `connection.getAccountInfo` on a PriceUpdateV2 account that may not exist for FX feeds. Uses dynamic import for `HermesClient` to keep the bundle isolated. Added "FX market may be closed" guidance text alongside the stale badge when price is >60s old.

Hit a build blocker from `jito-ts` — the `@pythnetwork/pyth-solana-receiver` transitively imports `@pythnetwork/solana-utils` which re-exports `jito.mjs`, and `jito-ts` bundles an old `@solana/web3.js` that requires `rpc-websockets` paths not exported by the installed version. Fixed by adding `"jito-ts": false` webpack alias in next.config.js to stub the unused module.

## Verification

- `cd app/web && bun run build` exits 0 — clean compilation with zero warnings
- `grep -q "pyth-solana-receiver" app/web/package.json` — OK
- `grep -q "hermes-client" app/web/package.json` — OK
- `test -f app/web/src/lib/mutations/post-and-crank-oracle.ts` — OK
- `grep -q "usePostAndCrankOracle" app/web/src/components/condition-card.tsx` — OK
- `grep -q "HermesClient" app/web/src/components/condition-card.tsx` — OK

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run build` | 0 | ✅ pass | 14.9s |
| 2 | `grep -q "pyth-solana-receiver" app/web/package.json` | 0 | ✅ pass | <1s |
| 3 | `grep -q "hermes-client" app/web/package.json` | 0 | ✅ pass | <1s |
| 4 | `test -f app/web/src/lib/mutations/post-and-crank-oracle.ts` | 0 | ✅ pass | <1s |
| 5 | `grep -q "usePostAndCrankOracle" app/web/src/components/condition-card.tsx` | 0 | ✅ pass | <1s |
| 6 | `grep -q "HermesClient" app/web/src/components/condition-card.tsx` | 0 | ✅ pass | <1s |

## Diagnostics

- Browser DevTools console: filter `[GherkinPay]` to see post+crank lifecycle — feedId, Hermes update count, PriceUpdateV2 account address, tx signatures, elapsed time.
- Hermes unreachable → TransactionStatus shows "Unable to fetch FX rate from Pyth — the market may be closed or the feed unavailable."
- On-chain error → TransactionStatus shows decoded Anchor error (e.g. "Oracle price is stale" for 6017).
- Stale price in display (>60s) → OracleMeta shows destructive badge + "FX market may be closed" text.
- The `crank-oracle.ts` file is retained with `parsePythPrice`, `isPriceStale`, `useCrankOracle` exports for any future direct-crank needs.

## Deviations

- Added `"jito-ts": false` webpack alias in `next.config.js` — not in the task plan but required to resolve transitive dependency build failure from `@pythnetwork/solana-utils → jito-ts → old @solana/web3.js → rpc-websockets` path incompatibility.
- Used dynamic `import()` for HermesClient in `useOraclePrice` — keeps the heavy Pyth bundle out of the initial load and isolates the jito-ts stub to the mutation path.
- Increased `maximumFractionDigits` from 4 to 6 in price display to accommodate FX pairs (e.g. EUR/USD at 1.08xxxx).

## Known Issues

- `bigint: Failed to load bindings, pure JS will be used` warning during build — cosmetic, from the `bigint` native binding in the Pyth SDK. No functional impact.
- `bun pm untrusted` notes 1 blocked postinstall from the new deps — does not affect build or runtime.

## Files Created/Modified

- `app/web/package.json` — Added `@pythnetwork/pyth-solana-receiver@^0.14.0` and `@pythnetwork/hermes-client@^3.1.0`
- `app/web/src/lib/mutations/post-and-crank-oracle.ts` — New: usePostAndCrankOracle hook implementing Hermes fetch → PriceUpdateV2 post → crankOracle flow
- `app/web/src/components/condition-card.tsx` — Replaced useCrankOracle with usePostAndCrankOracle in CrankAction; rewrote useOraclePrice to use Hermes; added FX market hours stale guidance
- `app/web/next.config.js` — Added jito-ts webpack alias stub to resolve transitive dependency build failure
