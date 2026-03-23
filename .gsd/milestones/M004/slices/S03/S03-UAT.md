# S03: Crank Automation Bot — UAT

**Milestone:** M004
**Written:** 2026-03-23

## UAT Type

- UAT mode: mixed (artifact-driven for code checks + live-runtime for bot execution)
- Why this mode is sufficient: The bot is a standalone script — artifact checks confirm all three condition types are implemented, and runtime execution proves the polling loop, Anchor setup, and structured logging work against devnet.

## Preconditions

- Solana CLI installed with a devnet keypair at `~/.config/solana/id.json`
- `bun` runtime available
- `node_modules` installed in `app/web/` (`cd app/web && bun install`)
- Devnet RPC accessible (default: `https://api.devnet.solana.com`)
- For live cranking tests: a PaymentAgreement with a ConditionAccount containing a past-due TimeBased condition must exist on devnet

## Smoke Test

Run `bun run scripts/crank-bot.ts --dry-run --interval 2` — bot should start, log initialization, poll at least 2 cycles with structured output, and exit cleanly on Ctrl+C.

## Test Cases

### 1. Bot starts and polls in dry-run mode

1. Run `bun run scripts/crank-bot.ts --dry-run --interval 3`
2. Observe stdout for initialization logs
3. Wait for at least 2 poll cycles
4. Press Ctrl+C to stop
5. **Expected:** Logs show `[INFO] Starting crank bot` with RPC URL, `[INFO] Poll cycle` with account count, and clean exit. No errors. ISO timestamps on every log line.

### 2. CLI argument parsing

1. Run `bun run scripts/crank-bot.ts --rpc https://api.devnet.solana.com --keypair ~/.config/solana/id.json --interval 10 --dry-run`
2. Check the initialization log line
3. **Expected:** Log shows the custom RPC URL, keypair path, and 10-second interval in the startup message.

### 3. Bot handles zero accounts gracefully

1. Run `bun run scripts/crank-bot.ts --dry-run --interval 2` on a devnet with no ConditionAccounts for the program
2. Wait for 2 poll cycles
3. **Expected:** Each cycle logs `accounts=0` and `cranked=0 skipped=0 errors=0`. No crashes or errors.

### 4. Time condition evaluation (requires live devnet data)

1. Create a PaymentAgreement on devnet with a TimeBased condition where `unlock_at` is in the past
2. Run `bun run scripts/crank-bot.ts --dry-run --interval 5`
3. Wait for 1 poll cycle
4. **Expected:** Bot logs `[DRY-RUN] Would crank TimeBased condition` with the payment pubkey, condition index, and unlock_at timestamp.

### 5. Time condition live cranking (requires live devnet data)

1. Ensure a PaymentAgreement exists with an unmet TimeBased condition past `unlock_at`
2. Run `bun run scripts/crank-bot.ts --interval 5` (no --dry-run)
3. Wait for 1 poll cycle
4. **Expected:** Bot logs `[INFO] Cranked TimeBased condition` with a transaction signature. Subsequent cycles show the condition as already met (skipped).

### 6. Oracle condition evaluation (requires live devnet data)

1. Create a PaymentAgreement with an Oracle condition referencing a valid Pyth devnet price feed
2. Set the target value so the condition is currently satisfiable
3. Run `bun run scripts/crank-bot.ts --dry-run --interval 5`
4. **Expected:** Bot logs oracle evaluation with price feed pubkey, parsed price, operator, target value, and staleness age. If satisfiable, logs `[DRY-RUN] Would crank Oracle condition`.

### 7. Token-gate condition evaluation (requires live devnet data)

1. Create a PaymentAgreement with a TokenGated condition for a mint the holder owns
2. Ensure holder's ATA has balance >= minAmount
3. Run `bun run scripts/crank-bot.ts --dry-run --interval 5`
4. **Expected:** Bot logs token-gate evaluation with holder, mint, ATA address, and balance vs minAmount. If satisfiable, logs `[DRY-RUN] Would crank TokenGated condition`.

### 8. Already-met conditions are skipped

1. Run the bot against a ConditionAccount where all conditions are already met
2. **Expected:** Bot logs each condition as skipped (already met), with `skipped=N` in the cycle summary.

### 9. crankTime code presence

1. Run `grep -c "crankTime" scripts/crank-bot.ts`
2. **Expected:** At least 1 match.

### 10. crankOracle code presence

1. Run `grep -c "crankOracle" scripts/crank-bot.ts`
2. **Expected:** At least 1 match.

### 11. crankTokenGate code presence

1. Run `grep -c "crankTokenGate" scripts/crank-bot.ts`
2. **Expected:** At least 1 match.

### 12. README documents all condition types

1. Run `grep -c "oracle\|token.gate\|time" scripts/README.md`
2. **Expected:** At least 3 matches covering all three condition types.

## Edge Cases

### Stale oracle price feed
- Run with an Oracle condition whose Pyth feed hasn't updated in >60 seconds
- **Expected:** Bot logs `[WARN]` with staleness age and skips the condition (does not attempt crank)

### Missing holder ATA
- Run with a TokenGated condition where the holder has no ATA for the required mint
- **Expected:** Bot logs `[WARN]` about missing ATA and skips the condition (not counted as error)

### Unreachable RPC
- Run with `--rpc https://invalid.example.com`
- **Expected:** Bot logs a fatal error and exits with code 1

### Invalid keypair path
- Run with `--keypair /nonexistent/path`
- **Expected:** Bot logs a fatal error about missing keypair file and exits with code 1

## Confidence & Gaps

- **High confidence:** Bot infrastructure (CLI parsing, polling loop, structured logging, dry-run mode) — verified with runtime execution
- **High confidence:** All three condition type handlers exist with correct instruction names — verified with grep checks
- **Medium confidence:** Live cranking works end-to-end — depends on having appropriate test data on devnet; dry-run proves the logic path
- **Gap:** No automated test suite for the bot — verification is manual runtime + grep checks
