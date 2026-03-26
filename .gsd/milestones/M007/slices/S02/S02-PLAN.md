# S02: README Custody Section + EC2 Deploy

**Goal:** Document MPC custody provider compatibility in the README and deploy M007 (including S01's MPC badges) to the live EC2 instance.
**Demo:** The README on GitHub has a "Custody Integration" section visible when scrolling. The live app at gherkinpay.lacertalabs.xyz shows MPC badges on agreement detail pages.

## Must-Haves

- README contains a `### Custody Integration` subsection under `## Architecture` explaining MPC wallet compatibility, PDA-based escrow design, and listing Fireblocks/Fordefi/Anchorage as example providers
- Live app at `https://gherkinpay.lacertalabs.xyz` returns HTTP 200
- MPC badges visible on agreement detail pages at the live URL

## Proof Level

- This slice proves: operational
- Real runtime required: yes (EC2 deploy + live URL verification)
- Human/UAT required: no

## Verification

- `grep -c "Custody Integration" README.md` returns ≥ 1
- `grep -c "Fireblocks\|Fordefi\|Anchorage" README.md` returns ≥ 1
- `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` returns `200`
- `ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 "sudo systemctl is-active gherkinpay-web"` returns `active`
- Browser verification: navigate to agreement detail page at live URL, confirm MPC badges render
- `ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 "journalctl -u gherkinpay-web -n 5 --no-pager -p err -q"` returns empty (no recent error-level logs)

## Observability / Diagnostics

- Runtime signals: `systemctl is-active gherkinpay-web` on EC2 shows service state; `journalctl -u gherkinpay-web -n 50` shows recent logs including build errors or startup failures
- Inspection surfaces: `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` for HTTP-level health; `ssh` + `systemctl status gherkinpay-web` for process-level health
- Failure visibility: rsync exits non-zero on SSH failure; `npm run build` exits non-zero on compile errors (visible in SSH output); systemctl restart failure surfaces in `journalctl`
- Redaction constraints: SSH key path (`~/.ssh/gherkinpay-eic`) referenced but never echoed; no secrets in README content

## Integration Closure

- Upstream surfaces consumed: S01's MPC badge components (`mpc-badge.tsx`, `tooltip.tsx`) already integrated in agreement detail page; full `app/web/` build output
- New wiring introduced in this slice: none (README is additive prose; deploy uses existing rsync procedure)
- What remains before the milestone is truly usable end-to-end: nothing — S02 is the final slice

## Tasks

- [x] **T01: Add Custody Integration section to README** `est:15m`
  - Why: R032 requires the README to document MPC custody provider compatibility as an architectural differentiator for hackathon judges
  - Files: `README.md`
  - Do: Insert a `### Custody Integration` subsection between the Compliance Stack closing code fence (line 79) and `## Tech Stack` (line 80). Cover: (1) standard Ed25519 signers mean any MPC wallet works, (2) PDA-based escrow means custody keys only sign funding/release, (3) name Fireblocks, Fordefi, Anchorage as example providers. Keep under 20 lines, match existing README tone.
  - Verify: `grep -c "Custody Integration" README.md` ≥ 1 and `grep -c "Fireblocks\|Fordefi\|Anchorage" README.md` ≥ 1
  - Done when: README contains the Custody Integration section with MPC/provider content between Compliance Stack and Tech Stack

- [x] **T02: Deploy to EC2 and verify live app** `est:20m`
  - Why: R030 requires the live demo at gherkinpay.lacertalabs.xyz to reflect latest features (S01's MPC badges + S02's README). Judges need a working URL.
  - Files: `app/web/` (rsync source, no code changes)
  - Do: rsync `app/web/` to EC2, remote `npm install --legacy-peer-deps && npm run build`, `sudo systemctl restart gherkinpay-web`. Wait for settle, verify HTTP 200. Browser-verify MPC badges on agreement detail page at live URL.
  - Verify: `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` returns 200; browser shows MPC badges on agreement detail page
  - Done when: Live app returns HTTP 200 and MPC badges are visible on agreement detail pages

## Files Likely Touched

- `README.md`
- `app/web/` (rsync to EC2, no local code changes in S02)
