# S01: FX Oracle Post+Crank — Research

**Date:** 2026-03-25

## Summary

All three FX feeds are available on Pyth Hermes and return live price data. EUR/USD (`a995d00b...`, expo=-5), GBP/USD (`84c2dde9...`, expo=-5), and USD/JPY (`ef2c98c8...`, expo=-3) all return fresh prices during market hours. The feed ID for JPY is actually USD/JPY (not JPY/USD) — the preset label should reflect this.

The core implementation is composing a Pyth PriceUpdateV2 post + our existing `crank_oracle` instruction into a single user action. The `@pythnetwork/pyth-solana-receiver` SDK provides `PythSolanaReceiver.newTransactionBuilder()` which handles this composition: post the price update, then in `addPriceConsumerInstructions`, include our Anchor crank instruction using the PDA address from `getPriceUpdateAccount(feedId)`. This is a proven SDK pattern — no novel transaction composition needed.

A pre-existing bug blocks the presets: the `ORACLE_PRESETS` array stores Pyth hex feed IDs (`0xef0d...`), but the zod validator requires base58 `PublicKey` strings. Clicking any preset currently fails validation. This must be fixed as part of the FX work — the condition builder needs hex-to-PublicKey conversion and the validator needs to accept hex feed IDs.

## Recommendation

Build in three tasks: (1) Fix the oracle preset + hex feed ID plumbing in the condition builder, wizard, and zod schema. (2) Add FX presets to `ORACLE_PRESETS`. (3) Build the post+crank hook using `@pythnetwork/pyth-solana-receiver` + `@pythnetwork/hermes-client`, wire it into the "Crank Oracle" button. Start with the preset/validation fix since it's needed for both crypto and FX flows, then add FX presets, then implement the post+crank hook last (highest risk, needs working presets to test).

## Implementation Landscape

### Key Files

- `app/web/src/components/condition-builder.tsx` — Contains `ORACLE_PRESETS` array (line ~180) with 4 crypto + Custom. FX presets (EUR/USD, GBP/USD, USD/JPY) go here. Also needs zod schema fix: `oracleSchema.feedAccount` uses `publicKeyString` validator which rejects hex feed IDs. The `OracleFields` component renders the preset buttons and sets `feedAccount` to the raw hex string.
- `app/web/src/components/create-payment-wizard.tsx` — `toOnChainCondition()` (line ~92) does `new PublicKey(c.feedAccount)` which fails on hex strings. Needs hex-to-PublicKey conversion: `new PublicKey(Buffer.from(hexStr.replace(/^0x/, ''), 'hex'))`.
- `app/web/src/lib/mutations/crank-oracle.ts` — Current mutation calls `crankOracle(conditionIndex)` passing `priceFeed` as a regular account. For FX feeds (non-push-sponsored), needs a new code path that first posts the price update via `PythSolanaReceiver`, then cranks in the same transaction. The existing mutation stays for push-sponsored feeds where PriceUpdateV2 already exists on-chain.
- `app/web/src/components/condition-card.tsx` — The "Crank Oracle" button (in `CrankAction`) calls `crankOracle.mutate()`. For FX feeds, this needs to call the new post+crank hook instead. Needs a way to determine whether a feed is push-sponsored or pull-only (simplest: maintain a set of known pull-only feed IDs, or always use post+crank for all feeds).
- `app/web/src/lib/queries/conditions.ts` — `parseCondition()` for oracle type reads `feedAccount` as `.toBase58()`. This works — the on-chain Pubkey that stores the hex feed ID bytes will serialize to base58 correctly. But `useOraclePrice()` in condition-card.tsx tries `connection.getAccountInfo(new PublicKey(feedAccount))` which reads from a push-sponsored on-chain account — this won't work for FX feeds where no on-chain account exists until we post one. The price display for FX should fetch from Hermes instead.
- `app/web/package.json` — Needs new dependencies: `@pythnetwork/pyth-solana-receiver` and `@pythnetwork/hermes-client`.
- `app/web/src/lib/anchor.ts` — `useAnchorProgram()` returns `{ program, hookProgram, connection, provider }`. The `provider` (AnchorProvider) has `.connection` and `.wallet` needed for `PythSolanaReceiver` constructor.

