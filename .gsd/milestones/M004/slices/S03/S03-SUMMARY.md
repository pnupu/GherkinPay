---
id: S03
parent: M004
milestone: M004
provides:
  - scripts/crank-bot.ts — standalone TypeScript crank bot that polls ConditionAccounts and auto-cranks time, oracle, and token-gate conditions
  - scripts/README.md — operator documentation for bot setup, CLI options, and all three condition types
requires:
  - slice: S01
    provides: Redeployed program address and IDL with metadata_uri field for account deserialization
affects: []
key_files:
  - scripts/crank-bot.ts
  - scripts/README.md
key_decisions:
  - Used bun runtime for script execution (already in project toolchain) with Anchor 0.32 new Program(idl, provider) pattern
  - Parsed Pyth PriceUpdateV2 at same byte offsets as on-chain program (price @ 73, publish_time @ 93) for consistency
  - Used bigint throughout for i64/u64 comparisons to avoid BN precision loss on large Pyth prices
  - Structured logging with ISO timestamps and key=value fields for machine-parseable output
patterns_established:
  - Anchor enum deserialization — variants become { variantName: { field1, field2 } } objects in JS
  - Per-condition try/catch with structured error logging — one failure never crashes the poll loop
  - Inner try/catch for ATA balance fetch — missing ATA is a skip (WARN), not an error
  - Staleness guard on oracle prices mirrors on-chain MAX_PRICE_AGE_SECS (60s)
observability_surfaces:
  - Bot stdout with structured ISO-timestamp logs — poll cycles, condition evaluations, tx signatures, errors
  - --dry-run flag logs what would be cranked without sending transactions, with type-specific context
  - Oracle logs include price feed pubkey, parsed price, operator, target value, staleness age
  - TokenGated logs include holder, mint, ATA address, balance vs minAmount
drill_down_paths:
  - .gsd/milestones/M004/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M004/slices/S03/tasks/T02-SUMMARY.md
duration: 35m
verification_result: passed
completed_at: 2026-03-23
---

# S03: Crank Automation Bot

**Standalone TypeScript crank bot that polls all on-chain ConditionAccounts and automatically cranks time-based, oracle, and token-gated conditions — with dry-run mode and structured logging.**

## What Happened

Built a standalone crank bot in two tasks. T01 established the core infrastructure: CLI argument parsing (`--rpc`, `--keypair`, `--interval`, `--dry-run`), Anchor Program initialization from the IDL, a polling loop that fetches all ConditionAccounts via `program.account.conditionAccount.all()`, time-based condition evaluation (compare `unlockAt` against current timestamp), and `crankTime` transaction sending. The bot uses per-condition try/catch so a single failure never crashes the poll loop.

T02 extended the bot with oracle and token-gate condition handlers. Oracle evaluation fetches the Pyth PriceUpdateV2 account, parses price and publish_time at the same byte offsets as the on-chain program (73 and 93), checks staleness (>60s = skip), and evaluates the ComparisonOperator against the target value. Token-gate evaluation derives the holder's Associated Token Account, fetches the balance, and compares against `minAmount` — missing ATAs are logged as warnings and skipped. Both new types send the corresponding crank instructions with the required accounts. T02 also delivered `scripts/README.md` documenting prerequisites, all CLI options, the three condition types, output format, and limitations.

## Verification

All 7 slice-level verification checks pass:

| # | Check | Result |
|---|-------|--------|
| 1 | `test -f scripts/crank-bot.ts` | ✅ pass |
| 2 | `grep -q "crank_time\|crankTime" scripts/crank-bot.ts` | ✅ pass |
| 3 | `grep -q "crank_oracle\|crankOracle" scripts/crank-bot.ts` | ✅ pass |
| 4 | `grep -q "crank_token_gate\|crankTokenGate" scripts/crank-bot.ts` | ✅ pass |
| 5 | `grep -q "\-\-dry-run\|dryRun" scripts/crank-bot.ts` | ✅ pass |
| 6 | `grep -q "crank" scripts/README.md` | ✅ pass |
| 7 | `grep -q "ERROR\|error" scripts/crank-bot.ts` | ✅ pass |

Runtime verification: bot starts, loads keypair, initializes Anchor Program, polls devnet, and logs structured output across multiple poll cycles in both dry-run and normal mode.

## New Requirements Surfaced

- none

## Deviations

- none

## Known Limitations

- TypeScript check via `npx tsc --noEmit` from app/web fails because the script's relative import path (`../app/web/src/idl/gherkin_pay.json`) doesn't resolve under app/web's tsconfig. This is expected for a standalone script — bun resolves it correctly at runtime.
- Full UAT (bot cranks a real time condition on devnet) requires a live payment with a past-due time condition, which depends on S01's contract redeploy and a test payment being created.
- Pyth devnet feed staleness may cause oracle auto-crank failures in practice — the 60s staleness guard will skip stale feeds.

## Follow-ups

- End-to-end UAT: create a payment with a time condition set in the past, run the bot, verify it cranks successfully
- Consider adding a systemd/pm2 service config for persistent bot operation in production
- Consider adding metrics (crank success/failure counts) for operational monitoring

## Files Created/Modified

- `scripts/crank-bot.ts` — Standalone crank bot with time, oracle, and token-gate condition evaluation, CLI args, polling loop, dry-run mode, structured logging
- `scripts/README.md` — Operator documentation for bot prerequisites, CLI options, condition types, output format, and limitations

## Forward Intelligence

### What the next slice should know
- The crank bot is a standalone bun script, not integrated into the Next.js app. Run it via `bun run scripts/crank-bot.ts`.
- The bot reads the IDL from `../app/web/src/idl/gherkin_pay.json` relative to the scripts directory — if the IDL path moves, the bot breaks.
- Anchor enum deserialization in JS produces `{ variantName: { field1, field2 } }` objects, not Rust-style enums. Any new condition types need matching JS object key checks.

### What's fragile
- Pyth PriceUpdateV2 byte offset parsing (price @ 73, publish_time @ 93) — if Pyth changes their account layout, the bot silently parses wrong values. The on-chain program would also break, but the bot has no version check.
- The IDL import path is a relative filesystem path, not a package import — moving either the script or the IDL breaks the bot.

### Authoritative diagnostics
- `bun run scripts/crank-bot.ts --dry-run --interval 5` — shows exactly what the bot sees and would crank without sending transactions. This is the single best diagnostic for verifying bot behavior.
- Bot stdout logs include per-cycle summaries with cranked/skipped/error counts.

### What assumptions changed
- No assumptions changed — the bot was built to plan with no blockers or surprises.
