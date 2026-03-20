# S01: Create Payment Wizard

**Goal:** Users can create simple and milestone payment agreements with conditions from a multi-step Dialog wizard on the Agreements page, submitting real on-chain transactions to devnet.
**Demo:** Click "Create Payment" on the Agreements page → wizard Dialog opens → fill in counterparty wallets, amount, select condition type (e.g. TimeBased), set AND/OR logic → submit → wallet popup appears → transaction(s) confirm → new PaymentAgreement appears in the agreements list. Repeat with milestone mode: 2 milestones, each with a condition → all transactions confirm → milestone payment visible.

## Must-Haves

- Multi-step Dialog wizard: step 1 (payment details), step 2 (conditions/milestones), step 3 (review + submit)
- Simple payment mode: createPayment → addCondition ×N → finalizeConditions
- Milestone payment mode: createMilestonePayment → addMilestone ×N → addCondition ×N per milestone → finalizeConditions ×N
- All 5 condition types: TimeBased, Multisig, Oracle, Webhook, TokenGated
- AND/OR operator selection per condition set
- Sequential transaction submission with progress indicator (for flows that exceed single tx size)
- Form validation: required fields, milestone amounts sum to total, MAX_CONDITIONS=8, MAX_SIGNERS=5
- React Query cache invalidation after successful creation
- Transaction status feedback (loading, success, error)

## Proof Level

- This slice proves: integration (real on-chain transactions from browser)
- Real runtime required: yes (devnet Solana, connected wallet)
- Human/UAT required: yes (wallet signing popup)

## Verification

- `bun run build` passes clean in `app/web`
- `bun run typecheck` passes clean in `app/web`
- Manual verification: create a simple payment with a TimeBased condition via the wizard on devnet; PaymentAgreement account exists (verify via agreements list refresh or Solana Explorer)
- Manual verification: create a 2-milestone payment via the wizard; both conditionAccount PDAs exist on-chain
- Failure diagnostic: submit a payment with invalid parameters (e.g. zero amount or missing payee) → wizard displays an error message from the Anchor program error and logs the full error to console.error

## Observability / Diagnostics

- Runtime signals: transaction signature logged to console on success; Anchor error code + message surfaced on failure
- Inspection surfaces: agreements list auto-refreshes after creation; Solana Explorer for on-chain account verification
- Failure visibility: transaction error message displayed in wizard UI; console.error with full Anchor error
- Redaction constraints: none (all data is on-chain public)

## Integration Closure

- Upstream surfaces consumed: M001/S01 shadcn components, M001/S02 wallet adapter + useAnchorProgram, M001/S03 PDA helpers + useAgreements query, M001/S04 useMilestones query
- New wiring introduced: "Create Payment" button opens wizard Dialog; wizard submits real transactions; cache invalidated on success
- What remains before the milestone is truly usable end-to-end: fund (S02), release and cancel (S03)

## Tasks

- [x] **T01: Install shadcn form components and create transaction status toast** `est:30m`
  - Why: The wizard needs Input, Label, Select, RadioGroup, Tabs, Separator from shadcn, and all write flows need a shared transaction status component. Installing these first gives downstream tasks their building blocks.
  - Files: `app/web/src/components/ui/input.tsx`, `app/web/src/components/ui/label.tsx`, `app/web/src/components/ui/select.tsx`, `app/web/src/components/ui/radio-group.tsx`, `app/web/src/components/ui/tabs.tsx`, `app/web/src/components/ui/separator.tsx`, `app/web/src/components/transaction-status.tsx`
  - Do: Run `npx shadcn@canary add input label select radio-group tabs separator` in `app/web`. Create a `TransactionStatus` component that shows loading spinner during tx, success with signature link to Solana Explorer, or error with message. Use shadcn Alert or a simple toast pattern. Export from `components/transaction-status.tsx`.
  - Verify: `bun run build` passes; `bun run typecheck` passes; all 6 shadcn components importable
  - Done when: All shadcn form components install cleanly and TransactionStatus renders three states (loading/success/error)

