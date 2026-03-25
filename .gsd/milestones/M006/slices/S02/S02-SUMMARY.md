---
id: S02
parent: M006
milestone: M006
provides:
  - FX Oracle Settlement feature card in landing page capabilities grid
  - Stats bar expanded with 6 condition types and 3 FX pairs
  - Full M006 build deployed to EC2 at gherkinpay.lacertalabs.xyz
requires:
  - slice: S01
    provides: FX presets in condition builder, post+crank oracle hook, jito-ts webpack alias
affects: []
key_files:
  - app/web/src/app/page.tsx
key_decisions:
  - Added "3 FX pairs" as a 5th stat rather than replacing an existing stat — maximizes judge visibility
patterns_established:
  - none
observability_surfaces:
  - "curl -s -o /dev/null -w '%{http_code}' https://gherkinpay.lacertalabs.xyz returns 200 when service is healthy"
  - "ssh ubuntu@3.8.170.147 'sudo systemctl status gherkinpay-web' shows active/failed state"
  - "grep -c FX app/web/src/app/page.tsx returns >=2 when FX card is present"
drill_down_paths:
  - .gsd/milestones/M006/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M006/slices/S02/tasks/T02-SUMMARY.md
duration: 13m
verification_result: passed
completed_at: 2026-03-25
---

# S02: Landing Page FX Framing & Deploy

**Added FX Oracle Settlement feature card and expanded stats bar to the landing page, then deployed the full M006 build to EC2 — live at gherkinpay.lacertalabs.xyz with FX presets, post+crank oracle, and updated landing page.**

## What Happened

T01 added a 7th feature card ("FX Oracle Settlement") to the landing page capabilities grid with a description emphasizing cross-border forex settlement via live Pyth EUR/USD, GBP/USD, USD/JPY rate feeds. The stats bar was expanded from 4 to 5 items: "5 Condition types" bumped to "6" and a new "3 FX pairs" stat inserted in the second position for immediate judge visibility. Build passed clean.

T02 deployed the complete M006 build to EC2 via rsync (131 files), ran `npm install --legacy-peer-deps && npm run build` on the remote, and restarted the `gherkinpay-web` systemd service. The live URL returned HTTP 200 after a 5-second settle, serving all M006 features: FX presets in the condition builder, unified post+crank oracle flow, and the updated landing page.

## Verification

All four slice-level checks pass:

| # | Check | Result |
|---|-------|--------|
| 1 | `cd app/web && bun run build` exits 0 | ✅ 10 routes, no errors |
| 2 | `grep -c "FX" app/web/src/app/page.tsx` ≥ 2 | ✅ returns 3 |
| 3 | `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` = 200 | ✅ |
| 4 | `bun run build 2>&1 \| grep -i "error"` returns empty | ✅ no matches |

## New Requirements Surfaced

- none

## Deviations

T01 added a 5th stat ("3 FX pairs") in addition to bumping the condition type count from 5 to 6. The plan suggested either/or — the executor did both for maximum hackathon judge impact.

## Known Limitations

- The landing page is static content — it doesn't fetch live data from devnet. The stats are hardcoded.
- FX market hours affect the post+crank flow: outside trading hours, Pyth FX prices may be stale, causing crank failures. The UI shows a toast error but doesn't explain the market-hours constraint.

## Follow-ups

- none — this is the final slice of M006

## Files Created/Modified

- `app/web/src/app/page.tsx` — Added 7th FX Oracle Settlement feature card, expanded stats bar with "3 FX pairs" stat

## Forward Intelligence

### What the next slice should know
- M006 is complete. All four milestone success criteria are met: FX presets in condition builder, post+crank flow proven on devnet, landing page updated, app deployed and live.

### What's fragile
- EC2 deploy uses rsync + remote npm install — if a new dependency has native bindings incompatible with the EC2 Ubuntu image, the remote build will fail silently until the service restart.

### Authoritative diagnostics
- `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` — fastest live health check
- `ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 "sudo systemctl status gherkinpay-web"` — service state with recent logs

### What assumptions changed
- No assumptions changed — S02 was a straightforward content update + deploy as planned.
