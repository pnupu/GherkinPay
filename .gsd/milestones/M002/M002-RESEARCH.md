# M002: Core Flows — Research

**Date:** 2026-03-20

## Summary

M002 is the milestone that makes GherkinPay actionable — write transactions from the browser. The smart contract is complete and battle-tested with comprehensive TypeScript tests covering every instruction. The test file (`tests/gherkin-pay.ts`) is the definitive source of truth for account shapes, PDA derivation, instruction arguments, and multi-step transaction sequences. M001 delivers the foundation: shadcn components, wallet adapter, Anchor program client (`useAnchorProgram()`), PDA helpers (`lib/pda.ts`), React Query read hooks, and the four-state UI pattern (disconnected/loading/empty/populated).

M002's core challenge is the **create payment wizard** — it's a multi-step on-chain operation (create → add conditions → finalize → optionally fund) with complex form state (5 condition types, AND/OR logic, milestone mode with per-phase conditions). The other three flows (fund, release, cancel) are single-instruction operations with straightforward account contexts. The wizard should be built and proven first because it's the highest-risk, highest-complexity piece and unblocks all downstream flows.

All write operations follow an identical pattern: derive PDAs from the payment's authority + payment_id, build the Anchor instruction, sign with the connected wallet, confirm on devnet, then invalidate React Query caches. The existing `useAnchorProgram()` hook and `lib/pda.ts` PDA helpers from M001 cover the infrastructure. M002 needs to add **mutation hooks** (React Query `useMutation`) alongside the existing query hooks, plus new shadcn form components (Input, Select, RadioGroup, Label, Tabs, Separator) for the wizard UI.

## Recommendation

**Slice the work into 3 slices: (S01) Create Payment Wizard, (S02) Fund Payment, (S03) Release & Cancel.**

S01 is the large, risky piece — build it first. It covers both simple and milestone payment creation, all 5 condition types, the multi-instruction transaction sequence, and the wizard UI. This unblocks S02 (fund requires a Created payment with finalized conditions) and S03 (release requires a funded Active payment; cancel requires Created or Active).

S02 and S03 are small (1-2 instructions each, simple UI: a button + confirmation dialog + transaction status). They can be built in parallel after S01 if desired.

Use a multi-step Dialog for the wizard rather than a dedicated `/agreements/new` page. Reasons: (1) the agreements page already has a "Create payment" button in its topbar, (2) Dialog is already installed from M001/S01, (3) a dialog keeps the user in context and avoids routing complexity.

## Implementation Landscape

### Key Files

**From M001 (will exist when M002 starts):**
- `app/web/src/lib/anchor.ts` — `useAnchorProgram()` hook returning `Program<GherkinPay>` (or null)
- `app/web/src/lib/pda.ts` — `getPaymentPDA()`, `getEscrowPDA()`, `getConditionPDA()` 
- `app/web/src/lib/queries/agreements.ts` — `useAgreements()` query hook; pattern to follow for mutations
- `app/web/src/lib/queries/milestones.ts` — `useMilestones()` query hook
- `app/web/src/components/ui/button.tsx` — shadcn Button
- `app/web/src/components/ui/dialog.tsx` — shadcn Dialog (used for wizard shell)
- `app/web/src/components/ui/table.tsx` — shadcn Table
- `app/web/src/components/ui/badge.tsx` — shadcn Badge
- `app/web/src/components/ui/skeleton.tsx` — shadcn Skeleton
- `app/web/src/app/(console)/agreements/page.tsx` — existing agreements list page; wire wizard trigger here
- `app/web/src/idl/gherkin_pay.json` — IDL for instruction building
- `app/web/src/types/gherkin_pay.ts` — TypeScript types for the program

