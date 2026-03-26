---
estimated_steps: 3
estimated_files: 1
skills_used: []
---

# T01: Add Custody Integration Section to README

**Slice:** S02 — README Custody Section + EC2 Deploy
**Milestone:** M007

## Description

Add a `### Custody Integration` subsection to `README.md` under the `## Architecture` heading, between the Compliance Stack code fence and `## Tech Stack`. This documents that GherkinPay's standard Solana signer model means any MPC custody provider (Fireblocks, Fordefi, Anchorage) can act as payer, payee, or authority without protocol changes. This is requirement R032 — a differentiator for hackathon judges evaluating institutional readiness.

## Steps

1. Read `README.md` and locate the insertion point: after the closing ` ``` ` of the Compliance Stack ASCII diagram (around line 79) and before `## Tech Stack` (around line 80).
2. Insert a new `### Custody Integration` subsection. Content must cover:
   - GherkinPay uses standard Solana Ed25519 signers — any wallet that can sign Solana transactions works, including MPC wallets from institutional custody providers.
   - Funds are held in program-derived addresses (PDAs), not in user wallets. The custody provider's key only signs funding and release transactions.
   - Named examples: Fireblocks (StableHacks partner — list first), Fordefi, Anchorage Digital.
   - No protocol changes are needed — every wallet address is MPC-compatible by design.
3. Keep the section under 20 lines. Match existing README tone: terse, capability-focused. Use a short paragraph + bullet list or table. Add a blank line before `## Tech Stack` to maintain spacing.

## Must-Haves

- [ ] Section heading is exactly `### Custody Integration` (H3 under Architecture)
- [ ] Mentions Fireblocks, Fordefi, and Anchorage by name
- [ ] Explains PDA-based escrow and standard Ed25519 signer compatibility
- [ ] Inserted between Compliance Stack and Tech Stack sections (not at end of file)
- [ ] Under 20 lines of content

## Verification

- `grep -c "### Custody Integration" README.md` returns 1
- `grep -c "Fireblocks" README.md` returns ≥ 1
- `grep -c "Fordefi" README.md` returns ≥ 1
- `grep -c "Anchorage" README.md` returns ≥ 1
- `grep -c "PDA\|program-derived" README.md` returns ≥ 1
- The section appears between lines containing "Compliance Stack" and "## Tech Stack" (verify with `grep -n`)

## Observability Impact

This task is a documentation-only change (README prose). No runtime signals, logs, or failure states change. A future agent inspects correctness via `grep` on the README — the verification commands above serve as the inspection surface. No deployed code is affected.

## Inputs

- `README.md` — existing project README; insertion point is between Compliance Stack (line ~79) and Tech Stack (line ~80)

## Expected Output

- `README.md` — modified with new `### Custody Integration` subsection (~15-20 lines added)