### Confirmed FX Feed IDs

| Pair | Pyth Feed ID (hex, no 0x prefix) | Expo | Decimals |
|------|----------------------------------|------|----------|
| EUR/USD | `a995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b` | -5 | 5 |
| GBP/USD | `84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7c1` | -5 | 5 |
| USD/JPY | `ef2c98c804ba503c6a707e38be4dfbb16683775f195b091252bf24693042fd52` | -3 | 3 |

### Build Order

1. **Fix oracle preset hex plumbing** — Update zod schema to accept 64-char hex strings (with or without `0x`), update `toOnChainCondition()` to convert hex→PublicKey via `Buffer.from()`, update `ORACLE_PRESETS` to use consistent format. This fixes the pre-existing bug and unblocks everything else.

2. **Add FX presets** — Append EUR/USD, GBP/USD, USD/JPY to `ORACLE_PRESETS` with their feed IDs and correct decimals. Add a visual separator or label to distinguish "Crypto" from "FX" presets in the UI.

3. **Build post+crank hook** — New file `app/web/src/lib/mutations/post-and-crank-oracle.ts` implementing `usePostAndCrankOracle()`. Uses `@pythnetwork/hermes-client` to fetch price update data from Hermes, then `@pythnetwork/pyth-solana-receiver` `TransactionBuilder` to post + crank in one flow. Wire into condition-card.tsx's "Crank Oracle" button.

4. **Update oracle price display** — Modify `useOraclePrice()` in condition-card.tsx to fetch from Hermes for pull-only feeds instead of trying to read a non-existent on-chain account.

### Verification Approach

- **Preset validation**: In the browser, select Oracle condition type, click each FX preset, verify the feedAccount field populates and the form validates (no red error). Submit with a known wallet.
- **Post+crank flow on devnet**: Create a payment with an EUR/USD oracle condition (e.g., EUR/USD > 1.10), fund it, click "Crank Oracle", verify the transaction succeeds and condition evaluates to met (since EUR/USD ≈ 1.16 > 1.10).
- **Build clean**: `cd app/web && bun run build` exits 0.
- **Staleness handling**: Test during market hours (any weekday during FX trading hours). Error message should surface if price is stale (>60s).

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Fetching Pyth price data from Hermes | `@pythnetwork/hermes-client` `HermesClient.getLatestPriceUpdates()` | Handles encoding, response parsing, error handling. Direct HTTP fetch would need manual parsing of the binary format. |
| Posting PriceUpdateV2 to Solana | `@pythnetwork/pyth-solana-receiver` `PythSolanaReceiver.newTransactionBuilder()` | Handles PDA derivation, versioned transactions, ephemeral signers, compute budget. Manual construction would be fragile and version-dependent. |
| Composing post + consumer instructions | `TransactionBuilder.addPriceConsumerInstructions()` | The SDK packs post + consumer into optimal transaction batches. Hand-rolling versioned tx composition with ephemeral signers is error-prone. |

## Constraints

