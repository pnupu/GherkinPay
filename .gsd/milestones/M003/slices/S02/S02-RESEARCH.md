# S02: Permissioned Actions — Research

**Date:** 2026-03-20

## Summary

S02 adds two permissioned condition actions to the existing agreement detail view: multisig signing and webhook confirmation. Both follow the exact mutation hook pattern established in S01 (eslint-disable header, `(program.methods as any).methodName()`, `queryClient.invalidateQueries` on success, `decodeAnchorError` on error). The error decoder already handles all relevant error codes (SignerNotInList 6005, AlreadyApproved 6006, RelayerMismatch 6019, EventHashMismatch 6020).

The `ConditionCard` component already renders `MultisigMeta` and `WebhookMeta` with full metadata display (signer list, approval progress, relayer pubkey, event hash). The `CrankAction` area currently shows placeholder text ("Requires signer approvals" / "Awaiting webhook relay") for these two types — S02 replaces these with interactive action components gated on the connected wallet's identity.

The only new complexity beyond the S01 pattern is wallet identity checking (connected wallet must be in `signers[]` for multisig, or must equal `relayer` for webhook) and hex-to-bytes conversion for the webhook event hash input. Both are straightforward.

## Recommendation

**Two tasks: (T01) signMultisig mutation + multisig approval UI, (T02) confirmWebhook mutation + webhook confirm UI.** Both modify the same `CrankAction` switch in `condition-card.tsx` but are logically independent. T01 first — it's slightly more complex (signer position discovery, approval progress tracking) and covers R014. T02 covers R015.

Alternatively, a single task could handle both since the total code is ~150 lines across 3 files. The planner should decide based on preferred granularity.

## Implementation Landscape

### Key Files

**Existing (read, extend):**
- `app/web/src/components/condition-card.tsx` — The `CrankAction` component has a switch block for condition types. Lines for `multisig` and `webhook` currently render placeholder `<span>` text. Replace with interactive components. `MultisigMeta` already shows signers/threshold/approvals. `WebhookMeta` already shows relayer/eventHash.
- `app/web/src/lib/errors.ts` — Already maps codes 6005 (SignerNotInList), 6006 (AlreadyApproved), 6019 (RelayerMismatch), 6020 (EventHashMismatch). No changes needed.
- `app/web/src/lib/queries/conditions.ts` — Exports `MultisigData` (signers: string[], threshold: number, approvals: boolean[], met: boolean) and `WebhookData` (relayer: string, eventHash: string as hex, met: boolean). No changes needed.
- `app/web/src/components/transaction-status.tsx` — Reused as-is for both mutations.
- `app/web/src/lib/anchor.ts` — `useAnchorProgram()` returns `{ program, connection, provider }`. The `program` handles wallet signing automatically via the provider.

**New files to create:**
- `app/web/src/lib/mutations/sign-multisig.ts` — `useSignMultisig()` mutation hook
- `app/web/src/lib/mutations/confirm-webhook.ts` — `useConfirmWebhook()` mutation hook

### IDL Method Signatures

**signMultisig** (IDL name: `sign_multisig`, Anchor JS: `signMultisig`):
- Accounts: `payment` (read), `conditionAccount` (mut), `signer` (signer — the connected wallet)
- Args: `conditionIndex: u8`
- The `signer` account is the connected wallet — Anchor's provider automatically signs

**confirmWebhook** (IDL name: `confirm_webhook`, Anchor JS: `confirmWebhook`):
- Accounts: `payment` (read), `conditionAccount` (mut), `relayer` (signer — the connected wallet)
- Args: `conditionIndex: u8`, `eventHash: number[]` (32-element array of u8)
- The `relayer` account is the connected wallet

### Wallet Identity Checks

**Multisig:** The connected wallet's pubkey must be in `MultisigData.signers[]`. Use `PublicKey.equals()` for comparison (not string compare — see KNOWLEDGE.md). Also check `approvals[signerIndex]` to know if already signed. Show "Approve" button only when: (1) wallet is in signers list, (2) hasn't already approved, (3) condition not yet met.

**Webhook:** The connected wallet's pubkey must equal `WebhookData.relayer`. Show confirm form only when wallet matches. The event hash input accepts a 64-char hex string; convert to `Array.from(Uint8Array)` for the instruction arg.

### Build Order

1. **T01: signMultisig mutation + multisig UI** — Create `sign-multisig.ts` following `crank-time.ts` pattern. In `condition-card.tsx`, replace the multisig placeholder in `CrankAction` with: check if connected wallet is a signer → if yes and not yet approved, show "Approve" button → on click, call `signMultisig` mutation → show TransactionStatus. Also show per-signer approval status (who has signed, who hasn't).

2. **T02: confirmWebhook mutation + webhook UI** — Create `confirm-webhook.ts` following same pattern but with the extra `eventHash` arg. In `condition-card.tsx`, replace webhook placeholder with: check if connected wallet is the relayer → if yes, show hex input field + "Confirm" button → validate 64-char hex → convert to byte array → call mutation. Need shadcn `Input` component (check if installed, add if not).

### Verification Approach

- `bun run build` in `app/web` exits 0 (no type errors)
- `sign-multisig.ts` exists and exports `useSignMultisig`
- `confirm-webhook.ts` exists and exports `useConfirmWebhook`
- `condition-card.tsx` imports and wires both hooks — grep for `useSignMultisig` and `useConfirmWebhook`
- Multisig case in CrankAction renders "Approve" button (grep for "Approve")
- Webhook case in CrankAction renders event hash input (grep for `eventHash` or `event.hash` in the component)
- Wallet identity check present: grep for `.equals(` or `publicKey` comparison in condition-card.tsx

## Constraints

- Connected wallet must be the transaction signer — Anchor's provider signs automatically, so the `signer`/`relayer` account must be set to `provider.wallet.publicKey`
- `eventHash` must be exactly 32 bytes (64 hex chars) — validate input length before submission
- Both instructions require `payment.status == Active` and `condition_account.milestone_status == Active` — but the condition card only renders for existing conditions on active agreements, so this is implicitly satisfied
- The `useWallet()` hook from `@solana/wallet-adapter-react` provides `publicKey` — this is already available in the component tree via WalletProvider

## Common Pitfalls

- **PublicKey comparison** — Must use `new PublicKey(signerString).equals(wallet.publicKey)`, not string comparison. The `MultisigData.signers` array contains base58 strings from the query hook; the wallet's `publicKey` is a `PublicKey` object.
- **Hex-to-bytes conversion** — `eventHash` from the query hook is already a hex string. The user pastes a hex string in the confirm form. Convert with: `Array.from(Buffer.from(hexString, 'hex'))` or manual parsing. Must produce exactly 32 bytes.
- **Wallet disconnected state** — `useWallet().publicKey` is null when disconnected. The identity check must handle this gracefully — show "Connect wallet to approve/confirm" instead of the action button.
- **Anchor method name casing** — IDL has `sign_multisig` / `confirm_webhook` but Anchor JS accessor uses camelCase: `signMultisig` / `confirmWebhook`. The `(program.methods as any)` pattern handles this.
