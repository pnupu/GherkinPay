# S03: Crank Automation Bot

**Goal:** A standalone TypeScript crank bot monitors on-chain ConditionAccounts and automatically sends crank transactions when conditions are satisfiable — no manual UI interaction required.
**Demo:** Run the bot; it discovers ConditionAccounts with unmet time-based conditions past their `unlock_at`, sends `crank_time` transactions, and logs the results. Oracle and token-gate conditions are also evaluated and cranked when satisfiable.

## Must-Haves

- Bot polls all ConditionAccount accounts from the gherkin_pay program via `program.account.conditionAccount.all()`
- Bot evaluates time-based conditions locally (compare `unlock_at` with `Date.now() / 1000`)
- Bot sends `crank_time` instruction when a time condition is satisfiable
- Bot evaluates oracle conditions by fetching the Pyth price feed account and comparing price to target
- Bot sends `crank_oracle` instruction with the correct price_feed account
- Bot evaluates token-gate conditions by fetching holder token account balance
- Bot sends `crank_token_gate` instruction with the correct holder_token_account
- Bot skips already-met conditions
- Bot has configurable RPC URL, keypair path, and poll interval
- Bot has `--dry-run` mode that logs what it would crank without sending transactions
- Structured console logging with timestamps, condition types, and transaction signatures

## Proof Level

- This slice proves: operational
- Real runtime required: yes (devnet RPC for real cranking, but `--dry-run` mode proves logic without deployment)
- Human/UAT required: yes (UAT requires a live payment with time condition past unlock_at on devnet)

## Verification

- `test -f scripts/crank-bot.ts` — bot file exists
- `cd app/web && npx tsc --noEmit --skipLibCheck ../scripts/crank-bot.ts 2>&1 || bun run build` — bot typechecks or build passes
- `grep -q "crank_time\|crankTime" scripts/crank-bot.ts` — time cranking implemented
- `grep -q "crank_oracle\|crankOracle" scripts/crank-bot.ts` — oracle cranking implemented
- `grep -q "crank_token_gate\|crankTokenGate" scripts/crank-bot.ts` — token gate cranking implemented
- `grep -q "\-\-dry-run\|dryRun" scripts/crank-bot.ts` — dry-run mode exists
- `grep -q "crank" README.md || grep -q "crank" scripts/README.md` — crank bot documented
- `grep -q "ERROR\|error" scripts/crank-bot.ts` — error logging present for failure visibility

## Observability / Diagnostics

- Runtime signals: structured console logs with ISO timestamps, condition type, payment pubkey, condition index, tx signature or error
- Inspection surfaces: bot stdout/stderr when running as a persistent process; `--dry-run` mode for safe inspection
- Failure visibility: each crank attempt logs success/failure with error message; poll cycle count and skipped-condition count logged per cycle
- Redaction constraints: keypair file path logged but private key never printed

## Integration Closure

- Upstream surfaces consumed: `app/web/src/idl/gherkin_pay.json` (IDL for account deserialization), program address `2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV`
- New wiring introduced in this slice: `scripts/crank-bot.ts` standalone entry point, run via `bun run scripts/crank-bot.ts`
- What remains before the milestone is truly usable end-to-end: devnet redeploy of the contract (from S01), then UAT with a real time-based condition

## Tasks

- [x] **T01: Build crank bot with time-based condition cranking** `est:45m`
  - Why: Core bot infrastructure — polling loop, account fetching, time condition evaluation, and `crank_time` transaction sending. This is the proof case for the entire slice.
  - Files: `scripts/crank-bot.ts`
  - Do: Create standalone TypeScript bot that (1) parses CLI args for RPC URL, keypair path, poll interval, dry-run flag; (2) loads IDL and creates Anchor Program; (3) polls all ConditionAccounts; (4) for each unmet TimeBased condition where `unlock_at <= now`, sends `crank_time` ix; (5) logs each action with structured output. Uses `@coral-xyz/anchor` and `@solana/web3.js` already in app/web deps. Import IDL from `../app/web/src/idl/gherkin_pay.json`.
  - Verify: `test -f scripts/crank-bot.ts && grep -q "crankTime\|crank_time" scripts/crank-bot.ts && grep -q "dryRun\|dry-run" scripts/crank-bot.ts`
  - Done when: Bot file exists with polling loop, time condition evaluation, crank_time tx sending, dry-run mode, and structured logging

- [x] **T02: Add oracle and token-gate cranking plus documentation** `est:40m`
  - Why: Completes all three crank types and documents bot setup/operation for hackathon judges and operators.
  - Files: `scripts/crank-bot.ts`, `scripts/README.md`
  - Do: Extend the bot to (1) evaluate Oracle conditions by fetching the Pyth price feed account referenced in the condition's `feed_account` field, parsing price, and comparing against `target_value` using the condition's `operator`; send `crank_oracle` with price_feed account; (2) evaluate TokenGated conditions by deriving the holder's associated token account for `required_mint`, fetching balance, comparing against `min_amount`; send `crank_token_gate` with holder_token_account; (3) write `scripts/README.md` documenting prerequisites, configuration, running the bot, dry-run mode, and all three condition types.
  - Verify: `grep -q "crankOracle\|crank_oracle" scripts/crank-bot.ts && grep -q "crankTokenGate\|crank_token_gate" scripts/crank-bot.ts && test -f scripts/README.md && grep -q "oracle" scripts/README.md`
  - Done when: All three crank types implemented, README exists documenting bot setup and operation

## Files Likely Touched

- `scripts/crank-bot.ts`
- `scripts/README.md`
