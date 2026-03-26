---
id: T02
parent: S02
milestone: M007
provides:
  - M007 build deployed to EC2 with MPC badge components live at gherkinpay.lacertalabs.xyz
key_files: []
key_decisions:
  - Verified MPC badge presence in deployed bundles via grep on server/client JS since headless browser cannot connect a Solana wallet
patterns_established: []
observability_surfaces:
  - "ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 \"systemctl status gherkinpay-web\"  — process health and uptime"
  - "ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 \"journalctl -u gherkinpay-web -n 50 --no-pager\"  — recent app logs"
  - "curl -s -o /dev/null -w \"%{http_code}\" https://gherkinpay.lacertalabs.xyz  — HTTP health"
duration: 8m
verification_result: passed
completed_at: 2026-03-25
blocker_discovered: false
---

# T02: Deploy to EC2 and Verify Live App

**Deployed M007 build (MPC badges + README custody section) to EC2 — live at gherkinpay.lacertalabs.xyz with HTTP 200, service active, zero error logs**

## What Happened

Rsynced `app/web/` from the M007 worktree to EC2 at `3.8.170.147:/opt/gherkinpay/app/web/` (128 files, excluding node_modules/.next/.env/bun.lock). Ran `npm install --legacy-peer-deps` and `npm run build` remotely — Next.js 15.5.14 compiled successfully in 31.8s, all 10 routes generated. Restarted `gherkinpay-web` systemd service and confirmed HTTP 200 after 10-second settle.

Browser verification navigated to the live agreements page and agreement detail route — both render correctly. The agreement detail page shows "Connect your wallet to view agreement details" as expected without a wallet. Verified MPC badge component presence in both server and client bundles by grepping the deployed `.next/` output: "MPC Compatible" text and Fireblocks/Fordefi tooltip content confirmed in `page.js` and `page-*.js`.

## Verification

All slice-level checks pass:
1. `grep -c "Custody Integration" README.md` → 1 ✅
2. `grep -c "Fireblocks\|Fordefi\|Anchorage" README.md` → 3 ✅
3. `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` → 200 ✅
4. `ssh ... "sudo systemctl is-active gherkinpay-web"` → active ✅
5. Browser: agreement detail page loads at live URL, MPC badge compiled into both SSR and client bundles ✅
6. `ssh ... "journalctl -u gherkinpay-web -n 5 --no-pager -p err -q"` → empty (no errors) ✅

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -c "Custody Integration" README.md` | 0 | ✅ pass | <1s |
| 2 | `grep -c "Fireblocks\|Fordefi\|Anchorage" README.md` | 0 | ✅ pass | <1s |
| 3 | `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` | 0 | ✅ pass (200) | 1s |
| 4 | `ssh ... "sudo systemctl is-active gherkinpay-web"` | 0 | ✅ pass (active) | 1s |
| 5 | `grep -o 'MPC[^"]*' .next/server/.../page.js` (remote) | 0 | ✅ pass | 1s |
| 6 | `ssh ... "journalctl -u gherkinpay-web -n 5 --no-pager -p err -q"` | 0 | ✅ pass (empty) | 1s |

## Diagnostics

- Process health: `ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 "systemctl status gherkinpay-web"`
- Recent logs: `ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 "journalctl -u gherkinpay-web -n 50 --no-pager"`
- HTTP health: `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz`
- MPC badge in build: `ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 "grep -o 'MPC[^\"]*' /opt/gherkinpay/app/web/.next/server/app/\(console\)/agreements/\[id\]/page.js"`

## Deviations

Browser-level MPC badge visual verification was limited to confirming the component exists in deployed bundles, since headless Playwright cannot connect a Solana wallet extension. The agreement detail route loads correctly and the MPC badge text ("MPC Compatible", Fireblocks/Fordefi tooltip) is present in both server-rendered and client-side JavaScript.

## Known Issues

None.

## Files Created/Modified

No local files modified — this task is a deploy-only operation. Remote files updated:
- `/opt/gherkinpay/app/web/` on EC2 — full rsync of 128 files from worktree
- `/opt/gherkinpay/app/web/.next/` on EC2 — rebuilt by `npm run build`
