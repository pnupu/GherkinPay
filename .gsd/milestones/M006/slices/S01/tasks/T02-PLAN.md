---
estimated_steps: 5
estimated_files: 5
skills_used: []
---

# T02: Build post+crank oracle hook and wire into condition card

**Slice:** S01 — FX Oracle Post+Crank
**Milestone:** M006

## Description

FX oracle feeds (EUR/USD, GBP/USD, USD/JPY) are not push-sponsored on Solana — no PriceUpdateV2 account exists on-chain until we post one. The current `useCrankOracle` hook assumes the price account already exists. This task builds a new `usePostAndCrankOracle` hook that: (1) fetches the latest price from Pyth Hermes, (2) posts it as a PriceUpdateV2 account via `@pythnetwork/pyth-solana-receiver`, (3) cranks the oracle condition — all in one user action. It replaces the existing crank-oracle usage in the condition card and also updates the oracle price display to fetch from Hermes instead of trying to read a non-existent on-chain account.

## Steps

1. **Install Pyth SDK dependencies** — Run `cd app/web && bun add @pythnetwork/pyth-solana-receiver @pythnetwork/hermes-client`. These provide the transaction builder for posting price updates and the Hermes HTTP client for fetching pull-model price data.

2. **Create `app/web/src/lib/mutations/post-and-crank-oracle.ts`** — Implement `usePostAndCrankOracle()` hook:
   - Accept params: `{ paymentPubkey: PublicKey, conditionAccountPubkey: PublicKey, conditionIndex: number, feedAccount: PublicKey }` where `feedAccount` is the on-chain Pubkey that stores the hex feed ID bytes.
   - Extract the hex feed ID: `const feedIdHex = Buffer.from(feedAccount.toBytes()).toString('hex');`
   - Create `HermesClient` pointing to `https://hermes.pyth.network`.
   - Call `hermesClient.getLatestPriceUpdates(["0x" + feedIdHex])` to get the VAA data (the Hermes API expects `0x`-prefixed IDs).
   - Create `PythSolanaReceiver` with `{ connection, wallet }` from `useAnchorWallet()` and `useConnection()`.
   - Build transaction: `pythSolanaReceiver.newTransactionBuilder({ closeUpdateAccounts: false })`.
   - Call `transactionBuilder.addPostPriceUpdates(priceUpdateData)` — this returns the posted account addresses.
   - Call `transactionBuilder.addPriceConsumerInstructions(async (getPriceUpdateAccount) => { ... })` — inside the callback, get the PriceUpdateV2 account address for our feed using `getPriceUpdateAccount(feedIdHex)`, then build the `crankOracle` Anchor instruction using `program.methods.crankOracle(conditionIndex).accounts({ payment, conditionAccount, priceFeed: priceUpdateAccount }).instruction()`.
   - Build and send: `const txs = await transactionBuilder.buildVersionedTransactions({ tightComputeBudget: true })`. Then `await pythSolanaReceiver.provider.sendAll(txs.map(({ tx, signers }) => ({ tx, signers })))`.
   - Log: `console.log("[GherkinPay] Post+crank oracle: feedId=..., txs=...")`.
   - Return the last transaction signature.
   - **Error handling**: Catch Hermes fetch errors separately from on-chain errors. For Hermes failures, throw with message "Unable to fetch FX rate from Pyth — the market may be closed or the feed unavailable." For on-chain errors, use `decodeAnchorError()`.
   - Invalidate conditions query on success (same pattern as existing `useCrankOracle`).

3. **Wire into condition-card.tsx CrankAction** — Replace the `useCrankOracle` import/usage in the `CrankAction` component with `usePostAndCrankOracle`. The oracle branch should call `postAndCrankOracle.mutate({ paymentPubkey, conditionAccountPubkey, conditionIndex, feedAccount: new PublicKey(data.feedAccount) })`. Update `activeMutation` mapping for oracle type. Keep the crank-oracle.ts file for its `parsePythPrice` and `isPriceStale` utility exports (still used by price display). Remove the `useCrankOracle` import from condition-card.tsx.

