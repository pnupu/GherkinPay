# S02: README Custody Section + EC2 Deploy — Research

**Date:** 2026-03-25
**Status:** Complete
**Depth:** Light

## Summary

S02 has two mechanical tasks: add a "Custody Integration" section to `README.md`, and deploy the full M007 build (including S01's MPC badges) to EC2. Both are low-risk. The README insertion point is well-defined (between line 79's Compliance Stack closing fence and line 80's `## Tech Stack`). The deploy procedure is identical to M006/S02/T02 — rsync, remote npm install + build, systemctl restart.

## Requirement Targets

- **R032** (differentiator, active) — README documents MPC custody provider compatibility. Primary deliverable of this slice.
- **R030** (operability, validated) — EC2 deploy. Re-execution of proven procedure from M006.

## Recommendation

Two tasks, sequential:

1. **T01: README Custody Integration section** — Add prose between Compliance Stack and Tech Stack. No code changes. Verifiable with grep.
2. **T02: EC2 deploy + verify** — rsync app/web to EC2, remote build, systemctl restart. Verify HTTP 200 and badge presence at live URL. Depends on T01 being committed so the README change is included.

## Implementation Landscape

### T01: README — What to Write, Where to Put It

**Insertion point:** Between line 79 (closing ` ``` ` of Compliance Stack code block) and line 80 (`## Tech Stack`) in `README.md`.

**Section structure:** A new `### Custody Integration` subsection under `## Architecture` (same heading level as `### Compliance Stack`). Content should cover:

1. **Architectural compatibility** — GherkinPay uses standard Solana Ed25519 signers for payer/payee/authority. Any wallet that can sign Solana transactions works — including MPC wallets from institutional custody providers.
2. **PDA-based escrow** — Funds are held in program-derived addresses (PDAs), not in user wallets. The custody provider's key only needs to sign the funding and release transactions.
3. **Example providers** — Fireblocks, Fordefi, Anchorage Digital as named examples. (Fireblocks is a StableHacks partner — mention it first.)
4. **No protocol changes needed** — The badge on wallet addresses communicates this: every address is MPC-compatible because the protocol imposes no signer constraints beyond standard Ed25519.

**Tone/style:** Match the existing README — terse, capability-focused, use a table or bullet list. Keep it under 20 lines. The existing sections use ASCII box diagrams and markdown tables; a short prose paragraph + bullet list of providers fits the pattern.

**Key facts for the content** (from codebase and D014):
- Badge decision D014: appears on ALL addresses universally
- Escrow is PDA-based (`seeds = [b"escrow", payment_key]`)
- Payer/payee/authority are standard `Pubkey` types — no custom signer interface
- Anchor program uses `Signer<'info>` constraint — any valid Ed25519 signature works

### T02: EC2 Deploy Procedure

**Proven procedure from M006/S02/T02** (exact commands):

```bash
# 1. Rsync app/web to EC2 (exclude build artifacts)
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.env' \
  --exclude='bun.lock' \
  app/web/ ubuntu@3.8.170.147:/opt/gherkinpay/app/web/ \
  -e "ssh -i ~/.ssh/gherkinpay-eic"

# 2. Remote install + build
ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 \
  "cd /opt/gherkinpay/app/web && npm install --legacy-peer-deps && npm run build"

# 3. Restart service
ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 \
  "sudo systemctl restart gherkinpay-web"

# 4. Verify (after ~5s settle)
curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz
```

**SSH key:** `~/.ssh/gherkinpay-eic` — confirmed present on this machine.

**EC2 host:** `ubuntu@3.8.170.147`

**Remote paths:** `/opt/gherkinpay/app/web/`

**Service name:** `gherkinpay-web` (systemd)

**Important:** The rsync source is the worktree's `app/web/` directory, not the main repo's. The worktree has S01 changes (mpc-badge.tsx, tooltip.tsx, layout.tsx, agreement detail page).

**Also rsync README.md** — The README lives at the repo root. The deploy must also copy it if we want the live site's potential about/docs pages to reflect the change. However, since the README is primarily consumed on GitHub (not served by the Next.js app), it only needs to be committed to the branch. The deploy rsync only covers `app/web/`. The README commit is separate from the deploy.

### Key Files

| File | Role | Change |
|------|------|--------|
| `README.md` | Project README | Add Custody Integration subsection (~15-20 lines) |
| `app/web/` (directory) | Next.js app | Rsync to EC2 (no code changes in S02) |

## Verification

| Check | Command | Expected |
|-------|---------|----------|
| README has Custody section | `grep -c "Custody Integration" README.md` | ≥ 1 |
| README mentions providers | `grep -c "Fireblocks\|Fordefi\|Anchorage" README.md` | ≥ 1 |
| Live URL returns 200 | `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` | 200 |
| Service is running | `ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 "sudo systemctl is-active gherkinpay-web"` | active |

Browser verification of MPC badges at the live URL is the final check but requires manual interaction — the planner should include it if browser tools are available.

## Constraints

- **README only change is additive** — no existing content is modified, only inserted between sections
- **Deploy must come from worktree** — the worktree at `.gsd/worktrees/M007/app/web/` has S01 changes
- **Remote uses npm, not bun** — EC2 has npm installed, not bun. Build command is `npm run build`, not `bun run build`
- **`--legacy-peer-deps` required** — peer dependency conflicts on EC2's npm version require this flag
- **Service restart needs sudo** — `sudo systemctl restart gherkinpay-web`
