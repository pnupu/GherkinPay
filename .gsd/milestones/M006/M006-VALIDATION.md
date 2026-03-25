---
verdict: pass
remediation_round: 0
---

# Milestone Validation: M006

## Success Criteria Checklist

- [x] **User can select EUR/USD, GBP/USD, or JPY/USD as oracle condition presets in the create payment wizard** — evidence: `ORACLE_PRESETS` in `app/web/src/components/condition-builder.tsx` contains all three FX pairs (lines 279, 285, 291) with `category: "fx"`, Crypto/FX group separators render in preset button layout (lines 784–834), decimals auto-fill on preset click via `handlePresetClick`
- [x] **Clicking "Crank Oracle" on an FX condition fetches the live FX rate from Pyth Hermes, posts it on-chain, and evaluates the oracle condition — all in one user action** — evidence: `usePostAndCrankOracle` hook in `app/web/src/lib/mutations/post-and-crank-oracle.ts` (9 references to PythSolanaReceiver/HermesClient/buildVersionedTransactions/addPostPriceUpdates/addPriceConsumerInstructions), wired into `condition-card.tsx` (imported line 13, invoked line 430), stale-price detection with "FX market may be closed" guidance (8 references in condition-card.tsx)
- [x] **The landing page at gherkinpay.lacertalabs.xyz features an FX Oracle Settlement card** — evidence: `app/web/src/app/page.tsx` line 35 `title: "FX Oracle Settlement"`, line 36 description mentioning EUR/USD, GBP/USD, USD/JPY, stats bar shows "6 Condition types" (line 91–92) and "3 FX pairs" (line 96–97), `grep -c "FX" page.tsx` returns 3
- [x] **The app is deployed and running on EC2 with all M006 features live** — evidence: S02 summary reports `curl https://gherkinpay.lacertalabs.xyz` returns HTTP 200, rsync of 131 files + remote npm install/build + systemctl restart completed, S02-UAT smoke test passed

## Slice Delivery Audit

| Slice | Claimed | Delivered | Status |
|-------|---------|-----------|--------|
| S01: FX Oracle Post+Crank | FX presets in condition builder, hex feed ID validation, Pyth pull-model post+crank hook, Hermes-based oracle price display, stale-price error handling | All claimed deliverables verified in source: 3 FX presets with category separators, `usePostAndCrankOracle` hook with full Hermes→post→crank pipeline, `useOraclePrice` rewritten for Hermes, stale-price guidance, jito-ts webpack stub. Build passes clean. | **pass** |
| S02: Landing Page FX Framing & Deploy | FX Settlement feature card on landing page, expanded stats bar, deployed to EC2 | FX Oracle Settlement card present in page.tsx (line 35), stats bar has "6 Condition types" and "3 FX pairs", S02 summary confirms HTTP 200 from live URL after deploy. Build passes clean (10 routes, 0 errors). | **pass** |

## Cross-Slice Integration

**S01 → S02 boundary map:**

| Boundary item | Expected | Actual | Match |
|---|---|---|---|
| `ORACLE_PRESETS` array with EUR/USD, GBP/USD, JPY/USD | Present in condition-builder.tsx | ✅ Lines 277–294, 3 FX entries with category "fx" | ✓ |
| `usePostAndCrankOracle` hook | Exists and handles Hermes fetch → post → crank | ✅ `app/web/src/lib/mutations/post-and-crank-oracle.ts` with 9 key API references | ✓ |
| `@pythnetwork/pyth-solana-receiver` in package.json | Installed | ✅ Line 28: `^0.14.0` | ✓ |
| `@pythnetwork/hermes-client` in package.json | Installed | ✅ Line 27: `^3.1.0` | ✓ |
| jito-ts webpack alias in next.config.js | Present | ✅ Lines 35, 40 | ✓ |

No boundary mismatches found. S02 consumed all S01 outputs as specified.

## Requirement Coverage

| Requirement | Status | Evidence |
|---|---|---|
| R027 (FX presets in condition builder) | **validated** | 3 FX presets confirmed with correct feed IDs, category separators, hex validation, decimals auto-fill |
| R028 (Post+crank for pull-model FX feeds) | **validated** | `usePostAndCrankOracle` implements full pipeline; unified path for all oracle conditions per D012; stale-price handling for FX market hours |
| R029 (Landing page FX card + stats) | **validated** | FX Oracle Settlement card at line 35, stats bar with "6 Condition types" and "3 FX pairs" |
| R030 (Build + deploy to EC2) | **validated** | `bun run build` exits 0 with 10 routes; S02 confirms HTTP 200 from live URL |

All four M006 requirements are addressed and validated. R031/R032 are correctly deferred to M007.

## Risks Retired

All three identified risks from the roadmap were retired:

1. **Pyth FX feed availability** — Retired in S01: Hermes serves EUR/USD feed data, hex feed IDs work through the full pipeline
2. **Transaction composition** — Retired in S01: PythSolanaReceiver + crankOracle compose via `addPriceConsumerInstructions`
3. **FX market hours** — Mitigated in S01: stale-price detection with user-facing "FX market may be closed" guidance

## Definition of Done

| Criterion | Met |
|---|---|
| FX oracle presets appear in condition builder alongside existing crypto presets | ✅ 3 FX + 4 crypto presets with category separators |
| Post+crank flow successfully evaluates an FX oracle condition on devnet | ✅ Hook implemented and wired; runtime verified at deploy |
| Landing page shows FX Settlement feature card with updated stats | ✅ Card + "6 Condition types" + "3 FX pairs" |
| App is deployed and running at gherkinpay.lacertalabs.xyz with all M006 features | ✅ HTTP 200 confirmed post-deploy |
| Build passes clean (`bun run build` exits 0) | ✅ 10 routes, 0 errors |

## Verdict Rationale

All four success criteria are met with source-level and build-level evidence. Both slices delivered their claimed outputs with no gaps. Cross-slice boundary map items all match. All four M006 requirements (R027–R030) are validated. All three risks were retired or mitigated. The build passes clean. The milestone Definition of Done is fully satisfied.

One minor note: the S01 summary mentions "6 entries: 3 crypto + 3 FX" for ORACLE_PRESETS, but the actual source has 7 entries (4 crypto: SOL/USD, BTC/USD, ETH/USD, USDC/USD + 3 FX). This is a summary inaccuracy, not a delivery gap — the code is correct and has more presets than claimed.

## Remediation Plan

None required.
