# S02: Landing Page FX Framing & Deploy — UAT

**Milestone:** M006
**Written:** 2026-03-25

## UAT Type

- UAT mode: mixed (artifact-driven for content, live-runtime for deploy)
- Why this mode is sufficient: T01 is a static content change verifiable by source inspection and build; T02 requires live URL verification.

## Preconditions

- Build has been run locally: `cd app/web && bun run build` exits 0
- EC2 instance is reachable: `ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 "echo ok"` returns "ok"
- DNS for `gherkinpay.lacertalabs.xyz` resolves to the EC2 instance

## Smoke Test

`curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` returns 200.

## Test Cases

### 1. FX Oracle Settlement feature card is present in page source

1. Open `app/web/src/app/page.tsx`
2. Search for "FX Oracle Settlement" in the `features` array
3. **Expected:** A feature object with title "FX Oracle Settlement" and a description mentioning cross-border forex settlement and Pyth FX rate feeds exists as the 7th entry in the array

### 2. Stats bar reflects expanded capability

1. Open `app/web/src/app/page.tsx`
2. Find the stats bar section (array of stat objects with `value` and `label` properties)
3. **Expected:** Stats include "6" for "Condition types" (up from 5) and "3" for "FX pairs" as a distinct stat. Total stats count is 5.

### 3. Build passes clean with FX content

1. Run `cd app/web && bun run build`
2. **Expected:** Exit code 0, all 10 routes generated, no "error" lines in output

### 4. Live URL returns 200

1. Run `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz`
2. **Expected:** HTTP 200

### 5. Live landing page shows FX feature card

1. Open `https://gherkinpay.lacertalabs.xyz` in a browser
2. Scroll to the capabilities/features grid
3. **Expected:** 7 feature cards are visible, including one titled "FX Oracle Settlement" with a description about cross-border forex settlement

### 6. Live landing page shows updated stats bar

1. On the same page, locate the stats bar (typically near the hero section)
2. **Expected:** Stats bar shows "6 Condition types" and "3 FX pairs" among the stats

### 7. FX presets visible in condition builder (deploy includes S01 work)

1. Connect a wallet at the live URL
2. Navigate to create a new payment agreement
3. Add an Oracle condition
4. **Expected:** Preset dropdown includes EUR/USD, GBP/USD, and JPY/USD options alongside existing crypto presets (SOL/USD, BTC/USD, ETH/USD)

## Edge Cases

### 8. Landing page loads without wallet connection

1. Open `https://gherkinpay.lacertalabs.xyz` in a fresh incognito window (no wallet connected)
2. **Expected:** Landing page renders fully — feature cards, stats bar, hero section all visible without requiring wallet connection

### 9. Service recovery after restart

1. SSH to EC2: `ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147`
2. Run `sudo systemctl restart gherkinpay-web`
3. Wait 10 seconds
4. Run `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz`
5. **Expected:** Returns 200 — service recovers cleanly after restart
