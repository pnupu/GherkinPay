# M002: Core Flows

**Vision:** GherkinPay becomes actionable — users can create, fund, release, and cancel payment agreements from the browser on devnet, completing the full happy path for condition-gated escrow settlements.

## Success Criteria

- User can open the Create Payment wizard from the Agreements page, fill out counterparty wallets, amount, condition type with AND/OR logic, and submit a transaction that creates a real PaymentAgreement on devnet
- User can create a milestone payment with multiple phases, each with its own amount and condition set, via the same wizard
- User can fund a created payment from their connected wallet's USDC token account, moving funds into escrow (status changes to Active)
- User can release funds from an agreement where conditions are met, with funds moving to the payee's token account
- User can cancel an active or created agreement, with escrowed funds refunding to the payer
- All write operations show clear loading/success/error states during transaction processing
- The agreements list updates automatically after any write operation (no manual refresh)

## Key Risks / Unknowns

- **Multi-instruction transaction batching** — Simple payment creation requires 3+ instructions (create → addCondition ×N → finalize); milestone payments can require 16+ instructions that won't fit in a single Solana transaction. The wizard must handle sequential transaction submission transparently.
- **Condition builder form complexity** — 5 condition types with different field shapes, AND/OR logic, dynamic add/remove, up to 8 conditions per milestone — this is the most complex form state in the project.
- **Release requires met conditions but cranks are M003 scope** — The `evaluateAndRelease` instruction checks `are_conditions_met()`. For demo/acceptance, we need a minimal `crankTime` call to mark time-based conditions as met before release. Without this, release can't be proven.

## Proof Strategy

- Multi-instruction batching → retire in S01 by proving a simple payment with 2 conditions is created across sequential transactions via the wizard
- Condition builder complexity → retire in S01 by building the form for all 5 condition types and proving milestone mode creates per-phase conditionAccounts
- Release with met conditions → retire in S03 by including a minimal `crankTime` call before release (permissionless, single instruction)

## Verification Classes

- Contract verification: `bun run build` and `bun run typecheck` pass clean in `app/web`; no Anchor/IDL type errors
- Integration verification: Full browser flow on devnet — create → fund → release (simple payment), create → cancel (any payment), create → fund → release milestone 0 → release milestone 1 (milestone payment)
- Operational verification: None (no backend services)
- UAT / human verification: Wallet popup appears and signs correctly; transaction confirmation UX is clear and timely; form validation prevents invalid submissions

## Milestone Definition of Done

This milestone is complete only when all are true:

- All three slices (S01, S02, S03) are complete with passing verification
- Create Payment wizard handles both simple and milestone modes with all 5 condition types
- Fund, Release, and Cancel operations work from the agreements page with transaction status feedback
- A simple payment with a time-based condition can be created → funded → cranked → released, all via the browser on devnet
- A 2-milestone payment can be created → funded → milestone 0 released → milestone 1 released, all via the browser
- A funded payment can be cancelled with payer's USDC balance restored
- The agreements list refreshes after every mutation without manual reload
- `bun run build` passes clean in `app/web`

## Requirement Coverage

- Covers: R007 (create payment wizard — S01), R008 (fund payment — S02), R009 (evaluate and release — S03), R010 (cancel payment — S03)
- Partially covers: None
- Leaves for later: R011-R017 (M003 scope), R018-R021 (deferred/out-of-scope)
- Orphan risks: None — all Active requirements for M002 are mapped

## Slices

- [x] **S01: Create Payment Wizard** `risk:high` `depends:[]`
  > After this: User can open the Create Payment dialog from the Agreements page, fill out a simple or milestone payment with conditions, submit the multi-instruction transaction, and see the new PaymentAgreement appear in the agreements list on devnet.

- [x] **S02: Fund Payment** `risk:medium` `depends:[S01]`
  > After this: User can click "Fund" on a Created payment, sign the transaction with their wallet, and see the payment status change to Active with funds moved to escrow.

- [ ] **S03: Release and Cancel** `risk:low` `depends:[S01,S02]`
  > After this: User can release a payment where conditions are met (with time-crank for testing) and cancel a payment for refund — completing the full payment lifecycle via the browser.

## Boundary Map

### S01 → S02

Produces:
- `useCreatePayment()` mutation hook pattern — establishes the useMutation + queryClient.invalidateQueries pattern for all write flows
- `TransactionStatus` component — shared loading/success/error toast for transaction feedback
- shadcn form components (Input, Label, Select, RadioGroup, Tabs, Separator) installed and available
- Created PaymentAgreement accounts on devnet — S02 needs a Created payment with finalized conditions to fund

Consumes:
- M001/S01: shadcn Dialog, Button, Table, Badge components
- M001/S02: `useAnchorProgram()` hook, wallet adapter (useWallet, useConnection)
- M001/S03: `useAgreements()` query hook, React Query queryClient
- M001/S03-S04: `lib/pda.ts` PDA helpers (getPaymentPDA, getEscrowPDA, getConditionPDA)

### S02 → S03

Produces:
- `useFundPayment()` mutation hook — follows the pattern established by S01
- Active (funded) PaymentAgreement accounts on devnet — S03 needs Active payments for release testing
- Token account lookup pattern (ATA derivation for Token-2022) — reused for payee token account in release

Consumes:
- S01: `useCreatePayment()` pattern, TransactionStatus component, shadcn form components
- M001: useAnchorProgram, PDA helpers, wallet adapter

### S03

Produces:
- `useReleasePayment()` and `useCancelPayment()` mutation hooks
- Complete payment lifecycle UI — create → fund → release/cancel all working from the browser
- Minimal `crankTime` utility for testing time-based condition release

Consumes:
- S01: TransactionStatus component, mutation pattern
- S02: Token account lookup pattern, funded payments on devnet
- M001: useAnchorProgram, PDA helpers, wallet adapter, agreements/milestones query hooks
