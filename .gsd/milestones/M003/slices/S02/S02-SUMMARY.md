---
id: S02
parent: M003
milestone: M003
provides:
  - useSignMultisig mutation hook for multisig condition approval
  - useConfirmWebhook mutation hook for webhook event hash confirmation
  - MultisigAction sub-component with per-signer approval status and wallet-gated Approve button
  - WebhookAction sub-component with hex input validation and wallet-gated Confirm form
  - shadcn Input component
requires:
  - slice: S01
    provides: Agreement detail page, condition-card.tsx CrankAction switch, useConditions query hook, mutation pattern (crank-time.ts), decodeAnchorError utility
affects:
  - S03
key_files:
  - app/web/src/lib/mutations/sign-multisig.ts
  - app/web/src/lib/mutations/confirm-webhook.ts
  - app/web/src/components/condition-card.tsx
  - app/web/src/components/ui/input.tsx
key_decisions:
  - D012: Permissioned actions extracted as separate sub-components (MultisigAction, WebhookAction) with dedicated mutation + wallet + TransactionStatus state, isolated from permissionless CrankAction
  - Webhook and multisig excluded from shared TransactionStatus to prevent state collision
patterns_established:
  - Permissioned action sub-component pattern: each wallet-gated action gets its own component with useWallet + useMutation + TransactionStatus, rendered conditionally by condition type
  - Wallet identity gating via useWallet().publicKey + PublicKey.equals() for on-chain permission checks
  - Hex input validation pattern: /^[0-9a-fA-F]{64}$/ regex + Buffer.from(hex, 'hex') conversion to u8 array
observability_surfaces:
  - "[GherkinPay] Signing multisig condition index=N" / "[GherkinPay] signMultisig tx: <sig>" console logs
  - "[GherkinPay] Confirming webhook condition index=N" / "[GherkinPay] confirmWebhook tx: <sig>" console logs
  - decodeAnchorError maps 6005 (SignerNotInList), 6006 (AlreadyApproved), 6019 (RelayerMismatch), 6020 (EventHashMismatch) to user-readable TransactionStatus messages
  - React Query cache key ["conditions", paymentPubkey] invalidated on success for both mutations
drill_down_paths:
  - .gsd/milestones/M003/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M003/slices/S02/tasks/T02-SUMMARY.md
duration: 13m
verification_result: passed
completed_at: 2026-03-20
---

# S02: Permissioned Actions

**Multisig signers can approve conditions with per-signer status tracking, and relayers can submit webhook event hash confirmations — both wallet-gated with decoded error feedback on the agreement detail view**

## What Happened

T01 created the `useSignMultisig()` mutation hook following the S01 crank-time pattern exactly (eslint-disable, `(program.methods as any).signMultisig()`, query invalidation, decodeAnchorError). In condition-card.tsx, a `MultisigAction` sub-component was extracted to isolate wallet and mutation state. It uses `useWallet().publicKey` with `PublicKey.equals()` to find the connected wallet's signer index, then renders: a per-signer approval list with ✓/○ badges and a "you" tag, contextual messages for disconnected/wrong-wallet/already-approved states, and an "Approve" button that triggers the on-chain signMultisig instruction. TransactionStatus lives inside MultisigAction with its own state.

T02 created the `useConfirmWebhook()` mutation hook with an additional `eventHash: number[]` argument (32-element u8 array). A `WebhookAction` sub-component follows the same isolation pattern as MultisigAction. It checks `PublicKey.equals()` against `WebhookData.relayer`, renders three states (disconnected, wrong wallet, or hex input + Confirm), validates hex strings against `/^[0-9a-fA-F]{64}$/`, and converts via `Array.from(Buffer.from(hex, 'hex'))`. The shadcn Input component was added for the hex field.

Both permissioned actions are excluded from the shared TransactionStatus that CrankAction uses, preventing mutation state collision.

## Verification

All 9 slice-level verification checks pass:

| Check | Result |
|-------|--------|
| `bun run build` exits 0 | ✅ |
| sign-multisig.ts exists | ✅ |
| confirm-webhook.ts exists | ✅ |
| input.tsx exists | ✅ |
| useSignMultisig wired in condition-card | ✅ |
| useConfirmWebhook wired in condition-card | ✅ |
| "Approve" button rendered | ✅ |
| Webhook input rendered | ✅ |
| useWallet/publicKey identity check present | ✅ |
| PublicKey.equals() comparison (not string) | ✅ |

## Requirements Advanced

- R014 (Multisig Signing) — fully delivered: signers see per-signer approval status, wallet-gated Approve button, decoded error feedback (6005/6006), and Explorer links on success
- R015 (Webhook Confirmation) — fully delivered: relayer sees hex input with validation, wallet-gated Confirm button, decoded error feedback (6019/6020), and Explorer links on success

## New Requirements Surfaced

- none

## Deviations

None — both tasks executed exactly as planned.

## Known Limitations

- Multisig flow requires manual wallet switching to test multi-signer approval (connect as signer 1 → approve → switch to signer 2 → approve) — this is inherent to the flow, not a bug
- No automated test coverage for wallet identity gating logic — verification is build-time type checking + manual UAT
- Webhook event hash must be known by the relayer out-of-band; no mechanism to discover or generate expected hashes from the UI

## Follow-ups

- none — S03 (Admin Flows) is the remaining slice and operates on separate pages

## Files Created/Modified

- `app/web/src/lib/mutations/sign-multisig.ts` — new: useSignMultisig() mutation hook with Anchor signMultisig RPC, query invalidation, error decoding
- `app/web/src/lib/mutations/confirm-webhook.ts` — new: useConfirmWebhook() mutation hook with eventHash byte array arg, Anchor confirmWebhook RPC, query invalidation, error decoding
- `app/web/src/components/condition-card.tsx` — modified: added MultisigAction and WebhookAction sub-components with wallet-gated UI, replaced placeholder text, excluded permissioned actions from shared TransactionStatus
- `app/web/src/components/ui/input.tsx` — new: shadcn Input component

## Forward Intelligence

### What the next slice should know
- S03 operates on completely separate pages (Compliance, Relayers) with no dependency on condition-card.tsx. It consumes only the M01/M02 foundation: useAnchorProgram, PDA helpers, mutation pattern, TransactionStatus.
- The mutation hook pattern is now well-established across 5 hooks (crank-time, crank-oracle, crank-token-gate, sign-multisig, confirm-webhook). Copy any of them as a template — they all follow: eslint-disable header, `(program.methods as any).instructionName()`, console logs with `[GherkinPay]` prefix, `decodeAnchorError` on failure, `queryClient.invalidateQueries` on success.

### What's fragile
- `condition-card.tsx` now has three rendering paths (CrankAction for permissionless, MultisigAction, WebhookAction) that must stay in sync with ConditionType enum changes — adding a new condition type requires updating the switch/conditional logic in the parent component

### Authoritative diagnostics
- Filter browser console for `[GherkinPay] signMultisig` or `[GherkinPay] confirmWebhook` to trace transaction attempts
- Error codes 6005/6006/6019/6020 are decoded and shown in TransactionStatus — if raw numeric codes appear instead, decodeAnchorError mapping is incomplete

### What assumptions changed
- No assumptions changed — S02 consumed S01 outputs exactly as the boundary map specified
