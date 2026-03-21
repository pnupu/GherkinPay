---
estimated_steps: 5
estimated_files: 3
---

# T02: Wire confirmWebhook mutation and webhook confirm UI into condition card

**Slice:** S02 — Permissioned Actions
**Milestone:** M003

## Description

Create the `useConfirmWebhook()` mutation hook and replace the placeholder text in the webhook branch of `CrankAction` with an interactive confirmation form gated on the connected wallet being the registered relayer. This delivers R015 (Webhook Confirmation).

The mutation hook follows the same pattern as `sign-multisig.ts` (T01) and `crank-time.ts` (S01). The key difference is the extra `eventHash` argument — a 32-element `number[]` (u8 array) converted from a 64-character hex string input.

The UI checks if the connected wallet equals `WebhookData.relayer` using `PublicKey.equals()`. When matched, it shows a hex input field + "Confirm" button. The input is validated to be exactly 64 hex characters before enabling submission.

## Steps

1. Add shadcn Input component: `cd app/web && bunx --bun shadcn@canary add input` (creates `src/components/ui/input.tsx`). If this fails, manually create a minimal Input component following the shadcn pattern from existing `button.tsx`.

2. Create `app/web/src/lib/mutations/confirm-webhook.ts`:
   - Export `useConfirmWebhook()` hook using `useMutation`
   - Params interface: `{ paymentPubkey: PublicKey, conditionAccountPubkey: PublicKey, conditionIndex: number, eventHash: number[] }`
   - `eventHash` is a 32-element array of u8 values
   - Call `(program.methods as any).confirmWebhook(conditionIndex, eventHash).accounts({ payment: paymentPubkey, conditionAccount: conditionAccountPubkey, relayer: program.provider.publicKey }).rpc()`
   - The `relayer` account is the connected wallet — Anchor's provider signs automatically
   - On success: invalidate `["conditions", paymentPubkey.toBase58()]`
   - On error: `decodeAnchorError` and console.error with `[GherkinPay]` prefix
   - Include the standard eslint-disable header

3. In `condition-card.tsx`, add `import { useConfirmWebhook } from "~/lib/mutations/confirm-webhook"` and `import { Input } from "~/components/ui/input"` (if not already imported)

4. In `CrankAction`, instantiate `useConfirmWebhook()` alongside existing hooks. Replace the webhook placeholder span with a `WebhookAction` inline component that:
   - If wallet disconnected (`!walletPubkey`): show "Connect wallet to confirm"
   - If wallet doesn't match relayer (`!new PublicKey(data.relayer).equals(walletPubkey)`): show "Only the registered relayer can confirm"
   - If wallet matches: show form with:
     - `Input` field for hex string (placeholder "64-character hex event hash")
     - Local state for the hex value (`useState<string>("")`)
     - Validation: enable "Confirm" button only when input is exactly 64 hex chars (regex `/^[0-9a-fA-F]{64}$/`)
     - On submit: convert hex to byte array via `Array.from(Buffer.from(hexValue, 'hex'))` and call `confirmWebhook.mutate()`
   - Add TransactionStatus feedback for the confirmWebhook mutation
   - Note: `useWallet()` was already added in T01; reuse the same `walletPubkey` variable

5. Verify: `cd app/web && bun run build` exits 0

## Must-Haves

- [ ] `useConfirmWebhook()` exported from `confirm-webhook.ts` with correct Anchor method call including eventHash arg
- [ ] Wallet identity check uses `PublicKey.equals()` comparing connected wallet to `WebhookData.relayer`
- [ ] Hex input validated to 64 characters before enabling "Confirm" button
- [ ] Hex-to-bytes conversion produces exactly 32-element u8 array
- [ ] Disconnected wallet shows "Connect wallet" message
- [ ] Non-relayer wallet shows "Only the registered relayer can confirm"
- [ ] TransactionStatus feedback wired to confirmWebhook mutation
- [ ] `bun run build` passes with zero type errors

## Verification

- `cd app/web && bun run build` exits 0
- `test -f app/web/src/lib/mutations/confirm-webhook.ts`
- `test -f app/web/src/components/ui/input.tsx`
- `grep -q "useConfirmWebhook" app/web/src/components/condition-card.tsx`
- `grep -q "eventHash\|event-hash\|Event Hash" app/web/src/components/condition-card.tsx`

## Observability Impact

- **Console logs:** `[GherkinPay] Confirming webhook condition index=N` before RPC, `[GherkinPay] confirmWebhook tx: <sig>` on success, `[GherkinPay] confirmWebhook failed: <decoded>` on error
- **Error codes:** 6019 = RelayerMismatch, 6020 = EventHashMismatch — both decoded by `decodeAnchorError` and shown in TransactionStatus
- **Cache:** After successful confirmation, `["conditions", paymentPubkey]` query is invalidated so condition `met` status refreshes automatically
- **Explorer:** TransactionStatus includes Solana Explorer link on success for tx inspection
- **Inspection:** WebhookAction sub-component has its own mutation state isolated from permissionless cranks

- `app/web/src/lib/mutations/sign-multisig.ts` — mutation hook pattern from T01 (same structure)
- `app/web/src/components/condition-card.tsx` — CrankAction component modified by T01 (webhook branch still has placeholder "Awaiting webhook relay"; `useWallet` already imported)
- `app/web/src/lib/queries/conditions.ts` — WebhookData type (relayer: string, eventHash: string as hex, met: boolean)
- `app/web/src/lib/errors.ts` — decodeAnchorError (already handles codes 6019 RelayerMismatch, 6020 EventHashMismatch)
- `app/web/src/lib/anchor.ts` — useAnchorProgram() hook

## Expected Output

- `app/web/src/lib/mutations/confirm-webhook.ts` — new mutation hook file
- `app/web/src/components/ui/input.tsx` — new shadcn Input component
- `app/web/src/components/condition-card.tsx` — modified with webhook confirm UI, useConfirmWebhook import, Input import
