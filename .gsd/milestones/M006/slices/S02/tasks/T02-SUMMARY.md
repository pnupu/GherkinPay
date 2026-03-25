---
id: T02
parent: S02
milestone: M006
provides:
  - M006 build deployed to EC2 production at gherkinpay.lacertalabs.xyz
  - FX presets, post+crank oracle, and FX landing page card live at demo URL
key_files:
  - app/web/src/app/page.tsx
key_decisions:
  - none
patterns_established:
  - none
observability_surfaces:
  - "curl -s -o /dev/null -w '%{http_code}' https://gherkinpay.lacertalabs.xyz returns 200 when service is healthy"
  - "ssh ubuntu@3.8.170.147 'sudo systemctl status gherkinpay-web' shows active/failed state"
duration: 5m
verification_result: passed
completed_at: 2026-03-25
blocker_discovered: false
---

# T02: Deploy M006 build to EC2 and verify live URL

**Deployed full M006 build (FX presets, post+crank oracle, FX landing page card) to EC2 via rsync → remote npm install/build → systemctl restart; live URL returns 200.**

## What Happened

Rsync'd 131 files from the worktree's `app/web/` to EC2 at `/opt/gherkinpay/app/web/` (excluding node_modules, .next, .env, bun.lock). Ran `npm install --legacy-peer-deps && npm run build` on the remote — Next.js compiled successfully in 7.2s, all 10 routes generated. Restarted the `gherkinpay-web` systemd service. After a 5-second settle, the live URL returned HTTP 200.

## Verification

All four slice verification checks pass:
- `cd app/web && bun run build` exits 0 (local build confirmed)
- `grep -c "FX" app/web/src/app/page.tsx` returns 3 (≥2 threshold met)
- `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` returns 200
- `cd app/web && bun run build 2>&1 | grep -i "error"` returns empty (no build errors)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run build` | 0 | ✅ pass | ~15s |
| 2 | `grep -c "FX" app/web/src/app/page.tsx` | 0 (returned 3) | ✅ pass | <1s |
| 3 | `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` | 0 (returned 200) | ✅ pass | ~5s |
| 4 | `cd app/web && bun run build 2>&1 \| grep -i "error"` | 1 (no matches) | ✅ pass | ~15s |

## Diagnostics

- **Live health:** `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` — returns 200 when healthy.
- **Service status:** `ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 "sudo systemctl status gherkinpay-web"` — shows active/failed state and recent logs.
- **Remote build:** If a future deploy's remote build fails, Next.js emits the failing module and line number in the `npm run build` output.
- **Failure path:** Non-200 from live URL → check `systemctl status gherkinpay-web` on EC2 for crash logs.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `.gsd/milestones/M006/slices/S02/tasks/T02-PLAN.md` — Added Observability Impact section (pre-flight fix)
