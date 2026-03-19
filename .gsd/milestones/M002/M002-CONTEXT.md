# M002: Core Flows

**Gathered:** 2026-03-18
**Status:** Ready for planning (after M001 completes)

## Project Description

GherkinPay's core write flows: create a payment agreement (simple or milestone, any combination of conditions), fund it from the payer's USDC token account, trigger evaluate-and-release when conditions are met, and cancel a payment for a refund. This is the primary user loop — the sequence that takes a payment from intent to settlement.

## Why This Milestone

M001 makes the app readable. M002 makes it actionable. After this milestone the full happy path for a simple payment works end-to-end on devnet.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Click "Create Payment", fill out the wizard (counterparty wallets, amount, condition type, AND/OR logic), and submit a transaction that creates a real PaymentAgreement on devnet
- Create a milestone payment with up to 8 phases, each with its own amount and condition set
- Fund a created payment from their USDC token account, moving funds into escrow
- Click "Release" on an agreement where conditions are met and receive confirmation that funds moved to the payee
- Click "Cancel" on an active agreement and receive confirmation that funds were refunded to the payer

### Entry point / environment

- Entry point: `/agreements` page — "Create Payment" button opens the wizard
- Environment: Browser, devnet Solana, Phantom/Solflare wallet
- Live dependencies: Solana devnet RPC, USDC devnet token account with balance, connected wallet

## Completion Class

- Contract complete means: create/fund/release/cancel instructions all submit and confirm successfully in a test scenario
- Integration complete means: full flow works in the browser — create → fund → release, and create → cancel
- Operational complete means: all transactions show in the Activity feed after completion

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Create a simple payment with a time-based condition, fund it, crank time (using a past timestamp), and release — all via the UI in the browser on devnet
- Create a 2-milestone payment, fund it, release milestone 0, then release milestone 1 — all via the UI
- Cancel a funded payment and verify the payer's USDC balance is restored

## Risks and Unknowns

- Payment creation wizard UX — the condition builder with all 5 types, AND/OR logic, and milestone mode is the most complex UI in the project; needs careful form state management
- Token account lookup — payer must have a USDC Token-2022 token account; need to handle the case where it doesn't exist
- Transaction confirmation UX — Solana transactions take 1-2 seconds; need clear loading/success/error states
- Milestone ConditionAccount initialization — createMilestonePayment doesn't create condition accounts; addMilestone does; the wizard must do these in sequence

## Existing Codebase / Prior Art

- `programs/gherkin-pay/src/instructions/create_payment.rs` — CreatePayment instruction and accounts context
- `programs/gherkin-pay/src/instructions/create_milestone_payment.rs` — CreateMilestonePayment instruction
- `programs/gherkin-pay/src/instructions/add_condition.rs` — AddCondition instruction
- `programs/gherkin-pay/src/instructions/finalize_conditions.rs` — FinalizeConditions instruction
- `programs/gherkin-pay/src/instructions/fund_payment.rs` — FundPayment instruction
- `programs/gherkin-pay/src/instructions/evaluate_and_release.rs` — EvaluateAndRelease instruction
- `programs/gherkin-pay/src/instructions/cancel_payment.rs` — CancelPayment instruction
- `tests/gherkin-pay.ts` — exact account shapes and instruction call signatures; use as ground truth

> See `.gsd/DECISIONS.md` for architectural decisions — append new ones during execution.

## Relevant Requirements

- R007 — Create payment wizard
- R008 — Fund payment
- R009 — Evaluate and release
- R010 — Cancel payment and refund

## Scope

### In Scope

- Create payment wizard (single and milestone mode, all 5 condition types, AND/OR logic)
- Fund payment from connected wallet's USDC token account
- Evaluate-and-release from agreement detail or agreements list
- Cancel payment with refund to payer
- Transaction status UI (loading, confirmed, error) for all write flows
- Agreement detail view showing conditions and their status
- Agreements list updated after any write (invalidate React Query cache)

### Out of Scope / Non-Goals

- Condition cranking (time, oracle, token-gate) — M003
- Multisig signing UI — M003
- Webhook confirmation — M003
- Compliance management — M003

## Technical Constraints

- Must use shadcn Dialog and Form components from M001/S01
- Condition builder must handle dynamic form state for up to 8 conditions per milestone
- All transactions must use the Anchor program client from M001/S02
- Devnet USDC only; no mint selection UI

## Integration Points

- `gherkin_pay` program — all write instructions
- Solana devnet RPC — transaction submission and confirmation
- Connected wallet — transaction signing
- USDC Token-2022 devnet mint — token account lookups

## Open Questions

- Payment ID generation strategy — uint64 required by the contract; using `Date.now()` or a random BN is fine for devnet
- Whether the wizard should be a multi-step Dialog or a dedicated `/agreements/new` page — Dialog is simpler; dedicated page gives more space for milestone condition builder
