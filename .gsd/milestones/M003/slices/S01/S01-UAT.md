# S01: Permissionless Cranks — UAT

**Milestone:** M003
**Written:** 2026-03-20

## UAT Type

- UAT mode: mixed (artifact-driven build verification + live-runtime devnet testing)
- Why this mode is sufficient: Build verification proves type safety and compilation; live-runtime testing on devnet proves actual transaction flow for permissionless cranks that any wallet can trigger (no role-based access gating to verify)

## Preconditions

1. `cd app/web && bun run build` exits 0
2. Devnet Solana RPC accessible (default or via NEXT_PUBLIC_SOLANA_RPC_URL env var)
3. At least one PaymentAgreement with conditions exists on devnet (created via M002 flows or anchor test setup)
4. A Phantom or Solflare wallet extension installed in the browser with a devnet-funded wallet
5. `bun run dev` running in app/web (or production build served)

## Smoke Test

Navigate to `/agreements` with a connected wallet → table shows at least one row from devnet → click a row → detail page renders at `/agreements/[pubkey]` with condition cards.

## Test Cases

### 1. Wallet connection and agreement list

1. Open the app in browser, navigate to `/agreements`
2. Observe the "Connect your wallet" prompt
3. Click the wallet button in the sidebar
4. Connect a Phantom/Solflare wallet on devnet
5. **Expected:** Agreements table populates with on-chain PaymentAgreement data. Each row shows truncated pubkey, payment type badge (Simple/Milestone), amount with token, and status badge (Active/Completed/Cancelled).

### 2. Agreement detail page navigation

1. From the agreements list, click any table row
2. **Expected:** Browser navigates to `/agreements/[base58-pubkey]`. Page shows a payment header card with authority, payer, payee, token mint, amount, and status. Below the header, condition cards render in a grid.

### 3. Condition card type-specific rendering

1. On the detail page, inspect condition cards for each type present:
   - **TimeBased:** Shows "Time Lock" badge, formatted unlock date with relative label (e.g., "Mar 15, 2026 — 5 days ago"), met/pending status
   - **Oracle:** Shows "Oracle" badge, feed account (truncated pubkey), comparison operator (≥, ≤, >, <, =), target value scaled by exponent, met/pending status
   - **TokenGated:** Shows "Token Gate" badge, mint pubkey (truncated), minimum amount, met/pending status
   - **Multisig:** Shows "Multisig" badge, "X of Y approvals" progress, list of signer pubkeys, met/pending status
   - **Webhook:** Shows "Webhook" badge, relayer pubkey (truncated), met/pending status
2. **Expected:** Each card type displays its unique metadata fields correctly. Met conditions show a green "Met" badge; unmet show yellow "Pending".

### 4. Crank Time condition

1. Find a TimeBased condition where `unlock_at` is in the past and status is "Pending"
2. A "Crank Time" button should be visible on the card
3. Click "Crank Time"
4. Approve the transaction in the wallet popup
5. **Expected:** TransactionStatus shows spinner → green checkmark with "Transaction confirmed" and a Solana Explorer link. The condition card refreshes and shows "Met" badge. Browser console logs `[GherkinPay] Cranking timeBased condition index=N` then `[GherkinPay] crankTime tx: {signature}`.

### 5. Crank Time — future unlock (error case)

1. Find a TimeBased condition where `unlock_at` is in the future
2. **Expected:** No "Crank Time" button visible — the button only appears when unlock_at < now.

### 6. Crank Oracle condition

1. Find an Oracle condition that is "Pending"
2. Observe the oracle card shows: current Pyth price, the comparison operator and target, and staleness info
3. If the price feed is older than 60 seconds, a staleness warning badge should appear
4. Click "Crank Oracle"
5. Approve the transaction in the wallet popup
6. **Expected:** If price satisfies the condition's comparison + target, the condition flips to "Met". If price is stale (>60s), the transaction may fail with "Oracle price is stale — feed data older than 60 seconds" in the TransactionStatus error display. Console logs with `[GherkinPay]` prefix show the operation flow.

### 7. Crank Token Gate condition

1. Find a TokenGated condition that is "Pending"
2. A "Crank Token Gate" button should be visible
3. Click "Crank Token Gate"
4. Approve the transaction in the wallet popup
5. **Expected:** The mutation derives the holder's Associated Token Account for the condition's mint (using TOKEN_2022_PROGRAM_ID). If the holder's balance meets the minimum, condition flips to "Met". If balance is insufficient, a decoded error message appears in TransactionStatus.

### 8. Error decoding

1. Trigger any crank that should fail (e.g., crank a condition that's already met, or oracle crank with stale price)
2. **Expected:** TransactionStatus shows a human-readable error message (e.g., "Oracle price is stale", "Condition at the given index is not the expected type", "Payment agreement has already been completed") — not a raw hex error code or generic "Transaction failed".

### 9. Loading and empty states

1. Disconnect wallet, navigate to `/agreements`
2. **Expected:** "Connect your wallet to view agreements" prompt (not a spinner or error)
3. Reconnect wallet. If no agreements exist on devnet for any account:
4. **Expected:** "No agreements found" empty state message

## Edge Cases

### Already-met condition

1. Navigate to an agreement where a condition is already "Met"
2. **Expected:** The condition card shows "✓ Condition Met" with no crank button — no action available.

### Multiple conditions on same agreement

1. Navigate to an agreement with multiple conditions (e.g., time + oracle)
2. **Expected:** All conditions render as separate cards. Cranking one does not affect the display of others. After cranking, only the cranked condition refreshes to "Met".

### Invalid agreement pubkey in URL

1. Navigate to `/agreements/invalidpubkey123`
2. **Expected:** The page handles the error gracefully — shows an error state rather than crashing.

## Failure Signals

- Build fails (`bun run build` exits non-zero) — type errors or missing dependencies
- Agreement list shows empty when on-chain data exists — query hook or RPC issue
- Detail page shows no conditions — memcmp filter offset wrong or condition account layout mismatch
- Crank button click produces raw hex error instead of decoded message — error decoder not wired correctly
- Oracle card shows no price data — Pyth byte offset parsing mismatch
- Staleness warning never appears — isPriceStale threshold check broken
- TransactionStatus stays in pending state forever — mutation promise not resolving
- Console has no `[GherkinPay]` logs on crank — observability logging missing

## Not Proven By This UAT

- Multisig signing flow (S02 scope — requires wallet switching between multiple signers)
- Webhook confirmation (S02 scope — requires relayer wallet)
- Compliance management and relayer registration (S03 scope — separate pages)
- Evaluate & release after all conditions met (M003 milestone-level integration)
- Mobile wallet support (R019 — deferred)
- Real mainnet transactions (R021 — out of scope)

## Notes for Tester

- The devnet USDC mint in `token.ts` is `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr` — confirm this matches your devnet deployment. If wrong, condition queries may return empty.
- Oracle staleness is common on devnet Pyth feeds — if all oracle cranks fail with staleness, this is expected devnet behavior, not a bug. The staleness warning badge should be visible before attempting the crank.
- To create test data: use the M002 payment creation wizard to create agreements with various condition types, then fund them. Alternatively, use anchor CLI to create test fixtures.
- React Query devtools (if installed) can be used to inspect cache keys `["agreements"]`, `["conditions", pubkey]` for debugging data shape issues.
