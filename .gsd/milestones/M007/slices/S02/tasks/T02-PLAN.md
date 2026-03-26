---
estimated_steps: 5
estimated_files: 1
skills_used: []
---

# T02: Deploy to EC2 and Verify Live App

**Slice:** S02 — README Custody Section + EC2 Deploy
**Milestone:** M007

## Description

Deploy the full M007 build (S01's MPC badge components + S02's README changes) to the EC2 instance at `gherkinpay.lacertalabs.xyz`. This is the same rsync-based procedure proven in M005 and M006. The deploy covers `app/web/` only — the README is consumed on GitHub, not served by the Next.js app. After deploy, verify HTTP 200 and that MPC badges render on the agreement detail page at the live URL.

## Steps

1. Rsync `app/web/` from the worktree to EC2, excluding `node_modules`, `.next`, `.env`, and `bun.lock`:
   ```bash
   rsync -avz --delete \
     --exclude='node_modules' \
     --exclude='.next' \
     --exclude='.env' \
     --exclude='bun.lock' \
     app/web/ ubuntu@3.8.170.147:/opt/gherkinpay/app/web/ \
     -e "ssh -i ~/.ssh/gherkinpay-eic"
   ```
2. Remote install and build:
   ```bash
   ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 \
     "cd /opt/gherkinpay/app/web && npm install --legacy-peer-deps && npm run build"
   ```
3. Restart the systemd service:
   ```bash
   ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 \
     "sudo systemctl restart gherkinpay-web"
   ```
4. Wait ~10 seconds for the service to settle, then verify HTTP 200:
   ```bash
   sleep 10
   curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz
   ```
5. Use browser tools to navigate to an agreement detail page at the live URL and verify MPC badges are visible.

## Must-Haves

- [ ] rsync completes without errors
- [ ] Remote `npm run build` exits 0
- [ ] `systemctl is-active gherkinpay-web` returns `active`
- [ ] `curl` returns HTTP 200 at `https://gherkinpay.lacertalabs.xyz`
- [ ] MPC badges visible on agreement detail page at the live URL

## Verification

- `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` returns `200`
- `ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 "sudo systemctl is-active gherkinpay-web"` returns `active`
- Browser navigation to agreement detail page at live URL shows MPC badges next to wallet addresses

## Observability Impact

- Signals added/changed: no new application-level signals. The systemd service (`gherkinpay-web`) continues to emit Next.js stdout/stderr to journald.
- How a future agent inspects this: `ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 "journalctl -u gherkinpay-web -n 50 --no-pager"` shows recent logs; `systemctl status gherkinpay-web` shows process health and uptime.
- Failure state exposed: rsync exit code surfaces SSH/transfer failures; `npm run build` exit code surfaces compile errors (visible in SSH session output); `systemctl is-active` returns `inactive`/`failed` on service crash; `curl` returns non-200 on Nginx or app-level failure.

## Inputs

- `app/web/` — the full Next.js app directory from the worktree (includes S01's MPC badge components)
- `README.md` — modified by T01 (committed to branch, but not deployed to EC2 since README is GitHub-only)

## Expected Output

- `app/web/` — deployed to `/opt/gherkinpay/app/web/` on EC2 (remote, no local file changes)
