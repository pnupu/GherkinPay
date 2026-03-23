---
estimated_steps: 5
estimated_files: 1
skills_used: []
---

# T01: Build crank bot with time-based condition cranking

**Slice:** S03 — Crank Automation Bot
**Milestone:** M004

## Description

Create the standalone TypeScript crank bot that polls all on-chain ConditionAccounts, evaluates time-based conditions locally, and sends `crank_time` transactions when conditions are satisfiable. This establishes the core bot infrastructure (CLI arg parsing, Anchor Program setup, polling loop, structured logging, dry-run mode) that T02 extends with oracle and token-gate support.

## Steps

1. Create `scripts/crank-bot.ts`. Parse CLI args: `--rpc` (default `https://api.devnet.solana.com`), `--keypair` (default `~/.config/solana/id.json`), `--interval` (default `30` seconds), `--dry-run` flag. Use `process.argv` parsing (no external deps needed).

2. Load the keypair from the JSON file, create a `Connection`, `AnchorProvider`, and `Program` using the IDL at `../app/web/src/idl/gherkin_pay.json`. The IDL contains the program address in its `address` field — use `new Program(idl, provider)` per Anchor 0.32 convention. Cast program to access typed accounts: `(program as any).account.conditionAccount.all()`.

3. Implement the poll loop: every `interval` seconds, fetch all ConditionAccounts. For each account, iterate over `conditions` array. For each condition that is `TimeBased` (enum variant has `unlockAt` field in the IDL) and `met === false`, check if `unlockAt <= Math.floor(Date.now() / 1000)`. The Condition enum is deserialized by Anchor — each variant becomes an object like `{ timeBased: { unlockAt, met } }`.

4. When a crankable time condition is found: if `--dry-run`, log it and skip. Otherwise, build and send the `crank_time` instruction. The instruction takes `condition_index` (u8) as an arg and requires accounts: `payment` (the condition account's `payment` pubkey, readonly), `conditionAccount` (the condition account pubkey, writable). Use `program.methods.crankTime(conditionIndex).accounts({ payment, conditionAccount }).rpc()`.

5. Add structured logging: ISO timestamp prefix, log poll cycle start/end, conditions found, cranks attempted, tx signatures, errors. Log format: `[2026-03-23T12:00:00Z] [INFO] Cranked time condition: payment=Abc... index=0 tx=xyz...`. Handle errors per-condition (don't let one failed crank abort the cycle).

## Must-Haves

- [ ] CLI arg parsing for `--rpc`, `--keypair`, `--interval`, `--dry-run`
- [ ] Anchor Program created from IDL with correct provider setup
- [ ] Polls all ConditionAccounts via `program.account.conditionAccount.all()`
- [ ] Evaluates TimeBased conditions: skips met, cranks when `unlockAt <= now`
- [ ] Sends `crank_time` instruction with correct accounts and args
- [ ] Dry-run mode logs without sending transactions
- [ ] Structured console logging with timestamps
- [ ] Per-condition error handling (one failure doesn't crash the loop)

## Verification

- `test -f scripts/crank-bot.ts`
- `grep -q "crankTime\|crank_time" scripts/crank-bot.ts`
- `grep -q "dryRun\|dry-run" scripts/crank-bot.ts`
- `grep -q "conditionAccount" scripts/crank-bot.ts`
- `grep -q "setInterval\|setTimeout\|async.*poll\|while.*true" scripts/crank-bot.ts` — has a loop

## Inputs

- `app/web/src/idl/gherkin_pay.json` — IDL for account deserialization and program address; contains ConditionAccount schema with Condition enum variants including TimeBased
- `programs/gherkin-pay/src/instructions/crank_time.rs` — reference for crank_time accounts (payment readonly, condition_account writable) and args (condition_index: u8)

## Expected Output

- `scripts/crank-bot.ts` — standalone crank bot with time-based condition cranking, CLI args, polling loop, dry-run mode, structured logging

## Observability Impact

- **New signals:** Structured console logs with ISO timestamps for every poll cycle (start/end), condition evaluation, crank attempt (success with tx signature, failure with error), and summary counts (cranked/skipped/errors per cycle).
- **Inspection:** Run with `--dry-run` to see what would be cranked without sending transactions. Bot stdout is the primary inspection surface.
- **Failure visibility:** Per-condition try/catch ensures one failed crank does not crash the loop; errors are logged with condition account pubkey, index, and error message. Fatal startup errors (bad keypair, unreachable RPC) exit with code 1 and a structured error log.
- **Redaction:** Keypair file path is logged but private key bytes are never printed.
