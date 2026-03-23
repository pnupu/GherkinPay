---
id: S03
milestone: M004
status: ready
---

# S03: Crank Automation Bot — Context

<!-- Slice-scoped context. Milestone-only sections (acceptance criteria, completion class,
     milestone sequence) do not belong here — those live in the milestone context. -->

## Goal

A standalone TypeScript crank bot polls devnet on a fixed interval, detects active payments with satisfiable time-based conditions, and automatically sends `crank_time` transactions — proven with a live demo of a time condition being cranked without manual UI interaction.

## Why this Slice

The hackathon judges evaluate "programmable settlement without manual intervention." The existing UI requires a user to manually click crank buttons for each condition. This bot proves the protocol supports automated, permissionless condition evaluation — a core institutional-readiness feature. Depends on S01 for the redeployed program and updated IDL.

## Scope

### In Scope

- Standalone TypeScript script at `scripts/crank-bot.ts` (runs with `bun` or `tsx`)
- **Time-based conditions only** — the bot calls `crank_time` when `clock.unix_timestamp >= unlock_at`
- Polling loop on a fixed interval (e.g. every 10 seconds)
- Scans all active `PaymentAgreement` accounts, fetches their `ConditionAccount`s, checks for unsatisfied time-based conditions past `unlock_at`
- Console log output showing what the bot is doing: scanning, finding crankable conditions, sending transactions, success/failure — designed to be demo-visible in a terminal during judging
- Configuration via environment variables or CLI args: RPC URL, keypair path, poll interval
- Uses a funded devnet keypair for transaction fees (cranking is permissionless — any signer can call it)
- Also calls `evaluate_and_release` after cranking if all conditions for a milestone are met
- README section documenting how to start the bot

### Out of Scope

- Oracle (Pyth) condition cranking — deferred due to devnet feed staleness risk
- Token gate condition cranking — deferred, not needed for hackathon proof
- WebSocket / real-time subscription — polling is sufficient and more reliable on devnet
- Structured JSON logging — console output is more demo-friendly
- Systemd / process manager / Docker — the bot runs in a terminal for the demo
- UI integration (no dashboard, no status page for the bot)
- Retry logic beyond basic error logging — if a crank fails, log the error and continue polling
- Multi-program support — only the gherkin-pay program, not the hook program

## Constraints

- Must use the redeployed program ID and regenerated IDL from S01
- Keypair must be pre-funded with devnet SOL for transaction fees
- Must not interfere with existing scripts in `scripts/` (`create-mock-pyth-feed.mjs`, `generate-test-keypair.mjs`)
- Hackathon deadline March 29, 2026 — reliability and demo clarity over feature breadth
- Devnet only (D002)

## Integration Points

### Consumes

- Redeployed gherkin-pay program on devnet (from S01) — program ID and account layout
- Regenerated IDL JSON (from S01) — for Anchor `Program` construction and account deserialization
- `ConditionAccount` struct — to read conditions and check `met` status
- `PaymentAgreement` struct — to find active payments
- `crank_time` instruction — to send crank transactions
- `evaluate_and_release` instruction — to release funds after conditions are met

### Produces

- `scripts/crank-bot.ts` — standalone crank automation script
- Console output showing scan → detect → crank → result cycle (demo-visible)
- README section documenting bot setup and operation

## Open Questions

- Whether the bot should also call `evaluate_and_release` automatically after cranking the last unsatisfied condition, or leave that as a separate manual step — current thinking: yes, auto-evaluate after cranking to show full programmable settlement in the demo.
- Poll interval default — current thinking: 10 seconds is responsive enough for a demo without hammering the RPC.
