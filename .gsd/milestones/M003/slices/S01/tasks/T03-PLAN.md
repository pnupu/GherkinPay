---
estimated_steps: 5
estimated_files: 8
---

# T03: Implement crank mutation hooks, wire crank buttons, and add error decoding

**Slice:** S01 — Permissionless Cranks
**Milestone:** M003

## Description

This task delivers the three permissionless crank operations — the core R011/R012/R013 requirements. Each crank gets a mutation hook, a button wired into the condition card, and human-readable error feedback. The oracle crank is the highest-risk due to Pyth PriceUpdateV2 account parsing and staleness constraints (MAX_PRICE_AGE_SECS = 60).

Key contract details from program source:
- **CrankTime** accounts: payment (read), condition_account (mut). Arg: condition_index (u8). Checks: payment.status == Active, conditionAccount.milestoneStatus == Active, condition is TimeBased, clock.unix_timestamp >= unlock_at.
- **CrankOracle** accounts: payment (read), condition_account (mut), price_feed (UncheckedAccount). Arg: condition_index (u8). Checks: price_feed data contains matching feed_id, price not stale (publish_time within 60s), confidence < 5% of price, operator.evaluate(price, target_value).
- **CrankTokenGate** accounts: payment (read), condition_account (mut), holder_token_account (InterfaceAccount<TokenAccount>). Arg: condition_index (u8). Checks: mint matches, owner matches holder, amount >= min_amount.

Error codes from error.rs: OraclePriceStale ("Oracle price is stale"), OracleConfidenceTooWide ("Oracle price confidence too wide"), ConditionTypeMismatch, ConditionIndexOutOfBounds, InvalidPaymentStatus, MilestoneNotActive, TokenBalanceInsufficient.

**Relevant skills:** react-best-practices

## Steps

1. Create `app/web/src/lib/errors.ts` — an error decoder utility. Map Anchor custom error code offsets to human-readable messages. Anchor custom errors start at 6000; the GherkinPayError enum variants map to 6000, 6001, etc. in order. Export `decodeAnchorError(error: unknown): string` that extracts the error code from AnchorError, ProgramError, or SendTransactionError and returns a user-friendly string. Fallback to raw message if code not recognized.

2. Create `app/web/src/components/transaction-status.tsx` — a reusable component for mutation feedback. Props: status ("idle" | "pending" | "success" | "error"), signature (string | null), error (string | null). Renders: idle → nothing, pending → spinner + "Submitting transaction…", success → green checkmark + "Transaction confirmed" + Solana Explorer link (devnet), error → red alert + decoded error message. Uses `role="status" aria-live="polite"` for programmatic observation.

3. Create `app/web/src/lib/mutations/crank-time.ts` — `useCrankTime()` mutation hook. Uses useMutation from @tanstack/react-query. Params: paymentPubkey (PublicKey), conditionAccountPubkey (PublicKey), conditionIndex (number). Builds accounts: payment, conditionAccount. Calls `program.methods.crankTime(conditionIndex).accounts({...}).rpc()`. On success: console.log `[GherkinPay] crankTime tx: {sig}`, invalidate `["conditions", paymentPubkey]`. On error: decode with decodeAnchorError.

4. Create `app/web/src/lib/mutations/crank-oracle.ts` — `useCrankOracle()` mutation hook. Same pattern as crankTime but adds priceFeed account. The price feed pubkey comes from the Oracle condition's `feed_account` field — this is the on-chain PriceUpdateV2 account that the contract expects. The UI reads the price feed account data at the same byte offsets the contract uses (price at 73-81, conf at 81-89, publish_time at 93-101) to show current price and staleness before cranking. Export a `parsePythPrice(data: Buffer)` helper for this. Show a warning badge on the condition card when publish_time is older than 60 seconds.

