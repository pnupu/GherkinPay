# S02: Landing Page FX Framing & Deploy

**Goal:** Landing page highlights FX Oracle Settlement as a key institutional capability; all M006 features deployed and live.
**Demo:** Visit gherkinpay.lacertalabs.xyz → see FX Settlement feature card in capabilities grid and updated stats bar; FX presets and post+crank flow work at the live URL.

## Must-Haves

- FX Oracle Settlement feature card added to the `features` array in `page.tsx`
- Stats bar updated to reflect FX+crypto oracle coverage
- `bun run build` exits 0 in `app/web/`
- App deployed to EC2 via rsync + remote build + restart
- Live URL `https://gherkinpay.lacertalabs.xyz` returns 200

## Proof Level

- This slice proves: operational
- Real runtime required: yes (EC2 deploy)
- Human/UAT required: yes (visual check of live landing page)

## Verification

- `cd app/web && bun run build` exits 0
- `grep -c "FX" app/web/src/app/page.tsx` returns >= 2 (card title + description)
- `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` returns 200
- Build failure diagnostic: `cd app/web && bun run build 2>&1 | grep -i "error"` — should return empty on success; on failure surfaces the specific module/line

## Integration Closure

- Upstream surfaces consumed: S01's FX presets in `condition-builder.tsx`, `usePostAndCrankOracle` hook, `jito-ts: false` webpack alias in `next.config.js`
- New wiring introduced in this slice: none (content update + deploy only)
- What remains before the milestone is truly usable end-to-end: nothing — this is the final slice

## Tasks

- [x] **T01: Add FX Oracle Settlement feature card and update stats bar** `est:20m`
  - Why: R029 — surfaces FX capability prominently for hackathon judges. The landing page currently has 6 feature cards and generic stats; needs a 7th card for FX settlement and updated stats reflecting the expanded oracle feed coverage.
  - Files: `app/web/src/app/page.tsx`
  - Do: Append an FX Oracle Settlement entry to the `features` array (title, desc emphasizing cross-border FX settlement via Pyth FX rate feeds, icon). Update the stats bar — change "5 Condition types" to "6" (FX oracle is distinct from generic oracle), or replace one stat with "FX + Crypto" oracle coverage. Build with `cd app/web && bun run build`.
  - Verify: `cd app/web && bun run build` exits 0 AND `grep -c "FX" app/web/src/app/page.tsx` >= 2
  - Done when: Build passes, FX feature card present in page source, stats bar reflects expanded capability

- [x] **T02: Deploy M006 build to EC2 and verify live URL** `est:15m`
  - Why: R030 — judges need a live demo URL. All M006 features (FX presets, post+crank, landing page update) must be accessible at the production URL.
  - Files: `app/web/` (rsync source), remote `/opt/gherkinpay/app/web/`
  - Do: Rsync `app/web/` to EC2 (excluding node_modules, .next, .env, bun.lock). SSH to run `npm install --legacy-peer-deps && npm run build` on server. Restart `gherkinpay-web` systemd service. Verify live URL returns 200. **Note:** rsync from the worktree path directly — the built source is here. SSH key is at `~/.ssh/gherkinpay-eic`, server is `ubuntu@3.8.170.147`. Must get explicit user confirmation before executing any SSH/rsync commands (outward-facing action).
  - Verify: `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` returns 200
  - Done when: Live URL returns 200 and serves the updated landing page with FX feature card

## Observability / Diagnostics

- **Build output:** `cd app/web && bun run build` — build failure surfaces as non-zero exit with error trace to stdout/stderr.
- **Content verification:** `grep -c "FX" app/web/src/app/page.tsx` — confirms FX feature card is present in source (≥2 matches expected).
- **Live health:** `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` — returns 200 when deployed.
- **Failure path:** If the build fails, Next.js emits the failing module and line number. If the live URL returns non-200, check systemd service status on EC2 (`systemctl status gherkinpay-web`).

## Files Likely Touched

- `app/web/src/app/page.tsx`