4. **Rewrite `useOraclePrice` in condition-card.tsx** — Replace the on-chain `getAccountInfo` approach with a Hermes fetch:
   - Convert the base58 feedAccount back to hex: `const feedIdHex = Buffer.from(new PublicKey(feedAccount).toBytes()).toString('hex');`
   - Create a `HermesClient` and call `getLatestPriceUpdates(["0x" + feedIdHex])`.
   - Parse the response: `parsed[0].price.price` and `parsed[0].price.expo` give the price and exponent.
   - Compute scaled price: `Number(parsed[0].price.price) * Math.pow(10, parsed[0].price.expo)`.
   - Check staleness: compare `parsed[0].price.publish_time` against current time, stale if > 60s old.
   - Keep the same return shape `{ price, stale }`.

5. **Build and verify** — Run `cd app/web && bun run build` to confirm clean compilation. Check that `crank-oracle.ts` still exports its utility functions (parsePythPrice, isPriceStale) since they may be used elsewhere. Verify no TypeScript errors from the new Pyth SDK types.

## Must-Haves

- [ ] `@pythnetwork/pyth-solana-receiver` and `@pythnetwork/hermes-client` installed in app/web
- [ ] `usePostAndCrankOracle` hook handles Hermes fetch → PriceUpdateV2 post → crankOracle in one flow
- [ ] "Crank Oracle" button in condition-card uses `usePostAndCrankOracle`
- [ ] `useOraclePrice` fetches from Hermes instead of on-chain getAccountInfo
- [ ] Hermes errors surface as user-readable messages (including FX market hours guidance)
- [ ] Crank button disabled during pending mutation
- [ ] `closeUpdateAccounts` set to `false` in the transaction builder
- [ ] `bun run build` exits 0

## Verification

- `cd app/web && bun run build` exits 0
- `grep -q "pyth-solana-receiver" app/web/package.json && echo "OK"` returns OK
- `grep -q "hermes-client" app/web/package.json && echo "OK"` returns OK
- `test -f app/web/src/lib/mutations/post-and-crank-oracle.ts && echo "OK"` returns OK
- `grep -q "usePostAndCrankOracle" app/web/src/components/condition-card.tsx && echo "OK"` returns OK
- `grep -q "HermesClient" app/web/src/components/condition-card.tsx && echo "OK"` returns OK (Hermes price fetch in useOraclePrice)

## Observability Impact

- Signals added/changed: `[GherkinPay] Post+crank oracle` console log with feed ID, transaction signatures, and error details. Hermes fetch failures logged separately from on-chain errors.
- How a future agent inspects this: Browser DevTools console — filter for `[GherkinPay]`. TransactionStatus component renders tx hash or error inline in the condition card.
- Failure state exposed: Hermes unreachable → "Unable to fetch FX rate" message in TransactionStatus. Stale price → "FX market may be closed" guidance. Anchor program error → decoded error name and message via `decodeAnchorError`.

## Inputs

- `app/web/src/components/condition-builder.tsx` — T01 output: ORACLE_PRESETS with hex feed IDs (no 0x prefix), updated schema accepting hex
- `app/web/src/components/create-payment-wizard.tsx` — T01 output: toConditionInput() with hex→PublicKey conversion
- `app/web/src/lib/mutations/crank-oracle.ts` — Existing hook and utility functions (parsePythPrice, isPriceStale)
- `app/web/src/components/condition-card.tsx` — Existing CrankAction and useOraclePrice to be updated
- `app/web/src/lib/anchor.ts` — useAnchorProgram() providing program, provider, connection
- `app/web/src/lib/queries/conditions.ts` — OracleData type with feedAccount as base58 string

## Expected Output

- `app/web/package.json` — Updated with @pythnetwork/pyth-solana-receiver and @pythnetwork/hermes-client dependencies
- `app/web/src/lib/mutations/post-and-crank-oracle.ts` — New file: usePostAndCrankOracle hook
- `app/web/src/components/condition-card.tsx` — Updated: CrankAction uses postAndCrank, useOraclePrice uses Hermes
- `app/web/src/lib/mutations/crank-oracle.ts` — Retained for utility exports (parsePythPrice, isPriceStale)
