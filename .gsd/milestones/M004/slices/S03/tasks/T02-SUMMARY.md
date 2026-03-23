---
id: T02
parent: S03
milestone: M004
provides:
  - Oracle condition evaluation and crankOracle instruction sending
  - TokenGated condition evaluation with ATA derivation and crankTokenGate instruction sending
  - scripts/README.md documenting all three condition types, CLI usage, and prerequisites
key_files:
  - scripts/crank-bot.ts
  - scripts/README.md
key_decisions:
  - Used bigint throughout for i64/u64 comparisons to avoid BN precision loss on large Pyth prices
  - Parse Pyth PriceUpdateV2 at same byte offsets as the on-chain program (price @ 73, publish_time @ 93) for consistency
patterns_established:
  - Inner try/catch for ATA balance fetch — missing ATA is a skip, not an error
  - Staleness guard on oracle prices mirrors on-chain MAX_PRICE_AGE_SECS (60s)
observability_surfaces:
  - Oracle evaluation logs: price feed pubkey, parsed price, operator, target value, staleness age
  - TokenGated evaluation logs: holder, mint, ATA address, balance vs minAmount
  - All three condition types support --dry-run with type-specific context in log output
duration: 15m
verification_result: passed
completed_at: 2026-03-23
blocker_discovered: false
---

# T02: Add oracle and token-gate cranking plus documentation

**Extended crank bot with oracle price feed evaluation (Pyth PriceUpdateV2 parsing, operator comparison, staleness guard), token-gate evaluation (ATA derivation, balance check), and comprehensive scripts/README.md documentation.**

## What Happened

Added two new condition type handlers to the poll loop in `scripts/crank-bot.ts`:

1. **Oracle conditions:** For each unmet Oracle condition, the bot fetches the Pyth PriceUpdateV2 account, parses price (i64 @ bytes 73–81) and publish_time (i64 @ bytes 93–101) using the same offsets as the on-chain program. It checks staleness (>60s = skip with warning), then evaluates the ComparisonOperator (gt/gte/lt/lte/eq) against the target value. If satisfied, sends `crankOracle` with the `priceFeed` account.

2. **TokenGated conditions:** For each unmet TokenGated condition, the bot derives the holder's Associated Token Account via `getAssociatedTokenAddressSync`, fetches the balance, and compares against `minAmount`. Missing ATAs are logged as warnings and skipped. If `balance >= minAmount`, sends `crankTokenGate` with the `holderTokenAccount`.

Both new condition types respect `--dry-run` mode with full context logging and follow the same per-condition error isolation pattern established in T01.

Wrote `scripts/README.md` documenting prerequisites, CLI options, all three condition types, output format, dry-run mode, and limitations.

## Verification

All 7 task-level and all 7 slice-level grep checks pass. Bot starts and runs cleanly with the new imports and code paths (verified with 8 poll cycles on devnet in dry-run mode).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -q "crankOracle\|crank_oracle" scripts/crank-bot.ts` | 0 | ✅ pass | <1s |
| 2 | `grep -q "crankTokenGate\|crank_token_gate" scripts/crank-bot.ts` | 0 | ✅ pass | <1s |
| 3 | `grep -q "priceFeed\|price_feed" scripts/crank-bot.ts` | 0 | ✅ pass | <1s |
| 4 | `grep -q "holderTokenAccount\|holder_token_account" scripts/crank-bot.ts` | 0 | ✅ pass | <1s |
| 5 | `test -f scripts/README.md` | 0 | ✅ pass | <1s |
| 6 | `grep -q "oracle" scripts/README.md` | 0 | ✅ pass | <1s |
| 7 | `grep -q "dry-run\|dry.run" scripts/README.md` | 0 | ✅ pass | <1s |
| 8 | Slice: `test -f scripts/crank-bot.ts` | 0 | ✅ pass | <1s |
| 9 | Slice: `grep -q "crank_time\|crankTime" scripts/crank-bot.ts` | 0 | ✅ pass | <1s |
| 10 | Slice: `grep -q "crank_oracle\|crankOracle" scripts/crank-bot.ts` | 0 | ✅ pass | <1s |
| 11 | Slice: `grep -q "crank_token_gate\|crankTokenGate" scripts/crank-bot.ts` | 0 | ✅ pass | <1s |
| 12 | Slice: `grep -q "\-\-dry-run\|dryRun" scripts/crank-bot.ts` | 0 | ✅ pass | <1s |
| 13 | Slice: `grep -q "crank" scripts/README.md` | 0 | ✅ pass | <1s |
| 14 | Slice: `grep -q "ERROR\|error" scripts/crank-bot.ts` | 0 | ✅ pass | <1s |
| 15 | Runtime: `bun run scripts/crank-bot.ts --dry-run --interval 2` (8 cycles) | 0 (killed) | ✅ pass | 15s |

## Diagnostics

- Oracle evaluation logs include: price feed pubkey, parsed price, operator, target value, staleness age in seconds
- TokenGated evaluation logs include: holder pubkey, mint, ATA address, balance vs minAmount
- `--dry-run` mode outputs `[DRY-RUN] Would crank Oracle/TokenGated condition` with all type-specific fields
- Stale oracle feeds (>60s) are logged at WARN level with the age in seconds
- Missing holder ATAs are logged at WARN level and skipped (not counted as errors)

## Files Created/Modified

- `scripts/crank-bot.ts` — Added oracle and token-gate condition evaluation, Pyth price parsing, ATA derivation, crankOracle/crankTokenGate instruction sending, bigint comparison helpers
- `scripts/README.md` — Full documentation: prerequisites, CLI options, condition types, output format, dry-run mode, limitations
