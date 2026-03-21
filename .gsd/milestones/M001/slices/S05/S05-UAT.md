# S05: Compliance and Relayers — Live Reads — UAT

**Milestone:** M001
**Written:** 2026-03-20

## UAT Type

- UAT mode: mixed (artifact-driven for build/type checks + live-runtime for visual states)
- Why this mode is sufficient: Build verification proves type safety and no regressions; live-runtime confirms the four compliance page states render correctly and the relayers page shows no mock data.

## Preconditions

- `cd app/web && bun run dev` running on localhost:3000
- Browser with Phantom or Solflare extension installed
- Wallet configured for Solana devnet
- No compliance entries need to exist on devnet (empty state is valid)

## Smoke Test

Navigate to `/compliance` without a wallet connected → page renders with a "Connect your wallet" prompt and no errors in browser console.

## Test Cases

### 1. Compliance page — wallet disconnected state

1. Ensure no wallet is connected (disconnect if needed).
2. Navigate to `/compliance`.
3. **Expected:** Page shows header "Compliance" with subtitle. Body shows a prompt to connect wallet. No table rendered. No console errors.

### 2. Compliance page — loading state

1. Connect wallet via sidebar button.
2. Navigate to `/compliance` (or refresh).
3. **Expected:** Skeleton rows briefly appear while the RPC call resolves. React Query devtools (if open) show `["compliance"]` query in `fetching` state.

### 3. Compliance page — empty data state

1. Connect wallet to devnet where no ComplianceEntry accounts exist for the hook program.
2. Navigate to `/compliance`.
3. **Expected:** After loading, page shows "No compliance entries found" informational message. No table rows. No error styling.

### 4. Compliance page — data state (if entries exist)

1. Connect wallet to devnet where ComplianceEntry accounts have been created via the hook program.
2. Navigate to `/compliance`.
3. **Expected:** Table renders with rows. Each row shows a truncated account pubkey and an "Allowed" (green) or "Blocked" (red/destructive) badge based on `isAllowed` field.

### 5. Compliance page — error state

1. Modify the RPC endpoint to an invalid URL (e.g., via env var or browser devtools network throttling to offline).
2. Navigate to `/compliance` with wallet connected.
3. **Expected:** Red error message appears with "Failed to load" text and the error message from the failed RPC call.

### 6. Relayers page — static placeholder

1. Navigate to `/relayers`.
2. **Expected:** Page shows header "Relayers" with subtitle "Webhook attestation and oracle trigger workers". Body shows centered "Relayer Management" heading with text about future availability. No table, no data rows, no mock entries.

### 7. Build and type safety

1. Run `cd app/web && bun run build`.
2. Run `cd app/web && bun run typecheck`.
3. **Expected:** Both exit 0 with no errors.

## Edge Cases

### RPC timeout on compliance fetch

1. Connect wallet on a slow/congested devnet RPC.
2. Navigate to `/compliance`.
3. **Expected:** Loading skeletons persist until response arrives or React Query retries on failure. No unhandled promise rejection in console.

### Rapid page switching

1. Connect wallet, navigate to `/compliance`, then immediately switch to `/relayers` and back.
2. **Expected:** No stale data flash. React Query cache serves compliance data on return visit without refetch (within stale time).

## Failure Signals

- Console errors mentioning `hookProgram` being null or undefined when wallet is connected
- Table rendering with hardcoded mock data instead of live accounts
- `@/` import errors in build output
- Type errors referencing `complianceEntry` not existing on `AccountNamespace<Idl>` (would indicate missing Program<GherkinPayHook> cast)
- Relayers page showing any data rows or a `relayers =` array in source

## Not Proven By This UAT

- That ComplianceEntry accounts are correctly created by the hook program (contract testing scope)
- That the compliance page correctly decodes PDA seeds to show mint/wallet addresses (not implemented — only pubkey + isAllowed shown)
- That relayer registration works (M003 scope)
- Performance under large numbers of compliance entries

## Notes for Tester

- On a fresh devnet with no compliance entries, the empty state is the expected happy path — this is correct behavior, not a bug.
- The compliance page uses the **hook program** (gherkin_pay_hook), not the main program. Verify in network tab that RPC calls target program ID `3pG9tTyExGA3C7sdvw5AcUvfmwydtRCLV22KPb6SfYRc`.
- The relayers page is intentionally static — it should render as a server component (○ in build output, not ƒ).
