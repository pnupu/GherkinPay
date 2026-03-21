---
id: T01
parent: S02
milestone: M003
provides:
  - useSignMultisig mutation hook
  - MultisigAction approval UI in condition card
key_files:
  - app/web/src/lib/mutations/sign-multisig.ts
  - app/web/src/components/condition-card.tsx
key_decisions:
  - MultisigAction extracted as separate sub-component to isolate wallet/mutation state from CrankAction
  - TransactionStatus rendered inside MultisigAction (not shared with other cranks) to avoid state collision
patterns_established:
  - Permissioned actions (multisig, webhook) get their own sub-components inside condition-card.tsx with dedicated mutation + wallet state
observability_surfaces:
  - "[GherkinPay] Signing multisig condition index=N" console log before RPC
  - "[GherkinPay] signMultisig tx: <sig>" on success
  - "[GherkinPay] signMultisig failed: <decoded>" on error with decodeAnchorError mapping codes 6005/6006
  - TransactionStatus component shows pending spinner, success with Explorer link, or decoded error
  - React Query cache key ["conditions", paymentPubkey] invalidated on success
duration: 8m
verification_result: passed
completed_at: 2026-03-20
blocker_discovered: false
---

# T01: Wire signMultisig mutation and multisig approval UI into condition card

**Add useSignMultisig mutation hook and interactive per-signer approval UI with wallet-gated Approve button in condition card**

## What Happened

Created `sign-multisig.ts` following the exact crank-time mutation pattern: eslint-disable header, `(program.methods as any).signMultisig()` with payment/conditionAccount/signer accounts, query invalidation on success, `decodeAnchorError` on error, and `[GherkinPay]` console logs.

In `condition-card.tsx`, extracted a `MultisigAction` sub-component that uses `useWallet()` to get the connected pubkey and `PublicKey.equals()` to find the signer index. The component renders a per-signer approval list with ✓/○ badges and a "you" tag for the connected wallet, then shows contextual action text: "Connect wallet to approve" (disconnected), "Not a signer for this condition" (wrong wallet), "You already approved ✓" (already signed), or an "Approve" button that triggers `signMultisig.mutate()`. TransactionStatus is rendered inside MultisigAction with its own mutation state.

## Verification

All task and applicable slice verification checks pass. Build completes with zero type errors.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run build` | 0 | ✅ pass | 2.1s |
| 2 | `test -f app/web/src/lib/mutations/sign-multisig.ts` | 0 | ✅ pass | <1s |
| 3 | `grep -q "useSignMultisig" app/web/src/components/condition-card.tsx` | 0 | ✅ pass | <1s |
| 4 | `grep -q "Approve" app/web/src/components/condition-card.tsx` | 0 | ✅ pass | <1s |
| 5 | `grep -q "useWallet" app/web/src/components/condition-card.tsx` | 0 | ✅ pass | <1s |
| 6 | `grep -q "\.equals(" app/web/src/components/condition-card.tsx` | 0 | ✅ pass | <1s |
| 7 | `grep -q "publicKey" app/web/src/components/condition-card.tsx` | 0 | ✅ pass | <1s |

### Slice-level checks status (intermediate — T02 remaining)

| Check | Status |
|-------|--------|
| `bun run build` exits 0 | ✅ pass |
| sign-multisig.ts exists | ✅ pass |
| confirm-webhook.ts exists | ⏳ T02 |
| useSignMultisig wired | ✅ pass |
| useConfirmWebhook wired | ⏳ T02 |
| "Approve" rendered | ✅ pass |
| webhook input rendered | ✅ pass (eventHash already in WebhookMeta) |
| useWallet/publicKey check | ✅ pass |
| .equals() comparison | ✅ pass |

## Diagnostics

- **Console logs:** Filter browser console for `[GherkinPay] signMultisig` to see approval attempts and outcomes
- **Error codes:** 6005 = "Signer is not in the multisig signer list", 6006 = "Signer has already approved" — both decoded and shown in TransactionStatus
- **Cache:** After successful approval, `["conditions", paymentPubkey]` query is invalidated so approval status refreshes automatically
- **Explorer:** TransactionStatus includes Solana Explorer link on success for tx inspection

## Deviations

- Extracted `MultisigAction` as a separate function component rather than inline JSX — this keeps wallet and mutation state isolated from the permissionless crank logic in `CrankAction`, and establishes a pattern for the webhook action in T02.
- `TransactionStatus` for non-multisig conditions is now conditionally rendered (`condition.type !== "multisig"`) to avoid rendering two TransactionStatus components for multisig conditions.

## Known Issues

None.

## Files Created/Modified

- `app/web/src/lib/mutations/sign-multisig.ts` — new mutation hook: useSignMultisig() with Anchor signMultisig RPC call, query invalidation, and error decoding
- `app/web/src/components/condition-card.tsx` — added useWallet/useSignMultisig imports, MultisigAction sub-component with per-signer approval list and wallet-gated Approve button, replaced multisig placeholder text
