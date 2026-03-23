---
id: T01
parent: S03
milestone: M004
provides:
  - scripts/crank-bot.ts with CLI args, Anchor Program setup, polling loop, time-based condition evaluation, crankTime tx sending, dry-run mode, structured logging
key_files:
  - scripts/crank-bot.ts
key_decisions:
  - Used bun runtime for script execution (already in project toolchain) with Anchor 0.32 new Program(idl, provider) pattern
  - Structured logging with ISO timestamps and key=value fields for machine-parseable output
patterns_established:
  - Anchor enum deserialization: variants become { variantName: { field1, field2 } } objects
  - Per-condition try/catch with structured error logging — one failure never crashes the poll loop
observability_surfaces:
  - Bot stdout: structured logs with ISO timestamps, poll cycle counts, condition evaluations, tx signatures, errors
  - --dry-run flag: logs what would be cranked without sending transactions
duration: 20m
verification_result: passed
completed_at: 2026-03-23
blocker_discovered: false
---

# T01: Build crank bot with time-based condition cranking

**Created standalone crank bot (scripts/crank-bot.ts) with CLI arg parsing, Anchor program setup, polling loop, time-based condition evaluation, crankTime transaction sending, dry-run mode, and structured ISO-timestamp logging.**

## What Happened

Built the core crank bot infrastructure in `scripts/crank-bot.ts`. The bot parses CLI args (`--rpc`, `--keypair`, `--interval`, `--dry-run`), loads a Solana keypair, creates an Anchor Program from the IDL (which contains the program address per Anchor 0.32 convention), and enters a polling loop. Each cycle fetches all ConditionAccounts via `program.account.conditionAccount.all()`, iterates their conditions array, and for each unmet TimeBased condition where `unlockAt <= now`, sends a `crankTime` instruction or logs the action in dry-run mode. Error handling wraps each individual crank attempt so failures don't abort the cycle.

Verified the bot runs successfully against devnet — it loads the keypair, initializes the program, polls (0 accounts on devnet since none deployed), and logs structured output. All 5 task-level grep checks and 4/7 slice-level checks pass (the remaining 3 are T02 scope: oracle, token-gate, and documentation).

## Verification

All task-level checks pass:
- File exists at `scripts/crank-bot.ts`
- Contains `crankTime` references
- Contains `dryRun` / `dry-run` references
- Contains `conditionAccount` references
- Contains polling loop (`while (true)`)

Runtime verification: bot starts, loads keypair, creates program, polls devnet, logs structured output with ISO timestamps across 10 poll cycles.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f scripts/crank-bot.ts` | 0 | ✅ pass | <1s |
| 2 | `grep -q "crankTime\|crank_time" scripts/crank-bot.ts` | 0 | ✅ pass | <1s |
| 3 | `grep -q "dryRun\|dry-run" scripts/crank-bot.ts` | 0 | ✅ pass | <1s |
| 4 | `grep -q "conditionAccount" scripts/crank-bot.ts` | 0 | ✅ pass | <1s |
| 5 | `grep -q "while.*true" scripts/crank-bot.ts` | 0 | ✅ pass | <1s |
| 6 | `bun run scripts/crank-bot.ts --dry-run --interval 1` (10 cycles) | 0 (SIGALRM) | ✅ pass | 10s |
| 7 | Slice: `grep -q "crank_oracle\|crankOracle"` | 1 | ⏳ T02 | <1s |
| 8 | Slice: `grep -q "crank_token_gate\|crankTokenGate"` | 1 | ⏳ T02 | <1s |
| 9 | Slice: `grep -q "crank" scripts/README.md` | 2 | ⏳ T02 | <1s |

## Diagnostics

- Run `bun run scripts/crank-bot.ts --dry-run` to inspect what the bot would crank without sending transactions
- All output goes to stdout with `[ISO-TIMESTAMP] [LEVEL] message key=value` format
- Each poll cycle logs: start, account count, per-condition evaluation, crank results, cycle summary with cranked/skipped/errors counts
- Fatal errors (bad keypair, unreachable RPC) exit with code 1

## Deviations

- Added `Observability Impact` section to T01-PLAN.md and a failure-path verification check to S03-PLAN.md as required by pre-flight observability gap fixes.

## Known Issues

- TypeScript check via `npx tsc --noEmit` from app/web fails because the script's relative import path (`../app/web/src/idl/gherkin_pay.json`) doesn't resolve under app/web's tsconfig. This is expected for a standalone script — bun resolves it correctly at runtime.

## Files Created/Modified

- `scripts/crank-bot.ts` — Standalone crank bot with time-based condition cranking, CLI args, polling loop, dry-run mode, structured logging
- `.gsd/milestones/M004/slices/S03/S03-PLAN.md` — Marked T01 done, added failure-path verification check
- `.gsd/milestones/M004/slices/S03/tasks/T01-PLAN.md` — Added Observability Impact section
