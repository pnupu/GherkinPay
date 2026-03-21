---
id: S02
milestone: M002
status: ready
---

# S02: Fund Payment — Context

## Goal

Add a Fund action to the agreements list so the connected wallet can move USDC into escrow for a Created payment, with a pre-flight balance check, a confirmation dialog, and a transaction status indicator — leaving the payment in Active status.

## Why this Slice

S01 creates payments; S02 makes them fundable. S03 (release/cancel) requires at least one Active payment on devnet to prove release works. Fund is a single on-chain instruction but introduces the ATA lookup pattern that S03's release instruction reuses for the payee's token account.

## Scope

### In Scope

- **Fund button** on each agreement row in the agreements table — visible only on agreements with status `Created` and where the connected wallet matches `payment.payer` (otherwise button is hidden or disabled)
- Clicking Fund opens a **confirmation dialog** summarising the payment: payment pubkey (truncated), counterparty, and amount in USDC — with Cancel and Confirm buttons
- **Pre-flight check** before submitting: derive the payer's USDC Token-2022 ATA, check it exists and has sufficient balance (`>= payment.total_amount`). If the check fails, show a clear error message in the confirmation dialog before the wallet popup appears — e.g. "Insufficient USDC balance (you have 12.50 USDC, need 50.00 USDC)" or "No USDC token account found on this wallet"
- On Confirm: wallet popup appears for signing; confirmation dialog shows inline transaction status (follows the `TransactionStatus` component pattern from S01) — "Processing…" while pending, success message on confirmation, error state on failure
- On success: confirmation dialog closes, React Query `["agreements"]` cache invalidated so the agreements list refreshes without manual reload
- On failure: error shown inline in the dialog; user can dismiss and try again
- `bun run build` and `bun run typecheck` pass clean

### Out of Scope

- Creating a USDC ATA if one doesn't exist — show the error only; ATA creation is out of scope for this slice
- Airdrop or faucet link if balance is insufficient — informational message only
- Funding from a non-ATA token account — ATA only
- Any detail view or expanded row for the payment — Fund is the only new interaction on the agreements table in this slice
- Release or cancel — S03
- Milestone-level funding behaviour is identical to simple payment (same single `fundPayment` instruction) — no special milestone UI needed

## Constraints

- The contract enforces `payment.payer == payer.key()` — Fund button must only appear/be enabled for the agreement's designated payer (the connected wallet). Hide it entirely for payments where `payment.payer != connectedWallet`
- Fund also requires `condition_account.is_finalized` and `payment.status == Created` — only show Fund for Created payments; finalized status is a contract constraint enforced automatically at create time in S01
- All token operations use `TOKEN_2022_PROGRAM_ID`; ATA derivation must use `TOKEN_2022_PROGRAM_ID` not legacy SPL
- Reuse the `TransactionStatus` component from S01 for loading/success/error display — no new status UI
- No `@/` imports — use `~/` alias throughout

## Integration Points

### Consumes

- `useAnchorProgram()` from `~/lib/anchor` — for `Program<GherkinPay>` to build the fundPayment instruction
- `useWallet()` and `useConnection()` from wallet adapter — for signing and confirming
- `lib/pda.ts` (`getPaymentPDA`, `getEscrowPDA`, `getConditionPDA`) — PDA derivation for fundPayment accounts
- `~/lib/constants` (`DEVNET_USDC_MINT`) — for ATA derivation
- `@solana/spl-token` `getAssociatedTokenAddressSync` with `TOKEN_2022_PROGRAM_ID` — ATA derivation for payer token account
- `useAgreements()` query hook from `~/lib/queries/agreements` — queryClient invalidation on success
- `TransactionStatus` component from `~/components/transaction-status` — reused from S01
- shadcn `Dialog`, `Button`, `Badge` from `~/components/ui/` — confirmation dialog shell

### Produces

- `app/web/src/lib/mutations/fund-payment.ts` — `useFundPayment()` React Query mutation hook; ATA pre-flight check + fundPayment instruction + cache invalidation pattern (reused by S03 for token account lookups)
- `app/web/src/components/fund-payment-dialog.tsx` — confirmation dialog with pre-flight check result, amount summary, and inline transaction status
- `app/web/src/app/(console)/agreements/page.tsx` — Fund button wired into agreement rows (visible only for Created payments where `payer == connectedWallet`)

## Open Questions

- **Balance check timing**: current thinking is to run the ATA existence + balance check when the user clicks Fund (before opening the dialog), not on page load. This avoids unnecessary RPC calls for every agreement on the list. Confirm during planning.
- **escrowTokenAccount derivation**: the `escrow_token_account` field on the `PaymentAgreement` account stores the escrow PDA — pull it from the fetched account rather than re-deriving, to avoid any mismatch. Confirm during planning that this is correct.
