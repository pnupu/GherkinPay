# S02: Oracle & Token-Gate Test Coverage — Research

**Date:** 2026-03-23
**Depth:** Light research — straightforward test additions following established patterns in `tests/gherkin-pay.ts`

## Summary

This slice adds two new `describe` blocks to `tests/gherkin-pay.ts`: one for `crank_oracle` with the mock Pyth feed fixture, one for `crank_token_gate` with a second Token-2022 mint. Both follow the exact same create→addCondition→finalize→fund→crank→evaluate pattern already used 6 times in the file. The mock Pyth fixture is already loaded by Anchor.toml's `[[test.validator.account]]` config, and I've verified all its embedded data is consistent and will pass the on-chain validation checks.

The oracle test is the trickier of the two because it requires understanding the mock fixture's embedded price data and the on-chain validation (feed_id match, staleness, confidence). The token-gate test is simpler — just needs a second mint, a holder account with tokens, and the holder's token account passed as `holderTokenAccount`.

## Recommendation

Add two new `describe` blocks at the end of `tests/gherkin-pay.ts` (before the closing `})`), using unique payment IDs (7 and 8 — existing tests use 1-6). Each block follows the established flow pattern. No new imports or setup changes needed.

## Implementation Landscape

### Key Files

- `tests/gherkin-pay.ts` — the only file that changes; add ~120 lines for two new describe blocks
- `fixtures/mock-pyth-feed.json` — already exists, loaded by Anchor.toml; no changes needed
- `programs/gherkin-pay/src/instructions/crank_oracle.rs` — reference for account structure and validation logic
- `programs/gherkin-pay/src/instructions/crank_token_gate.rs` — reference for account structure
- `programs/gherkin-pay/src/state/condition.rs` — reference for Condition enum variants (Oracle, TokenGated)

### Mock Pyth Feed Data (decoded)

The fixture at `JBc8woEgPzyXwLEmZJpnSiNhneGBcectQrQpzm52fvCj` contains:
- **Feed ID** (bytes 41-73): equals the account pubkey itself (`JBc8woEgPzyXwLEmZJpnSiNhneGBcectQrQpzm52fvCj`)
- **Price** (i64 @ 73): `15_000_000_000` (raw)
- **Confidence** (u64 @ 81): `150_000_000`
- **Exponent** (i32 @ 89): `-8` → effective price = $150.00
- **Publish time** (i64 @ 93): `1893456000` (2030-01-01, far future — staleness check always passes)

On-chain validation will pass because:
1. Feed ID matches the pubkey → `extract_feed_id` check passes
2. `publish_time` is in the future → `clock.unix_timestamp - publish_time` is negative → `<= 60` passes
3. Confidence ratio: `150M <= 15B / 20 = 750M` → passes

### Oracle Test (describe block)

The Oracle condition variant in JS:
```js
{
  oracle: {
    feedAccount: new PublicKey("JBc8woEgPzyXwLEmZJpnSiNhneGBcectQrQpzm52fvCj"),
    operator: { lt: {} },        // price < target → 15B < 20B → true
    targetValue: new BN(20_000_000_000),
    decimals: 8,
    met: false,
  }
}
```

The `crankOracle` instruction needs accounts: `payment`, `conditionAccount`, `priceFeed` (the mock fixture pubkey).

### Token-Gate Test (describe block)

Create a **second** Token-2022 mint (the "gate mint"), create a holder token account, mint tokens to it, then:

```js
{
  tokenGated: {
    requiredMint: gateMint,
    minAmount: new BN(100),
    holder: holder.publicKey,
    met: false,
  }
}
```

The `crankTokenGate` instruction needs accounts: `payment`, `conditionAccount`, `holderTokenAccount`.

The existing test infrastructure already has `createMint`, `createAccount`, `mintTo` imports from `@solana/spl-token` and uses `TOKEN_2022_PROGRAM_ID` throughout — the pattern is identical.

### Build Order

1. **Oracle test first** — it's the higher-risk item (mock fixture data must match on-chain expectations). If it passes, the fixture is validated.
2. **Token-gate test second** — straightforward, no external fixture dependency.

Both can be implemented in a single task since they're independent describe blocks added to the same file.

### Verification Approach

- `anchor test` exits 0 with test count increased from 20 to at least 28+ (each new describe block adds ~4 test cases: create, add condition, finalize, fund, crank, evaluate+release)
- Oracle test verifies: condition.oracle.met === true after crank
- Token-gate test verifies: condition.tokenGated.met === true after crank
- Both tests verify: payment.status === { completed: {} } after evaluateAndRelease

## Constraints

- Payment IDs must be unique across all describe blocks — existing tests use BN(1) through BN(6); new tests should use BN(7) and BN(8)
- The mock Pyth feed address is `JBc8woEgPzyXwLEmZJpnSiNhneGBcectQrQpzm52fvCj` — hardcoded in both Anchor.toml and the fixture file
- `metadata_uri` must be passed as the last argument to `createPayment` (S01 forward intelligence)
- The `operator` field in Oracle condition uses `ComparisonOperator` enum — in JS: `{ gt: {} }`, `{ lt: {} }`, `{ gte: {} }`, `{ lte: {} }`, `{ eq: {} }`
- Oracle condition's `feed_account` field must equal the feed_id bytes embedded in the Pyth data (both happen to be `JBc8woEgPzyXwLEmZJpnSiNhneGBcectQrQpzm52fvCj`)

## Common Pitfalls

- **Wrong target_value direction for oracle** — The mock price is `15_000_000_000` (raw i64). To make the condition pass, use `{ lt: {} }` with target > 15B, or `{ gt: {} }` with target < 15B. Using `{ gt: {} }` with target = 20B would fail (15B is NOT > 20B).
- **Forgetting `priceFeed` account on crankOracle** — Unlike crankTime which only needs payment + conditionAccount, crankOracle also needs the `priceFeed` UncheckedAccount.
- **Token-gate mint must differ from payment mint** — Using the same mint as the escrow payment would conflate test concerns. Create a dedicated gate mint.
- **Token-gate holderTokenAccount ownership** — The `holder` field in the condition and the `owner` of the token account must match, and the `mint` of the token account must match `required_mint`.
