---
id: T02
parent: S02
milestone: M003
provides:
  - useConfirmWebhook mutation hook
  - WebhookAction confirm UI in condition card
  - shadcn Input component
key_files:
  - app/web/src/lib/mutations/confirm-webhook.ts
  - app/web/src/components/condition-card.tsx
  - app/web/src/components/ui/input.tsx
key_decisions:
  - WebhookAction extracted as separate sub-component (same pattern as MultisigAction from T01) to isolate wallet/mutation state
  - Webhook excluded from shared TransactionStatus alongside multisig to prevent state collision
patterns_established:
  - Permissioned actions (multisig, webhook) each get their own sub-component with dedicated mutation + wallet state + TransactionStatus
observability_surfaces:
  - "[GherkinPay] Confirming webhook condition index=N" console log before RPC
  - "[GherkinPay] confirmWebhook tx: <sig>" on success
  - "[GherkinPay] confirmWebhook failed: <decoded>" on error with decodeAnchorError mapping codes 6019/6020
  - TransactionStatus component shows pending spinner, success with Explorer link, or decoded error
  - React Query cache key ["conditions", paymentPubkey] invalidated on success
duration: 5m
verification_result: passed
completed_at: 2026-03-20
blocker_discovered: false
---

# T02: Wire confirmWebhook mutation and webhook confirm UI into condition card

**Add useConfirmWebhook mutation hook and interactive wallet-gated webhook confirmation form with hex input validation in condition card**

## What Happened

Created `confirm-webhook.ts` following the exact sign-multisig/crank-time mutation pattern: eslint-disable header, `(program.methods as any).confirmWebhook(conditionIndex, eventHash)` with payment/conditionAccount/relayer accounts, query invalidation on success, `decodeAnchorError` on error, and `[GherkinPay]` console logs.

Added shadcn Input component via `bunx --bun shadcn@canary add input`.

In `condition-card.tsx`, extracted a `WebhookAction` sub-component that uses `useWallet()` to get the connected pubkey and `PublicKey.equals()` to check if it matches `WebhookData.relayer`. The component renders three states: "Connect wallet to confirm" (disconnected), "Only the registered relayer can confirm" (wrong wallet), or a hex input + "Confirm" button (matching relayer). The hex input is validated against `/^[0-9a-fA-F]{64}$/` before enabling submission. On confirm, the hex string is converted to a 32-element u8 array via `Array.from(Buffer.from(hex, 'hex'))`. TransactionStatus is rendered inside WebhookAction with its own mutation state, and webhook is excluded from the shared TransactionStatus (same pattern as multisig).

## Verification

All task verification checks and all slice-level verification checks pass. Build completes with zero type errors. This is the final task of S02 — all slice checks are green.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run build` | 0 | ✅ pass | 2.0s |
| 2 | `test -f app/web/src/lib/mutations/confirm-webhook.ts` | 0 | ✅ pass | <1s |
| 3 | `test -f app/web/src/components/ui/input.tsx` | 0 | ✅ pass | <1s |
| 4 | `grep -q "useConfirmWebhook" app/web/src/components/condition-card.tsx` | 0 | ✅ pass | <1s |
| 5 | `grep -q "eventHash\|event-hash\|Event Hash" app/web/src/components/condition-card.tsx` | 0 | ✅ pass | <1s |
| 6 | `test -f app/web/src/lib/mutations/sign-multisig.ts` | 0 | ✅ pass | <1s |
| 7 | `grep -q "useSignMultisig" app/web/src/components/condition-card.tsx` | 0 | ✅ pass | <1s |
| 8 | `grep -q "Approve" app/web/src/components/condition-card.tsx` | 0 | ✅ pass | <1s |
| 9 | `grep -q "useWallet\|publicKey" app/web/src/components/condition-card.tsx` | 0 | ✅ pass | <1s |
| 10 | `grep -q "\.equals(" app/web/src/components/condition-card.tsx` | 0 | ✅ pass | <1s |

### Slice-level checks status (final — all pass)

| Check | Status |
|-------|--------|
| `bun run build` exits 0 | ✅ pass |
| sign-multisig.ts exists | ✅ pass |
| confirm-webhook.ts exists | ✅ pass |
| useSignMultisig wired | ✅ pass |
| useConfirmWebhook wired | ✅ pass |
| "Approve" rendered | ✅ pass |
| webhook input rendered | ✅ pass |
| useWallet/publicKey check | ✅ pass |
| .equals() comparison | ✅ pass |

## Diagnostics

- **Console logs:** Filter browser console for `[GherkinPay] confirmWebhook` to see confirmation attempts and outcomes
- **Error codes:** 6019 = "Relayer mismatch", 6020 = "Event hash mismatch" — both decoded and shown in TransactionStatus
- **Cache:** After successful confirmation, `["conditions", paymentPubkey]` query is invalidated so condition `met` status refreshes automatically
- **Explorer:** TransactionStatus includes Solana Explorer link on success for tx inspection

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `app/web/src/lib/mutations/confirm-webhook.ts` — new mutation hook: useConfirmWebhook() with Anchor confirmWebhook RPC call including eventHash byte array arg, query invalidation, and error decoding
- `app/web/src/components/ui/input.tsx` — new shadcn Input component installed via CLI
- `app/web/src/components/condition-card.tsx` — added useConfirmWebhook/Input imports, WebhookAction sub-component with wallet-gated hex input + Confirm button, excluded webhook from shared TransactionStatus
