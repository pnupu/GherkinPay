# S02: Permissioned Actions

**Goal:** Multisig signers can approve conditions and relayers can confirm webhook conditions from the agreement detail view
**Demo:** A connected wallet that is in a multisig signer list sees an "Approve" button with per-signer approval status; a connected wallet matching a webhook relayer sees a hex input + "Confirm" button — both trigger on-chain transactions with decoded error feedback

## Must-Haves

- `useSignMultisig()` mutation hook following S01 crank pattern (eslint-disable, `(program.methods as any)`, query invalidation, error decoding)
- `useConfirmWebhook()` mutation hook with `eventHash` byte array arg
- Wallet identity gating: multisig "Approve" button only when connected wallet is in `signers[]` and hasn't approved yet; webhook "Confirm" form only when connected wallet equals `relayer`
- Per-signer approval status display showing who has signed and who hasn't
- Hex input validation (64 chars / 32 bytes) before webhook submission
- Graceful disconnected-wallet state ("Connect wallet to …" message)
- R014 (Multisig Signing) fully delivered
- R015 (Webhook Confirmation) fully delivered

## Proof Level

- This slice proves: integration
- Real runtime required: yes (devnet transactions for full proof; build verification for code correctness)
- Human/UAT required: yes (multisig flow requires wallet switching)

## Verification

- `cd app/web && bun run build` exits 0 (no type errors)
- `test -f app/web/src/lib/mutations/sign-multisig.ts` — mutation hook exists
- `test -f app/web/src/lib/mutations/confirm-webhook.ts` — mutation hook exists
- `grep -q "useSignMultisig" app/web/src/components/condition-card.tsx` — hook wired
- `grep -q "useConfirmWebhook" app/web/src/components/condition-card.tsx` — hook wired
- `grep -q "Approve" app/web/src/components/condition-card.tsx` — multisig button rendered
- `grep -q "eventHash\|event-hash\|Event Hash" app/web/src/components/condition-card.tsx` — webhook input rendered
- `grep -q "useWallet\|publicKey" app/web/src/components/condition-card.tsx` — wallet identity check present
- `grep -q "\.equals(" app/web/src/components/condition-card.tsx` — PublicKey comparison (not string compare)

## Observability / Diagnostics

- Runtime signals: `[GherkinPay]` console logs before/after `signMultisig` and `confirmWebhook` calls, with tx signature on success and decoded error on failure
- Inspection surfaces: `TransactionStatus` component shows pending/success/error with Solana Explorer link; React Query cache keys `["conditions", paymentPubkey]` reflect updated approval state after invalidation
- Failure visibility: `decodeAnchorError` maps SignerNotInList (6005), AlreadyApproved (6006), RelayerMismatch (6019), EventHashMismatch (6020) to user-readable messages in TransactionStatus
- Redaction constraints: none

## Integration Closure

- Upstream surfaces consumed: `condition-card.tsx` (CrankAction switch), `conditions.ts` (MultisigData/WebhookData types), `errors.ts` (decodeAnchorError), `anchor.ts` (useAnchorProgram), `transaction-status.tsx` (TransactionStatus), mutation pattern from `crank-time.ts`
- New wiring introduced in this slice: two new mutation hook imports in condition-card.tsx, `useWallet()` import for identity gating, shadcn Input component for webhook hex input
- What remains before the milestone is truly usable end-to-end: S03 (compliance management + relayer registration)

## Tasks

- [x] **T01: Wire signMultisig mutation and multisig approval UI into condition card** `est:25m`
  - Why: Delivers R014 — multisig signers need to approve conditions from the agreement detail view with per-signer status tracking
  - Files: `app/web/src/lib/mutations/sign-multisig.ts`, `app/web/src/components/condition-card.tsx`
  - Do: Create `useSignMultisig()` mutation hook following `crank-time.ts` pattern exactly; in CrankAction, replace the multisig placeholder span with wallet-gated "Approve" button — use `useWallet().publicKey` and `PublicKey.equals()` to check if connected wallet is in `MultisigData.signers[]`, find the signer index, check `approvals[index]`; show per-signer approval list (truncated pubkeys with ✓/○ status); show "Connect wallet" message when disconnected; handle already-approved and condition-met states
  - Verify: `cd app/web && bun run build` exits 0; `grep -q "useSignMultisig" app/web/src/components/condition-card.tsx`; `grep -q "Approve" app/web/src/components/condition-card.tsx`
  - Done when: Multisig condition card shows per-signer approval status and an "Approve" button for connected signers who haven't yet approved, with TransactionStatus feedback

- [x] **T02: Wire confirmWebhook mutation and webhook confirm UI into condition card** `est:25m`
  - Why: Delivers R015 — relayers need to submit event hash confirmations from the agreement detail view with hex input validation
  - Files: `app/web/src/lib/mutations/confirm-webhook.ts`, `app/web/src/components/condition-card.tsx`, `app/web/src/components/ui/input.tsx`
  - Do: Add shadcn Input component (`bunx --bun shadcn@canary add input`); create `useConfirmWebhook()` mutation hook following `crank-time.ts` pattern but with extra `eventHash: number[]` arg (32-element u8 array); in CrankAction, replace the webhook placeholder span with wallet-gated confirm form — use `useWallet().publicKey` and `PublicKey.equals()` to check if connected wallet matches `WebhookData.relayer`; render hex input + "Confirm" button; validate 64-char hex string before submission; convert hex to byte array via `Array.from(Buffer.from(hex, 'hex'))`; show "Connect wallet" message when disconnected and "Only the registered relayer can confirm" when wrong wallet
  - Verify: `cd app/web && bun run build` exits 0; `grep -q "useConfirmWebhook" app/web/src/components/condition-card.tsx`; `test -f app/web/src/components/ui/input.tsx`
  - Done when: Webhook condition card shows hex input + "Confirm" button for the registered relayer wallet, validates input length, and shows TransactionStatus feedback

## Files Likely Touched

- `app/web/src/lib/mutations/sign-multisig.ts` (new)
- `app/web/src/lib/mutations/confirm-webhook.ts` (new)
- `app/web/src/components/condition-card.tsx` (modify — CrankAction switch + imports)
- `app/web/src/components/ui/input.tsx` (new — shadcn component)
