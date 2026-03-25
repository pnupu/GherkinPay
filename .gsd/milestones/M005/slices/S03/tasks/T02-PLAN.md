---
estimated_steps: 4
estimated_files: 2
skills_used: []
---

# T02: Smoke-test crank bot against devnet and document UI roundtrip

**Slice:** S03 — Devnet Deploy & Smoke Test
**Milestone:** M005

## Description

Run the crank bot in `--dry-run` mode against devnet to prove it can connect, deserialize accounts using the synced IDL, and scan for conditions — proving operational readiness. Then write a verification script that checks all S03 success criteria, and document the manual UI roundtrip steps for R026 (payment with metadata_uri visible in detail page).

## Steps

1. Install root dependencies if needed: `bun install` at repo root (crank bot imports from `app/web/src/idl/`).
2. Run crank bot smoke test: `timeout 15 bun run scripts/crank-bot.ts --dry-run 2>&1`. Confirm it starts, connects to devnet RPC (`https://api.devnet.solana.com`), and attempts to scan accounts. It should log some output and exit cleanly or be killed by timeout after scanning. Capture the output to verify no deserialization or connection errors.
3. Write `scripts/verify-s03-smoke.sh` that automates verification:
   - Check program deployed: `solana program show 2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV --url devnet`
   - Check types synced: `diff target/types/gherkin_pay.ts app/web/src/types/gherkin_pay.ts`
   - Check metadataUri count: `grep -c metadataUri app/web/src/types/gherkin_pay.ts` returns 4
   - Check frontend build: `cd app/web && bun run build`
   - Check crank bot starts: `timeout 15 bun run scripts/crank-bot.ts --dry-run 2>&1 | head -20`
   - Script should `set -euo pipefail` and print pass/fail for each step.
4. Run the verification script: `bash scripts/verify-s03-smoke.sh` — all checks pass.

## Must-Haves

- [ ] Crank bot connects to devnet and scans without crash in dry-run mode
- [ ] `scripts/verify-s03-smoke.sh` exists and passes all checks
- [ ] UI roundtrip steps documented (manual UAT — not automated)

## Verification

- `bash scripts/verify-s03-smoke.sh` exits 0
- `timeout 15 bun run scripts/crank-bot.ts --dry-run 2>&1 | grep -qi "scan\|account\|connect\|program\|condition\|poll"` exits 0

## Inputs

- `scripts/crank-bot.ts` — crank bot script (imports IDL from `app/web/src/idl/gherkin_pay.json`)
- `app/web/src/idl/gherkin_pay.json` — synced IDL (already matches generated)
- `app/web/src/types/gherkin_pay.ts` — synced types from T01

## Observability Impact

- **New signal:** `scripts/verify-s03-smoke.sh` provides a repeatable 6-check suite for all S03 success criteria (deploy, types, build, crank bot). Future agents can re-run it to confirm slice health.
- **Crank bot dry-run:** Logs structured output showing connection status, program ID, poll cycle count, and account deserialization results. Errors surface in stderr with `[ERROR]` prefix.
- **Failure visibility:** Each check in the verification script prints PASS/FAIL with an emoji; overall exit code is non-zero if any check fails.
- **Inspection:** `bash scripts/verify-s03-smoke.sh` is the single command to validate S03 end-to-end.

## Expected Output

- `scripts/verify-s03-smoke.sh` — new verification script covering all S03 success criteria