- [x] **T02: Create payment mutation hook** `est:45m`
  - Why: The wizard needs a mutation hook that handles the full multi-instruction sequence: createPayment (or createMilestonePayment) → addMilestone ×N → addCondition ×N → finalizeConditions ×N. This is the core business logic for payment creation.
  - Files: `app/web/src/lib/mutations/create-payment.ts`
  - Do: Create `useCreatePayment()` using `useMutation` from @tanstack/react-query. The mutation function accepts a typed payload (paymentId, totalAmount, payer, payee, tokenMint, operator, conditions[], isMilestone, milestones[]). It derives PDAs using `lib/pda.ts`, builds and sends instructions sequentially (awaiting confirmation between each), and invalidates `["agreements"]` and `["milestones"]` query keys on success. Use `Date.now() * 1000 + Math.floor(Math.random() * 1000)` for payment ID generation as a BN. Handle the multi-tx case: batch instructions into transactions that fit under the ~1232 byte limit, send sequentially with confirmation between each. Use `useAnchorProgram()` for the program instance and `useWallet()` for signing.
  - Verify: `bun run typecheck` passes; hook exports correctly
  - Done when: `useCreatePayment()` hook compiles with correct types matching the IDL instruction signatures from the test file

- [x] **T03: Condition builder component** `est:1h`
  - Why: The condition builder is the most complex form element — it must handle dynamic add/remove of conditions, a Select for condition type that switches the form fields, and per-type validation. This is used in both simple and milestone modes.
  - Files: `app/web/src/components/condition-builder.tsx`
  - Do: Build a `ConditionBuilder` component that renders a list of condition forms with an "Add Condition" button (max 8). Each condition has a Select for type (TimeBased, Multisig, Oracle, Webhook, TokenGated) and type-specific fields: TimeBased (datetime picker → unix timestamp), Multisig (signer pubkeys + threshold), Oracle (feed account pubkey + comparison operator + target value + decimals), Webhook (relayer pubkey + event hash hex), TokenGated (mint pubkey + min amount + holder pubkey). Include AND/OR operator RadioGroup at the top. Use react-hook-form `useFieldArray` for the dynamic conditions list. Validate: MAX_CONDITIONS=8, MAX_SIGNERS=5, required fields per type.
  - Verify: `bun run typecheck` passes; component renders without errors
  - Done when: ConditionBuilder renders all 5 condition type forms with add/remove, operator selection, and field validation

- [ ] **T04: Create payment wizard Dialog** `est:1h`
  - Why: This is the main UI — a multi-step Dialog that collects payment details, conditions, and submits the transaction. It composes the ConditionBuilder and uses the mutation hook.
  - Files: `app/web/src/components/create-payment-wizard.tsx`, `app/web/src/app/(console)/agreements/page.tsx`
  - Do: Build a `CreatePaymentWizard` component as a shadcn Dialog with 3 steps: (1) Payment details — simple/milestone toggle (Tabs), payer wallet (defaults to connected wallet), payee wallet, token mint (hardcoded USDC devnet, display-only), total amount. For milestone mode: milestone count, per-milestone amounts (must sum to total). (2) Conditions — ConditionBuilder for simple mode, or tabbed ConditionBuilder per milestone for milestone mode. (3) Review + Submit — summary of all fields, submit button that calls `useCreatePayment()`, TransactionStatus display. Wire the wizard trigger: replace the existing "Create payment" button on the agreements page to open this Dialog. Use react-hook-form for the full wizard state with zod validation schema.
  - Verify: `bun run build` passes; wizard Dialog opens from the Agreements page "Create Payment" button
  - Done when: The wizard opens, accepts input for both simple and milestone modes, submits real transactions to devnet, and the agreements list refreshes after success

## Files Likely Touched

- `app/web/src/components/ui/input.tsx`
- `app/web/src/components/ui/label.tsx`
- `app/web/src/components/ui/select.tsx`
- `app/web/src/components/ui/radio-group.tsx`
- `app/web/src/components/ui/tabs.tsx`
- `app/web/src/components/ui/separator.tsx`
- `app/web/src/components/transaction-status.tsx`
- `app/web/src/components/condition-builder.tsx`
- `app/web/src/components/create-payment-wizard.tsx`
- `app/web/src/lib/mutations/create-payment.ts`
- `app/web/src/app/(console)/agreements/page.tsx`
