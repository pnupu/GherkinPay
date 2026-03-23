# GherkinPay Crank Bot

Automated bot that monitors on-chain `ConditionAccount`s and sends crank transactions when conditions become satisfiable. Eliminates the need for manual UI interaction to advance payment milestones.

## Prerequisites

- **[Bun](https://bun.sh/)** — runtime for TypeScript execution
- **Solana keypair** — JSON file with a funded keypair (needs SOL for transaction fees)
- **Deployed GherkinPay program** — matching the IDL in `app/web/src/idl/gherkin_pay.json`

## Installation

```bash
# From the repository root
bun install
```

## Usage

```bash
bun run scripts/crank-bot.ts [options]
```

### CLI Options

| Flag | Description | Default |
|------|-------------|---------|
| `--rpc <url>` | Solana RPC endpoint URL | `https://api.devnet.solana.com` |
| `--keypair <path>` | Path to Solana keypair JSON file | `~/.config/solana/id.json` |
| `--interval <seconds>` | Poll interval between cycles | `30` |
| `--dry-run` | Log what would be cranked without sending transactions | Off |

### Examples

```bash
# Dry-run on devnet (inspect without sending transactions)
bun run scripts/crank-bot.ts --dry-run

# Run on devnet with custom keypair and 10s poll interval
bun run scripts/crank-bot.ts --keypair ./my-keypair.json --interval 10

# Run against a local validator
bun run scripts/crank-bot.ts --rpc http://localhost:8899 --keypair ./my-keypair.json
```

## Condition Types

The bot evaluates and cranks three condition types:

### TimeBased

Conditions with an `unlock_at` timestamp. The bot compares the timestamp against the current wall-clock time and cranks when `unlock_at <= now`.

- **Instruction:** `crankTime(conditionIndex)`
- **Accounts:** `payment` (readonly), `conditionAccount` (writable)

### Oracle (Pyth Price Feed)

Conditions tied to a Pyth price oracle. The bot fetches the Pyth PriceUpdateV2 account, parses the price at the standard offsets (price i64 @ bytes 73–81, publish_time i64 @ bytes 93–101), and compares against the target value using the specified operator (gt, gte, lt, lte, eq).

- **Instruction:** `crankOracle(conditionIndex)`
- **Accounts:** `payment` (readonly), `conditionAccount` (writable), `priceFeed` (readonly)
- **Staleness guard:** Skips if the price feed's `publish_time` is more than 60 seconds old

### TokenGated

Conditions requiring a holder to own a minimum amount of a specific SPL token. The bot derives the holder's Associated Token Account (ATA), fetches the balance, and cranks if `balance >= minAmount`.

- **Instruction:** `crankTokenGate(conditionIndex)`
- **Accounts:** `payment` (readonly), `conditionAccount` (writable), `holderTokenAccount` (readonly)
- **Missing ATA:** Logs a warning and skips if the holder's ATA doesn't exist

## Output Format

All output uses structured logging with ISO timestamps:

```
[2026-03-23T10:00:00.000Z] [INFO] GherkinPay Crank Bot starting rpc=https://api.devnet.solana.com interval=30s dryRun=false
[2026-03-23T10:00:00.100Z] [INFO] Loaded keypair pubkey=7xKX...abc
[2026-03-23T10:00:00.200Z] [INFO] Poll cycle #1 starting
[2026-03-23T10:00:01.500Z] [INFO] Fetched 3 ConditionAccount(s)
[2026-03-23T10:00:01.600Z] [INFO] Cranked TimeBased condition payment=5abc... conditionAccount=9xyz... index=0 tx=3sig...
[2026-03-23T10:00:02.100Z] [WARN] Oracle price feed is stale, skipping conditionAccount=8def... index=1 ageSeconds=120
[2026-03-23T10:00:02.500Z] [INFO] [DRY-RUN] Would crank TokenGated condition payment=5abc... conditionAccount=7ghi... index=0
[2026-03-23T10:00:02.600Z] [INFO] Poll cycle #1 complete cranked=1 skipped=2 errors=0 durationMs=2400
```

Log levels:
- **INFO** — normal operations, crank successes, cycle summaries
- **WARN** — skipped conditions (stale feeds, missing ATAs)
- **ERROR** — failed crank transactions, RPC errors

## Dry-Run Mode

Use `--dry-run` to inspect what the bot would do without submitting transactions. All three condition types support dry-run — the bot logs `[DRY-RUN] Would crank ...` with full context (payment, condition account, index, type-specific details) but never sends a transaction.

```bash
bun run scripts/crank-bot.ts --dry-run --interval 5
```

## Limitations

- Requires a deployed GherkinPay program whose IDL matches the bundled `gherkin_pay.json`
- The bot's keypair must have enough SOL to pay transaction fees
- Oracle conditions use Pyth PriceUpdateV2 account layout — other oracle formats are not supported
- The bot does not handle `Multisig` or `Webhook` conditions (these require external signatures/events)
- No built-in retry for failed transactions — they're retried on the next poll cycle
- Private key is loaded from a JSON file; the file path is logged but the key itself is never printed
