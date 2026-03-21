---
id: T04
parent: S01
milestone: M002
provides:
  - CreatePaymentWizard 3-step Dialog component (payment details → conditions → review & submit)
  - Simple and milestone payment creation flows wired to on-chain useCreatePayment() mutation
  - Wizard trigger integrated into Agreements page replacing the static "Create payment" button
key_files:
  - app/web/src/components/create-payment-wizard.tsx
  - app/web/src/app/(console)/agreements/page.tsx
key_decisions:
  - Used local useState for wizard form state instead of react-hook-form for the top-level wizard — the ConditionBuilder already manages its own RHF form internally, and nesting RHF forms causes conflicts
  - Installed shadcn Dialog component (@base-ui/react Dialog primitive) as a new dependency since it wasn't present in the worktree
patterns_established:
  - Multi-step wizard pattern with numbered step state, validation gates per step, and conditional rendering
  - Form-to-mutation adapter: toConditionInput() converts Zod-validated ConditionFormValue to BN/PublicKey-typed ConditionInput for the mutation
  - USDC amount conversion uses 6-decimal precision (Math.round(amount * 1_000_000)) matching USDC's on-chain decimals
observability_surfaces:
  - data-testid="create-payment-wizard" on Dialog content for automated testing
  - TransactionStatus component shows real-time tx state (loading/success/error) with Explorer link
  - Mutation error message displayed inline in step 3; console.error logged by mutation hook
  - React Query cache invalidation on ["agreements"] and ["milestones"] triggers list refresh after success
duration: 12m
verification_result: passed
completed_at: 2026-03-20T14:58:00+02:00
blocker_discovered: false
---

# T04: Create payment wizard Dialog

**Built 3-step CreatePaymentWizard Dialog with simple/milestone modes, validation gates, ConditionBuilder integration, on-chain transaction submission via useCreatePayment(), and TransactionStatus feedback — wired to "Create Payment" button on the Agreements page.**

## What Happened

Created `create-payment-wizard.tsx` — a multi-step Dialog wizard that composes all prior T01-T03 deliverables into a complete payment creation flow:

- **Step 1 (Payment Details):** Simple/milestone mode toggle via shadcn Tabs, payer wallet (read-only from connected wallet), payee wallet input with base58 validation, USDC devnet mint display, total amount input. Milestone mode adds milestone count selector (2-8) and per-milestone amount inputs with sum validation against total.

- **Step 2 (Conditions):** Simple mode renders one ConditionBuilder. Milestone mode renders a tabbed set of ConditionBuilders (one per milestone) with per-tab validity indicators (green checkmarks).

- **Step 3 (Review & Submit):** Read-only summary of all fields (type, payer, payee, token, amount, conditions/milestones). Submit button calls `useCreatePayment()` mutation with properly typed inputs. TransactionStatus component shows loading/success/error states with Solana Explorer links. Done/Retry buttons on completion.

Navigation uses Back/Next buttons with validation gates: step 1 requires valid payee and amount (plus milestone sum check), step 2 requires all condition builders to be valid. The wizard resets all state on open.

Updated `agreements/page.tsx` to import `CreatePaymentWizard` and replace the static `<button>` with the Dialog-triggering component.

Also installed the shadcn Dialog component which was missing from the worktree.

## Verification

- `bun run build` exits 0 — all pages compile, ESLint passes, agreements page bundles at 243kB
- `bun run typecheck` exits 0 — no type errors
- Manual verification (on-chain) deferred to UAT — requires connected wallet and devnet as documented in slice plan

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run build` | 0 | ✅ pass | 16.7s |
| 2 | `cd app/web && bun run typecheck` | 0 | ✅ pass | ~2s |

### Slice-Level Verification

| # | Check | Verdict | Notes |
|---|-------|---------|-------|
| 1 | `bun run build` passes clean | ✅ pass | All pages compile |
| 2 | `bun run typecheck` passes clean | ✅ pass | No type errors |
| 3 | Manual: create simple payment on devnet | ⏭️ UAT | Requires wallet + devnet |
| 4 | Manual: create milestone payment on devnet | ⏭️ UAT | Requires wallet + devnet |
| 5 | Failure diagnostic: invalid params show error | ⏭️ UAT | Requires wallet + devnet |

## Diagnostics

- **Opening wizard:** Click "Create payment" on the Agreements page. The button is now a shadcn Dialog trigger. The wizard opens with step 1 visible.
- **Testing selectors:** `[data-testid="create-payment-wizard"]` for the Dialog content root.
- **Validation gates:** Next button is disabled when step validation fails. Step 1 checks payee validity and amount > 0. Step 2 checks all ConditionBuilder `onValidChange` callbacks report true.
- **Transaction flow:** On submit, the wizard calls `useCreatePayment()` which logs `[GherkinPay]` prefixed messages to console. TransactionStatus shows loading → success (with Explorer link) or error (with message).
- **Cache refresh:** On success, React Query keys `["agreements"]` and `["milestones"]` are invalidated, triggering any active list queries to refetch.

## Deviations

- Installed shadcn Dialog component — not listed in the task plan as an install step, but the component didn't exist in the worktree.
- Used local useState instead of react-hook-form for top-level wizard state — avoided nested RHF form conflicts with ConditionBuilder's internal RHF form.
- The `toConditionInput()` form-to-mutation adapter was added to bridge the Zod schema types (strings/numbers) to the mutation's BN/PublicKey types — not explicitly specified in the plan but necessary for the type conversion.

## Known Issues

- Agreements page bundle is 243kB due to Anchor/Solana SDK dependencies being client-side. This is expected for a Solana dApp.
- The `TransactionStatus` component in `button.tsx` uses a `render` prop pattern from @base-ui that may need adjustment if the Button API changes in future shadcn updates.

## Files Created/Modified

- `app/web/src/components/create-payment-wizard.tsx` — 3-step wizard Dialog with simple/milestone modes, validation, mutation submission, and TransactionStatus feedback
- `app/web/src/app/(console)/agreements/page.tsx` — replaced static "Create payment" button with CreatePaymentWizard component
- `app/web/src/components/ui/dialog.tsx` — shadcn Dialog component (installed via shadcn CLI)
