---
estimated_steps: 3
estimated_files: 1
skills_used: []
---

# T01: Add FX Oracle Settlement feature card and update stats bar

**Slice:** S02 — Landing Page FX Framing & Deploy
**Milestone:** M006

## Description

Add a 7th feature card to the landing page `features` array highlighting FX Oracle Settlement — cross-border FX settlement using Pyth pull-model oracle feeds for EUR/USD, GBP/USD, and USD/JPY. Update the stats bar to reflect the expanded oracle coverage (currently says "5 Condition types" — should be "6" now that FX oracle is a distinct preset category, or replace a stat to highlight FX+Crypto). Build and verify.

The card copy should emphasize institutional cross-border settlement and Pyth FX rate feeds — this is the Track 3 differentiator for StableHacks judging.

## Steps

1. Read `app/web/src/app/page.tsx` and identify the `features` array and the `landing-stats` section.
2. Append an FX Oracle Settlement entry to the `features` array. Use a geometric icon consistent with the existing set (e.g. `⬢` or `⎔`). The title should be "FX Oracle Settlement" and the description should emphasize cross-border FX settlement triggered by live Pyth EUR/USD, GBP/USD, USD/JPY rate feeds — institutional-grade forex settlement on Solana.
3. Update the stats bar: change the "5" Condition types stat to "6" (reflecting the addition of FX oracle as a distinct condition preset), OR add a more distinctive FX-specific stat. Use judgment — the goal is to surface FX capability to a judge scanning the page.
4. Run `cd app/web && bun run build` and confirm exit 0.

## Must-Haves

- [ ] FX Oracle Settlement feature card in the `features` array with title, description, and icon
- [ ] Stats bar updated to reflect FX/oracle expansion
- [ ] `bun run build` exits 0

## Verification

- `cd app/web && bun run build` exits 0
- `grep -c "FX" app/web/src/app/page.tsx` returns >= 2

## Inputs

- `app/web/src/app/page.tsx` — existing landing page with 6 feature cards and 4 stats

## Expected Output

- `app/web/src/app/page.tsx` — updated with 7th FX feature card and revised stats bar

## Observability Impact

- **Inspection surface:** `grep -c "FX" app/web/src/app/page.tsx` — returns ≥2 when FX card is present. Future agents can verify the card exists without building.
- **Build verification:** `cd app/web && bun run build` — confirms no JSX/TS errors introduced by the content change. Non-zero exit with error trace if broken.
- **No runtime signals changed** — this is a static content update, no new API endpoints, logs, or error states.
