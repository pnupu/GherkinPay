---
id: S01
milestone: M002
status: ready
---

# S01: Create Payment Wizard — Context

## Goal

Deliver a working Create Payment wizard that lets the user create simple and milestone payment agreements on devnet with all 5 condition types, submitting the multi-instruction on-chain sequence and landing the new PaymentAgreement in the agreements list.

## Why this Slice

S01 is the highest-risk slice in M002 — it contains the most complex form state (condition builder, AND/OR logic, milestone phases) and the most complex on-chain transaction sequence (up to 16+ sequential instructions for large milestone payments). Proving this first unblocks S02 (fund needs a Created + finalized payment) and S03 (release/cancel needs a funded or created payment). S02 and S03 are each single-instruction flows with simple UI.

## Scope

### In Scope

- Create Payment wizard opened via the "Create payment" button on the Agreements page
- Both **simple mode** (single condition set) and **milestone mode** (multiple phases with per-phase amounts and conditions) — both must work for this slice to ship
- **All 5 condition types** must be fully buildable and submitted correctly to the contract: `TimeBased`, `Multisig`, `Oracle`, `Webhook`, `TokenGated`
- AND/OR operator selection per condition set (maps to `ConditionOperator`)
- Dynamic add/remove conditions within a phase (up to 8 per phase, enforced client-side)
- Multisig condition: signer pubkey list (up to 5, enforced client-side), threshold field
- TimeBased condition: unlock timestamp input
- Oracle condition: feed account pubkey, comparison operator, target value, decimals
- Webhook condition: relayer pubkey, event hash (32-byte hex input)
- TokenGated condition: token mint pubkey, comparison operator, required balance, decimals
- Milestone mode: dynamic add/remove phases, per-phase amount, per-phase condition set; client-side validation that amounts sum to total
- Sequential multi-instruction submission: create → addCondition×N → finalize (simple) / createMilestonePayment → addMilestone×N → addCondition×N → finalize×N (milestone)
- **Inline progress in the dialog during submission**: step counter showing "Submitting transaction X of N" while the dialog stays open; dialog closes only on success or user dismissal
- **Connected wallet is always payer and authority** — no separate payer field; payee is a separate address input
- Payee wallet address: free-form pubkey text input (user enters the counterparty's address)
- Amount in USDC (display as decimal, convert to u64 with 6 decimal places before submitting)
- Payment ID generated as `Date.now() * 1000 + random(0–999)` for collision resistance
- On success: React Query `["agreements"]` and `["milestones"]` cache invalidated so the list refreshes without manual reload
- On failure mid-sequence: show error with the transaction signature that failed and a "Try again" button that resets the wizard for a fresh attempt — no smart resume; partial on-chain state is left as-is
- `bun run build` and `bun run typecheck` pass clean

### Out of Scope

- Condition cranking (crankTime, crankOracle, crankTokenGate) — M003
- Multisig signing UI — M003
- Webhook confirmation — M003
- Funding the payment — S02
- Any release or cancel flows — S03
- Transaction explorer links from the error state — nice-to-have, not required
- Separate payer wallet from the connected wallet — devnet only, always connected wallet = payer
- Token account existence check before wizard submission — S02's scope (fund is where it matters)
- Agreement detail view — not in this slice

## Constraints

- Authority (create/finalize) and payer (eventual fund) are always the connected wallet — no separate payer field
- All 5 condition types must be fully buildable; the slice is not done if any condition type is a stub or disabled
- Milestone mode must work; the slice is not done if milestone payments can't be created
- Client-side must enforce MAX_CONDITIONS = 8 per phase and MAX_SIGNERS = 5 per multisig condition
- Milestone amounts must sum to total amount — enforce with client-side validation before allowing submission
- All token operations use `TOKEN_2022_PROGRAM_ID`, not legacy SPL Token
- No `@/` imports — use `~/` alias throughout
- Use shadcn Dialog as the wizard shell (already installed from M001/S01)
- Multi-instruction sequence must be submitted sequentially with confirmation between transactions — do not attempt to batch everything into one transaction
- Failure recovery is "show error + Try again" only; no partial-state resume

## Integration Points

### Consumes

- `useAnchorProgram()` from `~/lib/anchor` — for `Program<GherkinPay>` to build and send instructions
- `useWallet()` and `useConnection()` from wallet adapter — for signing and confirming transactions
- `lib/pda.ts` (`getPaymentPDA`, `getEscrowPDA`, `getConditionPDA`) — PDA derivation for create instruction accounts
- `~/lib/constants` (`PROGRAM_ID`, `DEVNET_USDC_MINT`) — used in account contexts
- shadcn `Dialog`, `Button`, `Badge` from `~/components/ui/` (M001/S01)
- `useAgreements()` from `~/lib/queries/agreements` — queryClient invalidation after create success

### Produces

- `app/web/src/components/create-payment-wizard.tsx` — multi-step Dialog wizard with inline transaction progress
- `app/web/src/components/condition-builder.tsx` — dynamic condition form for all 5 types with add/remove, AND/OR selector
- `app/web/src/lib/mutations/create-payment.ts` — `useCreatePayment()` React Query mutation hook; establishes the useMutation + sequential-tx + invalidateQueries pattern for S02 and S03
- `app/web/src/components/transaction-status.tsx` — shared inline transaction step indicator (reused by S02 and S03)
- shadcn `Input`, `Label`, `Select`, `RadioGroup`, `Tabs`, `Separator` installed in `~/components/ui/`
- `app/web/src/app/(console)/agreements/page.tsx` — "Create payment" button wired to open the wizard (page is already being rewritten in M001/S03)

## Open Questions

- **Transaction size for large milestone payments**: a payment with 8 milestones × 8 conditions each = 1 + 8 + 64 + 8 = 81 instructions. Sequential submission with confirmation between each is the only viable approach; research optimal batch sizing (maybe group addConditions for one milestone into a single tx) during planning.
- **Webhook event_hash input**: the contract stores a `[u8; 32]` — the UI should accept a 64-char hex string and convert. Confirm during planning whether a hash input or a raw bytes input is more usable.
- **Oracle feed account**: for devnet, the Pyth SOL/USD feed account address should be pre-filled or selectable from a short list rather than a free-form pubkey. Keep as free-form for S01; a dropdown is M003+ polish.