5. Create `app/web/src/lib/mutations/crank-token-gate.ts` — `useCrankTokenGate()` mutation hook. Adds holderTokenAccount account. The holder's token account is derived from the condition's `holder` and `required_mint` fields using getAssociatedTokenAddressSync with TOKEN_2022_PROGRAM_ID. Then update `app/web/src/components/condition-card.tsx` to wire all three crank buttons: show "Crank Time" button on TimeBased conditions when unlock_at < Date.now()/1000 and not met; show "Crank Oracle" button with current price + staleness on Oracle conditions when not met; show "Crank Token Gate" button on TokenGated conditions when not met. Each button triggers its mutation and shows TransactionStatus feedback. Already-met conditions show a green "Condition Met" badge with no action button.

## Must-Haves

- [ ] `useCrankTime()` sends crankTime transaction with correct accounts
- [ ] `useCrankOracle()` sends crankOracle transaction with price_feed account from condition data
- [ ] `useCrankTokenGate()` sends crankTokenGate transaction with derived holder token account
- [ ] Error decoder maps all GherkinPayError variants to user-readable messages
- [ ] TransactionStatus component renders pending/success/error states with Explorer link
- [ ] Crank buttons appear only when condition is not yet met and contextually appropriate
- [ ] Oracle condition card shows current price and staleness warning when > 60s
- [ ] Console logs follow `[GherkinPay] crank{Type} tx: {sig}` pattern
- [ ] `bun run build` exits 0

## Verification

- `cd app/web && bun run build` exits 0
- `test -f app/web/src/lib/mutations/crank-time.ts` — time crank exists
- `test -f app/web/src/lib/mutations/crank-oracle.ts` — oracle crank exists
- `test -f app/web/src/lib/mutations/crank-token-gate.ts` — token gate crank exists
- `test -f app/web/src/lib/errors.ts` — error decoder exists
- `grep -q "decodeAnchorError" app/web/src/lib/errors.ts` — decoder exported
- `grep -rq "useCrankTime\|useCrankOracle\|useCrankTokenGate" app/web/src/components/condition-card.tsx` — hooks wired into condition card

## Observability Impact

- Signals added/changed: `[GherkinPay] Cranking {type} condition index={N}` before RPC; `[GherkinPay] crank{Type} tx: {sig}` on success; `[GherkinPay] Crank failed: {decoded error}` on failure
- How a future agent inspects this: React Query devtools for `["conditions", pubkey]` cache; TransactionStatus `role="status"` element; browser console for [GherkinPay] prefixed logs
- Failure state exposed: decoded error message in TransactionStatus; staleness warning badge on oracle conditions; Anchor error code → human-readable mapping in errors.ts

## Inputs

- `app/web/src/lib/anchor.ts` — useAnchorProgram() from T01
- `app/web/src/lib/pda.ts` — PDA helpers from T01
- `app/web/src/lib/token.ts` — getUsdcAta, TOKEN_2022 imports from T01
- `app/web/src/lib/utils.ts` — cn() from T01
- `app/web/src/components/condition-card.tsx` — condition card component from T02
- `app/web/src/lib/queries/conditions.ts` — useConditions() from T02
- `app/web/src/app/(console)/agreements/[id]/page.tsx` — detail page from T02
- `programs/gherkin-pay/src/instructions/crank_time.rs` — CrankTime accounts struct reference
- `programs/gherkin-pay/src/instructions/crank_oracle.rs` — CrankOracle accounts struct, PythPriceData parsing offsets
- `programs/gherkin-pay/src/instructions/crank_token_gate.rs` — CrankTokenGate accounts struct
- `programs/gherkin-pay/src/error.rs` — GherkinPayError enum for error code mapping

## Expected Output

- `app/web/src/lib/errors.ts` — error decoder utility with decodeAnchorError()
- `app/web/src/components/transaction-status.tsx` — reusable transaction feedback component
- `app/web/src/lib/mutations/crank-time.ts` — useCrankTime() mutation hook
- `app/web/src/lib/mutations/crank-oracle.ts` — useCrankOracle() mutation hook with parsePythPrice()
- `app/web/src/lib/mutations/crank-token-gate.ts` — useCrankTokenGate() mutation hook
- `app/web/src/components/condition-card.tsx` — updated with crank buttons and TransactionStatus integration
- `app/web/src/app/(console)/agreements/[id]/page.tsx` — may need minor updates for mutation wiring
