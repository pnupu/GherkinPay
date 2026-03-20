---
id: S03
milestone: M002
status: ready
---

# S03: Release and Cancel — Context

## Goal

Complete the payment lifecycle by adding Release (with an included crankTime call for testing), Cancel, and a minimal crankTime utility to the agreements UI — proving the full create → fund → crank → release and create → cancel flows on devnet.

## Why this Slice

S03 is the final slice of M002. Release depends on S02's Active payments; cancel can work on Created or Active payments. Together they close the loop: after S03, the full payment lifecycle is demoable in the browser. The slice also retires the milestone's key proof risk — "release with met conditions" — by including a minimal permissionless crankTime call.

## Scope

### In Scope

- **Release button** on Active agreement rows — visible to **any connected wallet** (the contract is permissionless; no signer required). Clicking opens a confirmation dialog.
- **Cancel button** on Created or Active agreement rows — visible only when `connected wallet == payment.authority`. Clicking opens a confirmation dialog.
- **Confirmation dialog for both Release and Cancel** — same pattern as Fund: dialog summarises the action (agreement pubkey, counterparty, amount), Cancel / Confirm buttons, wallet popup on Confirm, inline transaction status while processing
- **crankTime** included in S03: a permissionless "Mark time condition met" action that calls `crankTime(milestoneIndex)` before release. Surfaced as a button or auto-called inline as part of the Release flow — the exact UX can be decided during planning, but it must be possible to trigger it from the browser without going to Anchor CLI
- Release calls `evaluateAndRelease()` — single instruction; for milestone payments, the correct `nextConditionAccount` is derived (same PDA for last milestone, next milestone's conditionPDA for intermediate milestones)
- Cancel calls `cancelPayment()` — single instruction, authority signer required; refunds `total_amount - released_amount` to payer's USDC ATA
- On success: React Query `["agreements"]` and `["milestones"]` cache invalidated; list refreshes without reload
- On failure: error shown inline in the dialog; user can dismiss and retry
- `bun run build` and `bun run typecheck` pass clean

### Out of Scope

- crankOracle, crankTokenGate — M003
- Multisig signing UI (`signMultisig`) — M003
- Webhook confirmation (`confirmWebhook`) — M003
- Agreement detail view showing per-condition status — M003
- Releasing when conditions aren't met: no pre-flight condition check in S03; the contract error is surfaced in the error state
- Any UI for creating the payee's ATA if it doesn't exist — the transaction will fail with a contract error; not in scope to handle gracefully in S03

## Constraints

- **Release is permissionless** — Release button appears for any connected wallet on Active agreements; do not gate it on authority or payer
- **Cancel requires authority** — Cancel button only appears when `connected wallet == payment.authority`; both Created and Active statuses are valid for cancel
- **Confirmation dialog required for both** — same UX pattern as Fund; no direct-to-wallet-popup shortcuts
- **crankTime must be in scope** — the milestone acceptance test ("crank time, then release") cannot be proven without it; it must be possible to trigger from the browser
- **nextConditionAccount derivation for release**: for a simple payment or the last milestone, pass the same `conditionAccount` PDA as `nextConditionAccount`; for intermediate milestones, derive the next milestone's conditionPDA using `getConditionPDA(authority, paymentId, milestoneIndex + 1)`
- **Cancel refunds to payer's ATA**: derive payer's USDC Token-2022 ATA using `getAssociatedTokenAddressSync` with `TOKEN_2022_PROGRAM_ID`; same pattern as S02
- Reuse `TransactionStatus` component from S01 for loading/success/error
- No `@/` imports — use `~/` alias throughout

## Integration Points

### Consumes

- `useAnchorProgram()` from `~/lib/anchor` — `Program<GherkinPay>` for building evaluateAndRelease, cancelPayment, crankTime instructions
- `useWallet()` from wallet adapter — `publicKey` for authority check (cancel visibility) and as signer
- `lib/pda.ts` (`getPaymentPDA`, `getConditionPDA`) — PDA derivation for release and cancel account contexts
- `~/lib/constants` (`DEVNET_USDC_MINT`) — for payer ATA derivation in cancel
- `@solana/spl-token` `getAssociatedTokenAddressSync` with `TOKEN_2022_PROGRAM_ID` — ATA lookup pattern established in S02
- `useAgreements()` and `useMilestones()` query hooks — queryClient invalidation on success
- `TransactionStatus` component from `~/components/transaction-status` — reused from S01
- shadcn `Dialog`, `Button`, `Badge` from `~/components/ui/`

### Produces

- `app/web/src/lib/mutations/release-payment.ts` — `useReleasePayment()` mutation hook; handles simple and milestone payments, derives correct nextConditionAccount; includes payee ATA lookup
- `app/web/src/lib/mutations/cancel-payment.ts` — `useCancelPayment()` mutation hook; derives payer ATA for refund
- `app/web/src/lib/mutations/crank-time.ts` — `useCrankTime()` mutation hook or standalone utility for marking time-based conditions met
- `app/web/src/components/release-payment-dialog.tsx` — confirmation dialog with inline transaction status; optional crankTime trigger
- `app/web/src/components/cancel-payment-dialog.tsx` — confirmation dialog with refund amount summary and inline transaction status
- `app/web/src/app/(console)/agreements/page.tsx` — Release and Cancel buttons wired into agreement rows with correct visibility logic

## Open Questions

- **crankTime UX detail**: two options — (a) "Mark met" button on Active agreements with TimeBased conditions that the user clicks separately before Release, or (b) auto-crank as part of the Release flow (call crankTime then evaluateAndRelease in sequence). Current thinking: option (b) is simpler for a demo, but requires detecting whether any conditions are TimeBased. Decide during planning.
- **Payee ATA existence for release**: if the payee doesn't have a USDC token account, evaluateAndRelease will fail with an Anchor account constraint error. Should S03 pre-check the payee ATA exists before submitting, or surface the raw error? Current thinking: surface the error in S03; ATA creation for payees is M003+ polish.
- **Cancel on Created (unfunded) payment**: the contract allows it (no escrow transfer if balance is 0). The confirmation dialog should reflect this — show "No funds to refund" if the payment is Created and unfunded.
