# S01: Permissionless Cranks

**Goal:** User clicks an agreement row, sees live conditions, and can crank time/oracle/token gate conditions from the agreement detail view on devnet.
**Demo:** Navigate to /agreements, click an agreement row, see condition cards with status. Click "Crank" on a time condition (unlock_at in the past) and see it flip to met. Click "Crank Oracle" on an oracle condition and see Pyth price evaluation. Click "Crank Token Gate" and see balance verification.

## Must-Haves

- Wallet adapter + Anchor program client infrastructure (useAnchorProgram, PDA helpers, IDL types, WalletProvider)
- `/agreements/[id]` detail route using base58 payment pubkey as param (D010)
- `useConditions(paymentPubkey)` React Query hook returning parsed ConditionAccount data
- ConditionCard component with type-specific rendering for all 5 condition types (time, oracle, token gate, multisig, webhook)
- `useCrankTime()`, `useCrankOracle()`, `useCrankTokenGate()` mutation hooks
- Oracle crank reads PriceUpdateV2 at byte offsets 73-101 matching the contract (D011); shows staleness warning when publish_time > 60s old
- Program error decoder mapping anchor error codes (OraclePriceStale, ConditionTypeMismatch, etc.) to user-friendly messages
- Clickable agreement rows on list page linking to detail view
- shadcn UI components: Button, Table, Badge, Card, Skeleton, Dialog

## Proof Level

- This slice proves: integration (real on-chain transactions from browser UI)
- Real runtime required: yes (devnet Solana, Pyth feeds)
- Human/UAT required: no (all three cranks are permissionless — single wallet)

## Verification

- `cd app/web && bun run build` — exits 0 (no type errors, no build failures)
- `test -f app/web/src/app/\(console\)/agreements/\[id\]/page.tsx` — detail route exists
- `test -f app/web/src/lib/queries/conditions.ts` — conditions query hook exists
- `test -f app/web/src/lib/mutations/crank-time.ts` — time crank mutation exists
- `test -f app/web/src/lib/mutations/crank-oracle.ts` — oracle crank mutation exists
- `test -f app/web/src/lib/mutations/crank-token-gate.ts` — token gate crank mutation exists
- `test -f app/web/src/lib/errors.ts` — error decoder exists
- `grep -q "useCrankTime\|useCrankOracle\|useCrankTokenGate" app/web/src/app/\(console\)/agreements/\[id\]/page.tsx` — crank hooks wired into detail page
- Manual devnet: connect wallet → click agreement row → see conditions → crank time condition → see "met" badge

## Observability / Diagnostics

- Runtime signals: `[GherkinPay] Cranking {type} condition index={N}` console log before each crank RPC call; `[GherkinPay] crank{Type} tx: {sig}` on success; `[GherkinPay] Crank failed: {decoded error}` on failure
- Inspection surfaces: React Query cache keys `["conditions", paymentPubkey]` visible in devtools; TransactionStatus component with `role="status"` aria-live for programmatic observation; Solana Explorer link on success
- Failure visibility: decoded error messages in TransactionStatus (OraclePriceStale → "Oracle price is stale — feed data older than 60 seconds"); staleness warning on oracle condition card before crank attempt
- Redaction constraints: none (all data is on-chain public)

## Integration Closure

- Upstream surfaces consumed: `programs/gherkin-pay/src/lib.rs` (instruction signatures), `programs/gherkin-pay/src/state/condition.rs` (account layout + Condition enum), `programs/gherkin-pay/src/error.rs` (error codes), M001/M002 patterns (wallet adapter, Anchor client, React Query hooks, mutation pattern, PDA derivation)
- New wiring introduced in this slice: `/agreements/[id]` route + condition query infrastructure + crank mutation hooks + error decoder — all consumed by S02 for multisig/webhook actions
- What remains before the milestone is truly usable end-to-end: S02 (multisig signing, webhook confirmation), S03 (compliance management, relayer registration)

## Tasks

- [x] **T01: Install Solana dependencies and scaffold Anchor program client infrastructure** `est:1h30m`
  - Why: The M003 worktree has no wallet adapter, Anchor client, IDL, PDA helpers, or shadcn components — all M001/M002 infrastructure must be recreated before any S01 feature work can begin. Skills: react-best-practices.
  - Files: `app/web/package.json`, `app/web/src/idl/gherkin_pay.json`, `app/web/src/types/gherkin_pay.ts`, `app/web/src/lib/anchor.ts`, `app/web/src/lib/pda.ts`, `app/web/src/lib/constants.ts`, `app/web/src/lib/token.ts`, `app/web/src/lib/utils.ts`, `app/web/src/components/wallet-provider.tsx`, `app/web/src/components/wallet-button.tsx`, `app/web/src/app/layout.tsx`, `app/web/next.config.js`, `app/web/src/env.js`
  - Do: Install @solana/web3.js, @coral-xyz/anchor, @solana/wallet-adapter-react/base/wallets, shadcn canary components (Button, Table, Badge, Card, Skeleton, Dialog). Create IDL JSON + TS types from on-chain program. Create useAnchorProgram() hook, PDA derivation helpers (getPaymentPDA, getEscrowPDA, getConditionPDA), constants, token utils. Wire WalletProvider + ConnectionProvider into root layout. Add next.config.js webpack externals for Node.js polyfills. Create T3 env schema for NEXT_PUBLIC_SOLANA_RPC_URL.
  - Verify: `cd app/web && bun run build` exits 0
  - Done when: `bun run build` passes, wallet connect button renders in sidebar, useAnchorProgram returns typed Program instances

