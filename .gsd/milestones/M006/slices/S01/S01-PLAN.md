# S01: FX Oracle Post+Crank

**Goal:** User can create a payment with an FX oracle condition (EUR/USD, GBP/USD, USD/JPY) and crank it using Pyth Hermes pull-model price data — proven on devnet.
**Demo:** Select Oracle condition → pick EUR/USD preset → form validates → create payment → click "Crank Oracle" → Hermes fetch + PriceUpdateV2 post + crank_oracle all succeed in one user action.

## Must-Haves

- Oracle presets accept hex feed IDs (fixes pre-existing bug where clicking any preset fails zod validation)
- EUR/USD, GBP/USD, USD/JPY appear as FX presets with correct decimals alongside existing crypto presets
- Hex feed IDs convert to on-chain PublicKeys correctly in `toConditionInput()`
- `usePostAndCrankOracle` hook fetches price from Hermes, posts PriceUpdateV2 via `@pythnetwork/pyth-solana-receiver`, then cranks oracle — all in one flow
- "Crank Oracle" button uses the post+crank hook for all oracle conditions (simplifies architecture vs maintaining two code paths)
- Oracle price display fetches from Hermes for current price (replaces on-chain getAccountInfo which doesn't work for pull-only feeds)
- Stale price errors surface "FX market may be closed" guidance
- `bun run build` exits 0

## Proof Level

- This slice proves: integration
- Real runtime required: yes (devnet + Hermes API)
- Human/UAT required: yes (wallet interaction to create + crank)

## Verification

- `cd app/web && bun run build` exits 0
- In browser: select Oracle → click EUR/USD preset → feedAccount field populates, form validates (no red errors)
- In browser: select Oracle → click SOL/USD preset → feedAccount field populates, form validates (crypto presets still work)
- In browser: create payment with EUR/USD oracle condition → fund → click "Crank Oracle" → transaction succeeds

## Observability / Diagnostics

- Runtime signals: `[GherkinPay] Post+crank oracle` console logs with feed ID, tx signature, and timing. Error path logs Hermes fetch failures and on-chain errors separately.
- Inspection surfaces: Browser console for mutation lifecycle; TransactionStatus component shows tx hash on success or decoded Anchor error on failure.
- Failure visibility: Hermes fetch errors surface as toast/status with "unable to fetch FX rate" message. Stale price errors surface as "FX market may be closed" guidance. Anchor errors decoded via existing `decodeAnchorError`.
- Redaction constraints: none (no secrets in oracle flow)

## Integration Closure

- Upstream surfaces consumed: `useAnchorProgram()` from `anchor.ts` (provider, connection, wallet), existing condition parsing from `conditions.ts`
- New wiring introduced in this slice: `@pythnetwork/pyth-solana-receiver` + `@pythnetwork/hermes-client` as npm deps; `usePostAndCrankOracle` hook composed into condition-card.tsx's CrankAction
- What remains before the milestone is truly usable end-to-end: Landing page update + deploy (S02)

## Tasks

- [x] **T01: Fix oracle hex feed ID plumbing and add FX presets** `est:1h`
  - Why: Clicking any oracle preset currently fails zod validation because the schema requires base58 but presets store hex. This blocks all oracle preset usage — both existing crypto and new FX. Must fix the validation pipeline before the post+crank hook can be tested.
  - Files: `app/web/src/components/condition-builder.tsx`, `app/web/src/components/create-payment-wizard.tsx`
  - Do: (1) Update `oracleSchema.feedAccount` to accept either base58 or 64-char hex strings. (2) Update `ORACLE_PRESETS` to strip `0x` prefix from existing crypto feed IDs, add EUR/USD, GBP/USD, USD/JPY presets with correct decimals (5, 5, 3). (3) Add a visual category separator ("Crypto" / "FX") in the preset buttons. (4) Update `toConditionInput()` in the wizard to detect hex feed IDs and convert via `new PublicKey(Buffer.from(hex, 'hex'))`. (5) When a preset is clicked, also auto-set the `decimals` field to match the preset. Constraint: hex IDs are 64 chars [0-9a-fA-F], base58 is 32-44 chars [1-9A-HJ-NP-Za-km-z]. The zod refinement should try both.
  - Verify: `cd app/web && bun run build` exits 0
  - Done when: Build passes, preset buttons populate feedAccount with hex strings that pass validation, decimals auto-fill from preset

- [x] **T02: Build post+crank oracle hook and wire into condition card** `est:2h`
  - Why: FX feeds don't exist on-chain until posted. The "Crank Oracle" button must fetch from Hermes, post PriceUpdateV2, then crank — all in one user action. Also, the current oracle price display tries to read a non-existent on-chain account for FX feeds.
  - Files: `app/web/package.json`, `app/web/src/lib/mutations/post-and-crank-oracle.ts` (new), `app/web/src/components/condition-card.tsx`, `app/web/src/lib/queries/conditions.ts`
  - Do: (1) Install `@pythnetwork/pyth-solana-receiver` and `@pythnetwork/hermes-client`. (2) Create `usePostAndCrankOracle` hook that: fetches latest price update from Hermes via `HermesClient.getLatestPriceUpdates()`, builds a `PythSolanaReceiver` transaction that posts the price update and includes `crankOracle` as a consumer instruction via `addPriceConsumerInstructions`, sends the transaction(s). Set `closeUpdateAccounts: false`. (3) Replace `useCrankOracle` usage in condition-card's CrankAction with `usePostAndCrankOracle` for all oracle conditions — simpler than maintaining two code paths since post+crank works for push-sponsored feeds too (just re-posts the price). (4) Rewrite `useOraclePrice` to fetch current price from Hermes instead of on-chain `getAccountInfo`. Use the feed ID bytes from the on-chain feedAccount Pubkey, convert back to hex for the Hermes query. (5) Add error handling: catch stale price errors and show "FX market may be closed" guidance. Disable crank button during pending mutation to prevent rapid re-clicks. Constraint: the hex feed ID for Hermes is derived from `feedAccount.toBytes()` → hex string. The `OracleData.feedAccount` is already a base58 string from `parseCondition()`.
  - Verify: `cd app/web && bun run build` exits 0
  - Done when: Build passes, "Crank Oracle" button calls post+crank hook, oracle price display shows live price from Hermes, stale/error states handled

## Files Likely Touched

- `app/web/src/components/condition-builder.tsx`
- `app/web/src/components/create-payment-wizard.tsx`
- `app/web/src/components/condition-card.tsx`
- `app/web/src/lib/mutations/post-and-crank-oracle.ts` (new)
- `app/web/src/lib/mutations/crank-oracle.ts` (may retain for utility exports)
- `app/web/src/lib/queries/conditions.ts`
- `app/web/package.json`