**Smart contract ground truth:**
- `tests/gherkin-pay.ts` — **primary reference** for instruction call signatures, account shapes, PDA derivation, and multi-step flows
- `programs/gherkin-pay/src/state/payment.rs` — PaymentAgreement struct (payment_id: u64, authority, payer, payee, token_mint, total_amount, released_amount, status, is_milestone, milestone_count, current_milestone, created_at, bump, escrow_bump)
- `programs/gherkin-pay/src/state/condition.rs` — ConditionAccount struct, Condition enum (5 variants), ConditionOperator (And/Or), MAX_CONDITIONS=8, MAX_SIGNERS=5
- `programs/gherkin-pay/src/instructions/create_payment.rs` — CreatePayment accounts context
- `programs/gherkin-pay/src/instructions/create_milestone_payment.rs` — CreateMilestonePayment accounts context (no conditionAccount — milestone PDAs created via addMilestone)
- `programs/gherkin-pay/src/instructions/add_milestone.rs` — AddMilestone instruction (inits conditionAccount PDA per milestone)
- `programs/gherkin-pay/src/instructions/add_condition.rs` — AddCondition with realloc
- `programs/gherkin-pay/src/instructions/finalize_conditions.rs` — FinalizeConditions (sets is_finalized = true)
- `programs/gherkin-pay/src/instructions/fund_payment.rs` — FundPayment (requires payer signer, finalized conditions, status=Created)
- `programs/gherkin-pay/src/instructions/evaluate_and_release.rs` — EvaluateAndRelease (requires status=Active, conditions met, nextConditionAccount)
- `programs/gherkin-pay/src/instructions/cancel_payment.rs` — CancelPayment (requires authority signer, status != Completed/Cancelled)

**New files M002 will create:**
- `app/web/src/lib/mutations/create-payment.ts` — `useCreatePayment()` mutation hook
- `app/web/src/lib/mutations/fund-payment.ts` — `useFundPayment()` mutation hook
- `app/web/src/lib/mutations/release-payment.ts` — `useReleasePayment()` mutation hook
- `app/web/src/lib/mutations/cancel-payment.ts` — `useCancelPayment()` mutation hook
- `app/web/src/components/create-payment-wizard.tsx` — multi-step wizard Dialog
- `app/web/src/components/condition-builder.tsx` — dynamic condition form builder
- `app/web/src/components/transaction-status.tsx` — shared loading/success/error transaction toast/indicator
- `app/web/src/components/ui/input.tsx` — shadcn Input (new)
- `app/web/src/components/ui/label.tsx` — shadcn Label (new)
- `app/web/src/components/ui/select.tsx` — shadcn Select (new)
- `app/web/src/components/ui/radio-group.tsx` — shadcn RadioGroup (new)
- `app/web/src/components/ui/tabs.tsx` — shadcn Tabs (for simple vs milestone toggle)
- `app/web/src/components/ui/separator.tsx` — shadcn Separator

### Transaction Sequence — Key Findings

**Simple payment creation is a 3+ instruction sequence (same transaction or sequential):**
1. `createPayment(paymentId, totalAmount, operator)` — creates PaymentAgreement + escrow + conditionAccount[0]
2. `addCondition(condition)` × N — adds conditions to conditionAccount (up to 8, with realloc)
3. `finalizeConditions()` — marks conditionAccount as finalized

**Milestone payment creation is more complex:**
1. `createMilestonePayment(paymentId, totalAmount, milestoneCount)` — creates PaymentAgreement + escrow (NO conditionAccount)
2. `addMilestone(index, amount, operator)` × N — creates conditionAccount PDAs per milestone
3. `addCondition(condition)` × N per milestone — adds conditions to each milestone's conditionAccount
4. `finalizeConditions()` × N — finalize each milestone's conditionAccount

**Critical: milestone amounts must sum to totalAmount.** The contract doesn't enforce this at createMilestonePayment time — it only matters at release. The wizard UI should enforce this validation client-side.

**Fund payment:**
- Single instruction: `fundPayment()` — payer signs, transfers totalAmount from payerTokenAccount to escrow
- Constraint: `payment.payer == payer.key()` — only the designated payer can fund
- Constraint: `condition_account.is_finalized` — conditions must be finalized first
- Constraint: `payment.status == Created`