- **Hex feed ID stored as Pubkey on-chain**: The Anchor `Condition::Oracle.feed_account` is a `Pubkey` (32 bytes). Pyth feed IDs are also 32 bytes. The on-chain program stores the raw hex feed ID bytes in the Pubkey field and compares with `feed_id == feed_account.to_bytes()`. This means the "feed account" in the oracle condition is NOT a real Solana account — it's a Pyth feed ID packed into a Pubkey. The conversion is: `new PublicKey(Buffer.from(hexFeedId, 'hex'))`.
- **FX feeds are pull-only**: Unlike SOL/USD or BTC/USD, FX price data does NOT exist on-chain unless we post it. The existing `useCrankOracle` mutation assumes the PriceUpdateV2 account already exists. FX feeds need the post step first.
- **FX market hours**: The Hermes API returns prices 24/5 for major FX pairs. Outside market hours (Fri 5pm ET – Sun 5pm ET), prices may be stale. The on-chain program rejects prices older than 60 seconds (`MAX_PRICE_AGE_SECS`). The UI should catch `OraclePriceStale` errors and show "FX market may be closed" guidance.
- **closeUpdateAccounts**: Set `closeUpdateAccounts: false` in the TransactionBuilder — if set to true, the PriceUpdateV2 account is closed in the same transaction, but our crank_oracle instruction reads from it. The SDK handles this correctly in the instruction ordering (post → consumer → close), but to be safe, keep it false for the first implementation. The rent cost (~0.003 SOL) is reclaimed when the account is eventually closed.
- **`@solana/web3.js` v1.x**: The project uses web3.js v1.98. The Pyth SDK also uses v1.x internally. No version conflict expected.
- **PythSolanaReceiver Wallet interface**: The constructor takes `{ connection, wallet }` where wallet must have `signTransaction` and `signAllTransactions`. The `useAnchorWallet()` return value satisfies this interface.

## Common Pitfalls

- **0x prefix in feed IDs** — The ORACLE_PRESETS currently use `0x`-prefixed hex strings. The Hermes API returns feed IDs without `0x`. The `Buffer.from(hex, 'hex')` call fails on `0x`-prefixed strings. Normalize by stripping `0x` before conversion. Settle on one format (no prefix) in the presets to avoid confusion.
- **Decimals mismatch between crypto and FX feeds** — Crypto feeds use expo=-8 (8 decimals), FX feeds use expo=-5 or expo=-3. The preset `decimals` field must match the feed's actual exponent. If wrong, the target value comparison will be off by orders of magnitude.
- **Existing crypto presets also broken** — The current presets fail zod validation. The fix must work for both crypto and FX presets, not just FX.
- **Transaction size with post+crank** — Posting a price update + crank instruction may exceed a single transaction's size limit. The SDK's `buildVersionedTransactions()` returns an array of transactions. If it returns more than one, all must be sent in order. Use `provider.sendAll()` or the SDK's `sendTransactions()` helper.
- **`sendAll` vs wallet adapter `signAllTransactions`** — The `PythSolanaReceiver.provider.sendAll()` method sends multiple versioned transactions. In a browser wallet context, this triggers one approval popup per transaction. If the post+crank fits in one transaction (likely for a single feed), it's a single popup. If split, the user sees multiple popups.

## Open Risks

- **Transaction split**: If the Pyth price update data + crank instruction don't fit in one versioned transaction (~1232 bytes), the SDK will split into two transactions. The first posts the price, the second cranks. Between the two, another user could front-run by cranking with a different price. Low risk on devnet, but worth noting.
- **Hermes rate limits**: The public Hermes endpoint (`hermes.pyth.network`) has undocumented rate limits. If the app hammers it (e.g., rapid crank button clicks), requests may be throttled. Add basic request deduplication (disable button during pending mutation).
- **Price stale during testing**: If research/testing happens on a weekend or outside FX market hours (after 5pm ET Friday), the EUR/USD feed will return stale prices that the on-chain program rejects. Test during market hours.

## Sources

- FX feed IDs confirmed via Hermes API: `https://hermes.pyth.network/v2/price_feeds?query=EUR/USD&asset_type=fx`
- Live EUR/USD price verified: 1.16056 (expo=-5) at timestamp 1774437052
- `@pythnetwork/pyth-solana-receiver` v0.14.0, `@pythnetwork/hermes-client` v3.1.0 (current npm versions)
- SDK transaction builder pattern from Pyth crosschain docs (source: [pyth-crosschain README](https://github.com/pyth-network/pyth-crosschain/blob/main/target_chains/solana/sdk/js/pyth_solana_receiver/README.md))
