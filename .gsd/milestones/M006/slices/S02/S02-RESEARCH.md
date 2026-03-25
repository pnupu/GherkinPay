# S02 Research: Landing Page FX Framing & Deploy

**Date:** 2026-03-25
**Depth:** Light — straightforward content update and known deploy procedure

## Summary

S02 adds an FX Oracle Settlement feature card to the landing page and deploys the full M006 build to EC2. The landing page is a single file (`app/web/src/app/page.tsx`) with a `features` array and a stats bar — adding the card is appending an object to the array and updating a stat value. The deploy procedure is documented in `infra/README.md` (main repo, gitignored): rsync → npm install → npm run build → systemctl restart.

No new libraries, no architectural decisions, no risky integration. The only real work is writing good copy for the FX card and executing the deploy commands.

## Recommendation

Single task is sufficient. Add the FX Settlement feature card to the `features` array, update the stats bar to reflect FX+crypto oracle coverage (e.g. "6 Feed types" or "FX + Crypto" instead of the current generic stats), build, and deploy. The card should emphasize institutional cross-border FX settlement via Pyth oracle feeds — this is the Track 3 differentiator.

## Implementation Landscape

### Key Files

- `app/web/src/app/page.tsx` — Landing page. Contains `features` array (6 cards currently) and stats bar (4 stats). Add 7th feature card for FX Oracle Settlement. Update stats to surface FX capability (e.g. change "5 Condition types" or add an FX-specific stat).
- `app/web/src/styles/globals.css` — Feature card grid is 4-col on desktop, 2-col at 980px, 1-col at 600px. A 7th card (4+3 layout) works fine with no CSS changes needed.
- `app/web/next.config.js` — Has `jito-ts: false` webpack alias from S01. No changes needed, but must be present for build to succeed.
- `infra/README.md` (main repo only, gitignored from worktree) — Full deploy procedure documented below.

### Deploy Procedure (from infra/README.md)

```bash
# 1. Build locally
cd app/web && bun run build

# 2. Rsync to server
rsync -avz --delete \
  --exclude 'node_modules' --exclude '.next' --exclude '.env' --exclude 'bun.lock' \
  -e "ssh -i ~/.ssh/gherkinpay-eic" \
  app/web/ ubuntu@3.8.170.147:/opt/gherkinpay/app/web/

# 3. Install + build on server
ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 \
  "cd /opt/gherkinpay/app/web && npm install --legacy-peer-deps && npm run build"

# 4. Restart
ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 \
  "sudo systemctl restart gherkinpay-web"

# 5. Verify
curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz
```

### Build Order

1. Edit `page.tsx` — add FX feature card + update stats
2. Local build verification (`cd app/web && bun run build`)
3. Deploy to EC2 via rsync + remote build + restart
4. Verify live URL returns 200

### Verification Approach

- `cd app/web && bun run build` exits 0
- `grep -c "FX" app/web/src/app/page.tsx` confirms FX card text is present
- `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` returns 200
- Visual check of landing page at live URL shows FX Settlement card

## Constraints

- EC2 deploy uses `npm install --legacy-peer-deps` (not bun) — the server doesn't have bun
- The rsync must run from the **main repo root** (not the worktree), since the worktree's `app/web/` path differs from the server's expected layout. The worktree changes need to be merged to the integration branch first, or rsync from the worktree path with appropriate source.
- `infra/README.md` exists only in the main repo (gitignored) — the worktree won't have it. Deploy commands reference the main repo.
- SSH key at `~/.ssh/gherkinpay-eic` is required for EC2 access

## Common Pitfalls

- **Deploying from worktree path** — The rsync source must be the built `app/web/` directory. If deploying from the worktree, adjust the rsync source path. Or merge to integration branch first and deploy from main repo.
- **7-card grid alignment** — 7 cards in a 4-col grid leaves 3 in the last row. This looks fine visually (left-aligned). No CSS change needed unless we want to center the orphan row, but that would be cosmetic gold-plating.