**Evaluate and release:**
- Single instruction: `evaluateAndRelease()` — permissionless (no signer constraint), checks conditions are met
- Key: `nextConditionAccount` must be provided — for simple payments or last milestone, pass same as conditionAccount
- For milestone payments: advances `current_milestone` and sets next conditionAccount to Active

**Cancel payment:**
- Single instruction: `cancelPayment()` — requires authority signer
- Refunds remaining escrow balance (totalAmount - releasedAmount) to payerTokenAccount
- Works on Created or Active payments

### Payment ID Strategy

The contract uses `u64` for payment_id. Tests use sequential integers (1, 2, 3...). For devnet, `Date.now()` as a BN is simple and collision-resistant. No need for anything fancier.

### Token Account Discovery

The fund flow needs the payer's USDC Token-2022 token account. This requires:
1. Knowing the USDC devnet mint address (hardcoded constant from M001)
2. Looking up the associated token account (ATA) for the connected wallet
3. Token-2022 uses a different ATA program — need `getAssociatedTokenAddressSync` with `TOKEN_2022_PROGRAM_ID`

The payee's token account is needed for release — same lookup pattern but with `payment.payee`.

### Build Order

1. **S01: Create Payment Wizard** — Prove first because it's highest risk. Deliverable: user can create a simple payment with at least one time-based condition via the wizard, and the PaymentAgreement appears in the agreements list after creation. Then extend to milestone mode and all 5 condition types.

2. **S02: Fund Payment** — Depends on S01 (needs a Created payment to fund). Deliverable: user clicks "Fund" on a created payment, signs the transaction, and the payment moves to Active status.

3. **S03: Release & Cancel** — Depends on S02 for release (needs Active + met conditions). Cancel can work on Created or Active. Deliverable: user can release a payment where conditions are met and cancel a payment for refund.

### Verification Approach

- **Contract verification:** `bun run build` passes, TypeScript compiles with no errors
- **Functional verification per slice:**
  - S01: Create a simple payment via the wizard on devnet; verify PaymentAgreement account exists via Solana Explorer or the agreements page refresh
  - S02: Fund the created payment; verify escrow token account has the USDC balance; payment status shows Active
  - S03: Release a payment (using a past time-based condition + crankTime from M003, or a pre-met condition); cancel a different payment and verify refund
- **Integration verification:** Full happy path: create → fund → release, all via the browser on devnet
- **Cache invalidation:** After each mutation, React Query `["agreements", pubkey]` and `["milestones", pubkey]` cache keys must be invalidated; agreements list updates without manual refresh

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Form validation & state | react-hook-form + zod | shadcn Form wraps react-hook-form; handles complex nested state for conditions array, validation, error display |
| ATA derivation | @solana/spl-token `getAssociatedTokenAddressSync` | Correct PDA derivation for Token-2022 associated accounts; handles program ID parameter |
| Transaction confirmation UX | @solana/wallet-adapter-react `useWallet().sendTransaction` | Handles wallet popup, signing, confirmation; returns signature |
| Mutation state management | @tanstack/react-query `useMutation` | Already in the project; handles loading/success/error states, cache invalidation via `queryClient.invalidateQueries` |
| Condition type form switching | shadcn Select + conditional rendering | Each condition type has different fields; Select picks the type, form adapts |

## Constraints

- **Payer must be the connected wallet for fund:** The contract enforces `payment.payer == payer.key()`. In the wizard, `payer_wallet` is set at creation time — it should default to the connected wallet's pubkey but can be a different address.
- **Authority must be the connected wallet for create/finalize/cancel:** These instructions require `authority` as a `Signer`. The connected wallet IS the authority.
- **Release is permissionless:** Anyone can call `evaluateAndRelease` — no signer constraint. The UI should show the Release button to any viewer of the agreement, not just the authority.
- **Token-2022 not SPL Token:** All token instructions use `TOKEN_2022_PROGRAM_ID`. The ATA derivation, transfer calls, and account lookups must use the Token-2022 program ID, not the legacy SPL Token program ID.
- **MAX_CONDITIONS = 8 per milestone, MAX_SIGNERS = 5 per multisig condition:** Wizard must enforce these limits in the form.
- **Condition account realloc:** `addCondition` handles realloc internally (pays from authority), so the frontend just needs to call it N times — no space pre-calculation needed.
- **createMilestonePayment does NOT create conditionAccounts:** The `addMilestone` instruction creates them. The wizard must call addMilestone for each phase before adding conditions.
- **All condition accounts must be finalized before funding:** Fund checks `condition_account.is_finalized` on milestone 0's conditionAccount. For milestone payments, ALL conditionAccounts should be finalized before the user can fund.