- [x] **T02: Create agreement detail page with useConditions() hook and condition card rendering** `est:1h30m`
  - Why: The agreement detail page at `/agreements/[id]` is the central surface for S01 (and S02). It must fetch ConditionAccount data, render type-specific condition cards, and show payment metadata — all with live on-chain data. Skills: react-best-practices, frontend-design.
  - Files: `app/web/src/lib/queries/conditions.ts`, `app/web/src/lib/queries/agreements.ts`, `app/web/src/components/condition-card.tsx`, `app/web/src/components/agreements-client.tsx`, `app/web/src/app/(console)/agreements/[id]/page.tsx`, `app/web/src/app/(console)/agreements/page.tsx`
  - Do: Create useConditions(paymentPubkey) React Query hook that fetches ConditionAccount(s) for a payment. Create useAgreements() query hook for the list page. Build AgreementsClient with clickable rows (Next.js Link to /agreements/[pubkey]). Build agreement detail page reading [id] param, fetching PaymentAgreement + conditions. Create ConditionCard component rendering all 5 condition types with type badge, metadata (unlock_at, feed_account, threshold, signers, relayer), and met/unmet status badge. Handle loading/error/empty states.
  - Verify: `cd app/web && bun run build` exits 0 and `test -f app/web/src/app/\(console\)/agreements/\[id\]/page.tsx`
  - Done when: Agreement list shows clickable rows; detail page renders payment info header and condition cards with type-specific metadata for all 5 condition types

- [ ] **T03: Implement crank mutation hooks, wire crank buttons, and add error decoding** `est:1h30m`
  - Why: The three permissionless crank operations (time, oracle, token gate) are the core R011/R012/R013 deliverables. Each needs a mutation hook, a button wired into the condition card, and human-readable error feedback. The oracle crank is the highest-risk due to Pyth price feed parsing and staleness constraints. Skills: react-best-practices.
  - Files: `app/web/src/lib/mutations/crank-time.ts`, `app/web/src/lib/mutations/crank-oracle.ts`, `app/web/src/lib/mutations/crank-token-gate.ts`, `app/web/src/lib/errors.ts`, `app/web/src/components/transaction-status.tsx`, `app/web/src/components/condition-card.tsx`, `app/web/src/app/(console)/agreements/[id]/page.tsx`
  - Do: Create useCrankTime mutation (payment + conditionAccount accounts, condition_index arg). Create useCrankOracle mutation (adds priceFeed account derived from condition's feed_account). Create useCrankTokenGate mutation (adds holderTokenAccount). Build errors.ts mapping anchor error code numbers to user-readable messages (OraclePriceStale → "Oracle price is stale", etc.). Add TransactionStatus component for mutation feedback. Wire crank buttons into ConditionCard — show "Crank Time" when unlock_at < now and not met, "Crank Oracle" with current price display and staleness warning, "Crank Token Gate" with balance context. Each button triggers its mutation and shows success/error via TransactionStatus. Console-log `[GherkinPay] crank{Type} tx: {sig}` on success.
  - Verify: `cd app/web && bun run build` exits 0 and `grep -q "useCrankTime\|useCrankOracle\|useCrankTokenGate" app/web/src/app/\(console\)/agreements/\[id\]/page.tsx || grep -rq "useCrankTime\|useCrankOracle\|useCrankTokenGate" app/web/src/components/condition-card.tsx`
  - Done when: Time crank button visible on TimeBased conditions when unlock_at is past; oracle crank button shows Pyth price and staleness; token gate crank button present; all three mutations send real transactions on devnet with decoded error feedback

## Files Likely Touched

- `app/web/package.json`
- `app/web/next.config.js`
- `app/web/src/env.js`
- `app/web/src/app/layout.tsx`
- `app/web/src/app/(console)/layout.tsx`
- `app/web/src/app/(console)/agreements/page.tsx`
- `app/web/src/app/(console)/agreements/[id]/page.tsx`
- `app/web/src/components/wallet-provider.tsx`
- `app/web/src/components/wallet-button.tsx`
- `app/web/src/components/agreements-client.tsx`
- `app/web/src/components/condition-card.tsx`
- `app/web/src/components/transaction-status.tsx`
- `app/web/src/components/ui/button.tsx`
- `app/web/src/components/ui/table.tsx`
- `app/web/src/components/ui/badge.tsx`
- `app/web/src/components/ui/card.tsx`
- `app/web/src/components/ui/skeleton.tsx`
- `app/web/src/components/ui/dialog.tsx`
- `app/web/src/idl/gherkin_pay.json`
- `app/web/src/idl/gherkin_pay_hook.json`
- `app/web/src/types/gherkin_pay.ts`
- `app/web/src/types/gherkin_pay_hook.ts`
- `app/web/src/lib/anchor.ts`
- `app/web/src/lib/pda.ts`
- `app/web/src/lib/constants.ts`
- `app/web/src/lib/token.ts`
- `app/web/src/lib/utils.ts`
- `app/web/src/lib/errors.ts`
- `app/web/src/lib/queries/agreements.ts`
- `app/web/src/lib/queries/conditions.ts`
- `app/web/src/lib/mutations/crank-time.ts`
- `app/web/src/lib/mutations/crank-oracle.ts`
- `app/web/src/lib/mutations/crank-token-gate.ts`
- `app/web/src/styles/globals.css`
