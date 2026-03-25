---
estimated_steps: 5
estimated_files: 1
skills_used: []
---

# T02: Deploy M006 build to EC2 and verify live URL

**Slice:** S02 — Landing Page FX Framing & Deploy
**Milestone:** M006

## Description

Deploy the full M006 build (FX presets, post+crank oracle, updated landing page) to the EC2 production server at `gherkinpay.lacertalabs.xyz`. The deploy procedure is rsync → remote npm install → remote npm build → systemctl restart. Verify the live URL returns 200.

**IMPORTANT:** All SSH and rsync commands are outward-facing actions that affect production infrastructure. You MUST present the exact commands to the user and get explicit confirmation ("yes") before executing each step.

## Steps

1. Ensure `app/web/` has been built locally (T01 should have done this). If `.next/` doesn't exist under `app/web/`, run `cd app/web && bun run build`.
2. Present the rsync command to the user and wait for confirmation:
   ```bash
   rsync -avz --delete \
     --exclude 'node_modules' --exclude '.next' --exclude '.env' --exclude 'bun.lock' \
     -e "ssh -i ~/.ssh/gherkinpay-eic" \
     app/web/ ubuntu@3.8.170.147:/opt/gherkinpay/app/web/
   ```
   Note: run this from the worktree root `/Users/ilkka/GherkinPay/.gsd/worktrees/M006/`.
3. Present the remote build command to the user and wait for confirmation:
   ```bash
   ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 \
     "cd /opt/gherkinpay/app/web && npm install --legacy-peer-deps && npm run build"
   ```
4. Present the restart command to the user and wait for confirmation:
   ```bash
   ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 \
     "sudo systemctl restart gherkinpay-web"
   ```
5. Verify the live URL returns 200:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz
   ```

## Must-Haves

- [ ] Source files rsync'd to EC2 server
- [ ] Remote `npm install` and `npm run build` succeed
- [ ] `gherkinpay-web` service restarted
- [ ] Live URL returns HTTP 200

## Verification

- `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` returns 200

## Inputs

- `app/web/src/app/page.tsx` — updated landing page from T01
- `app/web/package.json` — includes S01 dependencies (`@pythnetwork/pyth-solana-receiver`, `@pythnetwork/hermes-client`)
- `app/web/next.config.js` — includes `jito-ts: false` webpack alias from S01

## Expected Output

- `app/web/` — deployed to remote `/opt/gherkinpay/app/web/` on EC2

## Observability Impact

- **Deploy health:** `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` — returns 200 when the service is up; non-200 means the build failed or the service didn't restart.
- **Service status:** `ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 "sudo systemctl status gherkinpay-web"` — shows active/failed state, recent logs, and PID on the EC2 host.
- **Remote build output:** The `npm run build` step emits a Next.js route table on success or an error trace with module/line on failure — this is the primary diagnostic for deploy-time build failures.
- **Failure path:** If live URL returns non-200 after restart, check `systemctl status gherkinpay-web` on EC2 for crash logs. If rsync fails, check SSH key permissions and EC2 security group.