## Common Pitfalls

- **Transaction too large for single tx:** A milestone payment with 3 milestones, each having 3 conditions = `createMilestonePayment` + 3×`addMilestone` + 9×`addCondition` + 3×`finalizeConditions` = 16 instructions. This won't fit in a single Solana transaction (~1232 bytes). Must send as multiple sequential transactions, waiting for confirmation between each. The wizard should handle this transparently with a progress indicator.

- **nextConditionAccount for evaluateAndRelease:** For simple payments or the last milestone, pass the same PDA as both `conditionAccount` and `nextConditionAccount`. For milestone payments with more milestones remaining, must derive the next milestone's conditionPDA. Getting this wrong causes an Anchor constraint error.

- **Payment ID collision:** Using `Date.now()` could collide if the user creates two payments within the same millisecond. Add a random suffix or use `Date.now() * 1000 + Math.floor(Math.random() * 1000)` to reduce collision probability.

- **Wallet not the payer:** If the wizard allows setting a different payer wallet than the connected wallet, the fund button must be disabled for the authority (since only the payer can fund). Keep it simple for devnet: default payer = connected wallet, allow override for testing.

- **React Query cache staleness:** After a mutation, the agreements list must refresh. Use `queryClient.invalidateQueries({ queryKey: ["agreements"] })` in the mutation's `onSuccess` callback. Same for milestones.

## Open Risks

- **M001 completion dependency:** M002 cannot start until M001 merges its code (S02's wallet adapter, S03's PDA helpers, S01's shadcn components). The M002 worktree currently has none of this code. If M001's patterns change during its remaining slices (S05/S06), M002 may need adjustment.
- **Transaction size for complex milestone payments:** A payment with 8+ milestones and multiple conditions each could require 30+ sequential transactions. UX for this "batch create" flow needs careful design — progress bar, error recovery, partial state cleanup.
- **Release requires met conditions but M002 scope doesn't include cranks:** The time crank (`crankTime`) is M003 scope, but the acceptance criteria say "crank time (using a past timestamp)" for the release test. M002 may need to include a minimal `crankTime` call in the release flow (it's a simple permissionless instruction) or expose it as a "force evaluate" button for testing. The contract evaluates conditions at release time — if using a past timestamp in the TimeBased condition, `crankTime` must be called first to set `met = true`.
- **Devnet RPC rate limits:** Creating a milestone payment could fire 10+ RPCs in rapid succession. Devnet may throttle. Add sequential processing with small delays between transactions.

## Candidate Requirements

Based on this research, the following behaviors are not explicitly covered by R007-R010 but are table-stakes for a working flow:

1. **Transaction status feedback (loading/success/error)** — The context mentions this but no requirement covers it. All write flows need clear transaction state UI. Consider formalizing as a requirement.
2. **React Query cache invalidation after mutations** — Critical for the agreements/milestones lists to update. Currently implicit.
3. **Token account existence check before fund** — The payer must have a USDC token account. If they don't, the fund transaction will fail with a cryptic Anchor error. The UI should check this and show a clear message (or offer to create the ATA).

These are advisory — they're implementation details that any competent slice plan will include, not separate requirements.

## Sources

- `tests/gherkin-pay.ts` — Ground truth for all instruction signatures, PDA derivation, and multi-step flows
- `programs/gherkin-pay/src/state/condition.rs` — Condition enum variants, limits, operator logic
- `programs/gherkin-pay/src/instructions/*.rs` — Account contexts and constraints for all 7 relevant instructions
- M001 slice summaries (S01-S04) — Established patterns for hooks, components, PDA helpers
