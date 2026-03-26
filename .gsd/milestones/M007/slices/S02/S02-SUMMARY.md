---
id: S02
milestone: M007
status: done
outcome: delivered
duration: 13m
completed_at: 2026-03-25
tasks_completed: [T01, T02]
requirements_validated: [R032]
requirements_supported: [R030]
blocker_discovered: false
---

# S02: README Custody Section + EC2 Deploy

**Added Custody Integration documentation to README and deployed M007 (MPC badges + README) to EC2 — live at gherkinpay.lacertalabs.xyz with HTTP 200, zero errors.**

## What This Slice Delivered

1. **README Custody Integration section** (T01): A 14-line `### Custody Integration` subsection inserted between Compliance Stack and Tech Stack in README.md. Documents that GherkinPay uses standard Ed25519 signers (any MPC wallet works as payer/payee/authority), funds are held in PDAs not user wallets, and lists Fireblocks, Fordefi, and Anchorage Digital as example providers in a table.

2. **EC2 deployment** (T02): Rsynced the M007 worktree's `app/web/` to EC2, ran `npm install --legacy-peer-deps && npm run build` (Next.js 15.5.14, 31.8s compile, 10 routes), restarted `gherkinpay-web` systemd service. MPC badge components confirmed present in both server-rendered and client-side JavaScript bundles via remote grep.

## Verification Results

| Check | Result |
|-------|--------|
| `grep -c "Custody Integration" README.md` | 1 ✅ |
| `grep -c "Fireblocks\|Fordefi\|Anchorage" README.md` | 3 ✅ |
| `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` | 200 ✅ |
| `ssh ... "sudo systemctl is-active gherkinpay-web"` | active ✅ |
| MPC badge text in deployed SSR + client bundles | confirmed ✅ |
| `journalctl -u gherkinpay-web -n 5 -p err -q` | empty (no errors) ✅ |

## Requirements Impact

- **R032** (differentiator): active → **validated**. README contains the Custody Integration section with all required content.
- **R030** (operability): remains validated. Re-deploy succeeded with M007 features live at demo URL.

## What the Next Slice Should Know

- M007 is the final slice — no further work in this milestone.
- The live app at gherkinpay.lacertalabs.xyz now includes all M007 features: MPC badges on agreement detail pages (S01) and updated README (S02).
- The deploy procedure remains: rsync `app/web/` → remote `npm install --legacy-peer-deps && npm run build` → `sudo systemctl restart gherkinpay-web`. No changes to infrastructure.
- MPC badge visual verification on the live site requires a connected Solana wallet (headless browsers can't connect wallet extensions). Badge presence was verified via bundle grep instead.

## Observability

- EC2 service health: `ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 "systemctl status gherkinpay-web"`
- App logs: `ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 "journalctl -u gherkinpay-web -n 50 --no-pager"`
- HTTP health: `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz`

## Files Modified

- `README.md` — Added ### Custody Integration subsection (14 lines)
- EC2 `/opt/gherkinpay/app/web/` — Full rsync + rebuild (128 files)
