---
estimated_steps: 4
estimated_files: 2
skills_used: []
---

# T02: Add oracle and token-gate cranking plus documentation

**Slice:** S03 — Crank Automation Bot
**Milestone:** M004

## Description

Extend the crank bot with oracle price condition and token-gate condition evaluation and cranking. Then write a README documenting how to set up, configure, and run the bot for all three condition types.

## Steps

1. Add oracle condition evaluation to the poll loop in `scripts/crank-bot.ts`. For each unmet `Oracle` condition (deserialized as `{ oracle: { feedAccount, operator, targetValue, decimals, met } }`): fetch the Pyth price feed account data using `connection.getAccountInfo(feedAccount)`. Parse the price from the account data at the same offsets the on-chain program uses (price i64 at bytes 73–81, publish_time i64 at bytes 93–101). Compare the price against `targetValue` using the `operator` field (gt/gte/lt/lte/eq). If the condition would be satisfied, send `crank_oracle` instruction: `program.methods.crankOracle(conditionIndex).accounts({ payment, conditionAccount, priceFeed: feedAccount }).rpc()`. The `priceFeed` account is `feedAccount` from the condition data. Skip if price feed is stale (publish_time > 60s old) — log a warning.

2. Add token-gate condition evaluation. For each unmet `TokenGated` condition (deserialized as `{ tokenGated: { requiredMint, minAmount, holder, met } }`): derive the holder's associated token account (ATA) for `requiredMint` using `getAssociatedTokenAddressSync(requiredMint, holder)` from `@solana/spl-token`. Fetch the token account balance via `connection.getTokenAccountBalance(ata)`. If `balance >= minAmount`, send `crank_token_gate`: `program.methods.crankTokenGate(conditionIndex).accounts({ payment, conditionAccount, holderTokenAccount: ata }).rpc()`. Handle case where ATA doesn't exist (log warning, skip).

3. Ensure dry-run mode works for all three condition types — oracle and token-gate cranks should also respect `--dry-run` and log what they would do.

4. Write `scripts/README.md` documenting: prerequisites (bun, Solana keypair with SOL for tx fees), configuration (CLI flags: `--rpc`, `--keypair`, `--interval`, `--dry-run`), how to run (`bun run scripts/crank-bot.ts`), what each condition type does, example output, and limitations (requires devnet-deployed program with matching IDL).

## Must-Haves

- [ ] Oracle condition evaluation: fetch Pyth feed, parse price, compare with operator
- [ ] `crank_oracle` instruction sent with correct `priceFeed` account
- [ ] Token-gate condition evaluation: derive ATA, fetch balance, compare with minAmount
- [ ] `crank_token_gate` instruction sent with correct `holderTokenAccount`
- [ ] Dry-run mode covers oracle and token-gate conditions
- [ ] `scripts/README.md` documents all three condition types, CLI usage, and prerequisites

## Verification

- `grep -q "crankOracle\|crank_oracle" scripts/crank-bot.ts`
- `grep -q "crankTokenGate\|crank_token_gate" scripts/crank-bot.ts`
- `grep -q "priceFeed\|price_feed" scripts/crank-bot.ts`
- `grep -q "holderTokenAccount\|holder_token_account" scripts/crank-bot.ts`
- `test -f scripts/README.md`
- `grep -q "oracle" scripts/README.md`
- `grep -q "dry-run\|dry.run" scripts/README.md`

## Inputs

- `scripts/crank-bot.ts` — T01 output with time-based cranking, polling loop, CLI args
- `programs/gherkin-pay/src/instructions/crank_oracle.rs` — reference for crank_oracle accounts (payment readonly, condition_account writable, price_feed readonly)
- `programs/gherkin-pay/src/instructions/crank_token_gate.rs` — reference for crank_token_gate accounts (payment readonly, condition_account writable, holder_token_account readonly)
- `app/web/src/idl/gherkin_pay.json` — IDL with Oracle and TokenGated condition variants and crank instruction definitions

## Expected Output

- `scripts/crank-bot.ts` — extended with oracle and token-gate condition evaluation and cranking
- `scripts/README.md` — documentation for bot setup, configuration, and operation
