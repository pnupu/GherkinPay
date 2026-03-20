---
estimated_steps: 8
estimated_files: 2
---

# T04: Create payment wizard Dialog

**Slice:** S01 — Create Payment Wizard
**Milestone:** M002

## Description

Build the multi-step wizard Dialog that composes the ConditionBuilder and mutation hook into a complete payment creation flow. Wire it to the "Create Payment" button on the Agreements page.

## Steps

1. Create `app/web/src/components/create-payment-wizard.tsx`
2. Step 1 — Payment details: simple/milestone toggle using shadcn Tabs, payer wallet (Input, defaults to connected wallet pubkey), payee wallet (Input, required), token mint (display-only, hardcoded USDC devnet address), total amount (Input, number). For milestone mode: milestone count selector (2-8), per-milestone amount inputs that must sum to total amount
3. Step 2 — Conditions: In simple mode, render one ConditionBuilder. In milestone mode, render a tabbed set of ConditionBuilders (one per milestone, using Tabs)
4. Step 3 — Review & Submit: read-only summary of all fields. Submit button calls `useCreatePayment()` mutation. Display TransactionStatus component showing progress through the multi-instruction sequence
5. Navigation: Back/Next buttons between steps with validation gates (can't proceed from step 1 without required fields, can't proceed from step 2 without at least 1 condition per condition set)
6. Wrap the whole wizard in a shadcn Dialog with DialogContent, DialogHeader, DialogTitle
7. Update `app/web/src/app/(console)/agreements/page.tsx`: import the wizard, replace the existing "Create payment" `<button>` with a shadcn Button that toggles wizard Dialog open state
8. Run `bun run build` to verify everything compiles and wires together

## Must-Haves

- [ ] 3-step wizard with navigation and validation gates
- [ ] Simple and milestone modes both functional
- [ ] Submits real transactions via useCreatePayment() mutation
- [ ] TransactionStatus feedback during submission
- [ ] Wired to "Create Payment" button on agreements page
- [ ] Agreements list refreshes after successful creation

## Verification

- `cd app/web && bun run build` exits 0
- `cd app/web && bun run typecheck` exits 0
- Manual: Click "Create Payment" → wizard Dialog opens with step 1 visible

## Inputs

- `app/web/src/components/condition-builder.tsx` — condition form (from T03)
- `app/web/src/lib/mutations/create-payment.ts` — mutation hook (from T02)
- `app/web/src/components/transaction-status.tsx` — tx status display (from T01)
- `app/web/src/components/ui/dialog.tsx` — shadcn Dialog (from M001/S01)
- `app/web/src/components/ui/tabs.tsx` — shadcn Tabs (from T01)
- `app/web/src/app/(console)/agreements/page.tsx` — existing agreements page to wire

## Expected Output

- `app/web/src/components/create-payment-wizard.tsx` — complete multi-step wizard Dialog
- `app/web/src/app/(console)/agreements/page.tsx` — updated with wizard trigger
