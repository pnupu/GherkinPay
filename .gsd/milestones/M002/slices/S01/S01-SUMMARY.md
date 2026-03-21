---
id: S01
parent: M002
milestone: M002
provides:
  - CreatePaymentWizard 3-step Dialog for simple and milestone payment creation
  - useCreatePayment() React Query mutation hook with sequential multi-instruction submission
  - ConditionBuilder component supporting all 5 condition types with dynamic add/remove
  - TransactionStatus reusable component for on-chain write feedback (loading/success/error)
  - shadcn form components (Input, Label, Select, RadioGroup, Tabs, Separator, Badge, Dialog)
  - useAnchorProgram() hook, PDA helpers, IDL types, program constants
  - react-hook-form + zod validation patterns for complex discriminated union forms
requires:
  - slice: M001/S01
    provides: shadcn Dialog, Button, Table, Badge base components and dark theme CSS tokens
  - slice: M001/S02
    provides: wallet adapter (useWallet, useConnection) and ConnectionProvider/WalletProvider layout
  - slice: M001/S03
    provides: useAgreements() query hook, React Query queryClient, PDA helper signatures
affects:
  - S02
  - S03
key_files:
  - app/web/src/components/create-payment-wizard.tsx
  - app/web/src/components/condition-builder.tsx
  - app/web/src/components/transaction-status.tsx
  - app/web/src/lib/mutations/create-payment.ts
  - app/web/src/lib/anchor.ts
  - app/web/src/lib/pda.ts
  - app/web/src/lib/constants.ts
  - app/web/src/types/gherkin_pay.ts
  - app/web/src/idl/gherkin_pay.json
  - app/web/src/app/(console)/agreements/page.tsx
key_decisions:
  - Local useState for wizard top-level state instead of nested react-hook-form — avoids RHF form conflicts with ConditionBuilder's internal RHF
  - superRefine for cross-field validation on discriminated unions — ZodEffects breaks z.discriminatedUnion
  - as-never casts for Anchor v0.32 enum args and RHF Controller paths on discriminated unions — no typed alternative exists
  - Sequential .rpc() calls per instruction instead of batched transactions — simpler error handling, each instruction confirmed before next
  - USDC amount conversion uses 6-decimal precision (Math.round(amount * 1_000_000))
patterns_established:
  - Mutation hooks in lib/mutations/ with useMutation + queryClient.invalidateQueries on success
  - Anchor condition enums passed as { variantName: { ...fields } } as never
  - Payment IDs generated as BN(Date.now() * 1000 + random) for collision resistance
  - Console logs prefixed with [GherkinPay] for observable transaction flow debugging
  - ConditionBuilder as controlled component with value/onChange/onValidChange props
  - toConditionInput() adapter bridges Zod form types (string/number) to mutation BN/PublicKey types
  - Multi-step wizard pattern: numbered step state, validation gates per step, conditional rendering
observability_surfaces:
  - TransactionStatus renders role="status" aria-live="polite" for programmatic observation
  - Success state links to explorer.solana.com/tx/{sig}?cluster=devnet
  - [GherkinPay] prefixed console logs for each instruction's tx signature
  - [GherkinPay] Payment creation failed: logged to console.error on mutation error
  - React Query cache keys ["agreements"] and ["milestones"] invalidated on success
  - data-testid selectors on wizard (create-payment-wizard), condition builder (condition-builder), condition rows (condition-row-{index})
drill_down_paths:
  - .gsd/milestones/M002/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M002/slices/S01/tasks/T03-SUMMARY.md
  - .gsd/milestones/M002/slices/S01/tasks/T04-SUMMARY.md
duration: 62m
verification_result: passed
completed_at: 2026-03-20T14:50:02+02:00
---

# S01: Create Payment Wizard

**3-step Dialog wizard for creating simple and milestone payment agreements with all 5 condition types, sequential on-chain transaction submission, and automatic agreements list refresh — wired into the Agreements page.**

## What Happened

Built the Create Payment Wizard in four incremental tasks:

**T01** installed 7 shadcn/ui form components (Input, Label, Select, RadioGroup, Tabs, Separator, Badge) and created the `TransactionStatus` component with four states (idle/loading/success/error). The shadcn init overwrote dark theme CSS variables, requiring a full remap of all semantic tokens to match the app's green-on-black design system.

**T02** created the `useCreatePayment()` mutation hook — the core business logic. It handles the complete multi-instruction sequence: `createPayment` (or `createMilestonePayment`) → `addMilestone` ×N → `addCondition` ×N → `finalizeConditions` ×N. Each instruction is sent as a separate `.rpc()` call with sequential confirmation. This task also created prerequisite infrastructure (anchor.ts, pda.ts, constants.ts, IDL types) that M001 slices documented but hadn't merged into the M002 branch. Five Solana/Anchor npm packages were installed as runtime dependencies.

**T03** built the `ConditionBuilder` component — the most complex form element. It renders dynamic condition forms (add/remove up to 8) with type-specific fields for all 5 condition types: TimeBased (datetime → unix timestamp), Multisig (signer list + threshold), Oracle (feed account + comparison + target value), Webhook (relayer + event hash), TokenGated (mint + min amount + holder). AND/OR operator selection via RadioGroup. Uses react-hook-form with useFieldArray and Zod discriminatedUnion validation with superRefine for cross-field checks.

**T04** composed everything into the `CreatePaymentWizard` Dialog: Step 1 (payment details with simple/milestone toggle, payee, amount, per-milestone amounts), Step 2 (ConditionBuilder or tabbed per-milestone ConditionBuilders), Step 3 (review summary + submit with TransactionStatus feedback). The wizard trigger replaces the static "Create payment" button on the Agreements page. Validation gates prevent advancing with invalid data.

## Verification

| # | Check | Result |
|---|-------|--------|
| 1 | `bun run build` passes clean in app/web | ✅ pass — all pages compile, agreements page at 243kB |
| 2 | `bun run typecheck` (via next build type checking) | ✅ pass — no source type errors |
| 3 | All 11 key files exist on disk | ✅ pass |
| 4 | shadcn components importable | ✅ pass — build validates all imports |
| 5 | CreatePaymentWizard wired to Agreements page | ✅ pass — page.tsx imports and renders wizard |
| 6 | Manual: create simple payment on devnet | ⏭️ UAT — requires connected wallet |
| 7 | Manual: create milestone payment on devnet | ⏭️ UAT — requires connected wallet |
| 8 | Failure diagnostic: invalid params show error | ⏭️ UAT — requires connected wallet |

## New Requirements Surfaced

- none

## Deviations

- **M001 prerequisites created in T02**: anchor.ts, pda.ts, constants.ts, IDL types, and 5 Solana npm packages were not present in the M002 worktree. T02 created them to unblock the mutation hook. These duplicate what M001 slices documented but hadn't merged.
- **shadcn Dialog installed in T04**: The Dialog component wasn't in the worktree despite being an M001/S01 deliverable. Installed via shadcn CLI.
- **Local useState for wizard instead of react-hook-form**: The plan called for react-hook-form for the full wizard, but ConditionBuilder already manages its own internal RHF form. Nesting RHF forms causes conflicts, so top-level wizard state uses useState.
- **Badge component added in T01**: Not in the original install list but required by the TransactionStatus component's design.

## Known Limitations

- On-chain transaction flows are untested in the browser — typecheck and build pass, but devnet wallet signing is deferred to UAT.
- Agreements page bundle is 243kB due to Anchor/Solana SDK client-side dependencies — expected for a Solana dApp but worth monitoring.
- IDL JSON and types are copied from the repo's `target/` directory. If the Anchor program changes, they must be regenerated with `anchor build` and re-copied.
- `tsc --noEmit` reports TS6053 for missing `.next/types/` files (only generated during `next build`). This is a known Next.js issue — the build itself includes type checking and passes clean.

## Follow-ups

- none — S02 (Fund Payment) is the natural next step and all prerequisites are in place.

## Files Created/Modified

- `app/web/src/components/create-payment-wizard.tsx` — 3-step wizard Dialog with simple/milestone modes, validation, mutation submission, TransactionStatus feedback
- `app/web/src/components/condition-builder.tsx` — ConditionBuilder with all 5 condition types, dynamic add/remove, Zod validation
- `app/web/src/components/transaction-status.tsx` — TransactionStatus with idle/loading/success/error states and Explorer links
- `app/web/src/lib/mutations/create-payment.ts` — useCreatePayment() mutation hook with full simple + milestone payment flows
- `app/web/src/lib/anchor.ts` — useAnchorProgram() hook returning typed Program<GherkinPay>
- `app/web/src/lib/pda.ts` — PDA derivation helpers (getPaymentPDA, getEscrowPDA, getConditionPDA)
- `app/web/src/lib/constants.ts` — PROGRAM_ID and SOLANA_RPC_URL constants
- `app/web/src/types/gherkin_pay.ts` — TypeScript IDL type
- `app/web/src/idl/gherkin_pay.json` — Anchor IDL JSON
- `app/web/src/components/ui/input.tsx` — shadcn Input
- `app/web/src/components/ui/label.tsx` — shadcn Label
- `app/web/src/components/ui/select.tsx` — shadcn Select
- `app/web/src/components/ui/radio-group.tsx` — shadcn RadioGroup
- `app/web/src/components/ui/tabs.tsx` — shadcn Tabs
- `app/web/src/components/ui/separator.tsx` — shadcn Separator
- `app/web/src/components/ui/badge.tsx` — shadcn Badge
- `app/web/src/components/ui/dialog.tsx` — shadcn Dialog
- `app/web/src/components/ui/button.tsx` — shadcn Button (generated by init)
- `app/web/src/lib/utils.ts` — cn() utility
- `app/web/src/styles/globals.css` — remapped shadcn CSS variables to dark theme
- `app/web/components.json` — shadcn configuration
- `app/web/src/app/(console)/agreements/page.tsx` — replaced static button with CreatePaymentWizard
- `app/web/package.json` — added Anchor, Solana, react-hook-form, @hookform/resolvers dependencies

## Forward Intelligence

### What the next slice should know
- `useCreatePayment()` establishes the mutation pattern: `useMutation` + `queryClient.invalidateQueries(["agreements"])` on success. S02's `useFundPayment()` should follow the same shape.
- The `toConditionInput()` adapter in create-payment-wizard.tsx shows the pattern for converting form types to BN/PublicKey mutation types — reuse this approach for any future form→mutation bridges.
- `useAnchorProgram()` returns `{ program }` where program is `Program<GherkinPay> | null` (null when wallet disconnected). All mutation hooks must handle the null case.
- `accountsPartial()` is used instead of `accounts()` for PDA-resolved Anchor accounts — Anchor v0.32 requires this pattern.

### What's fragile
- The IDL JSON and TypeScript types are static copies from `target/`. Any program change without regeneration will cause silent runtime failures (instruction accounts won't match). This matters because S02/S03 use the same IDL.
- The `as never` casts on Anchor enum args suppress real type checking. If instruction argument shapes change in the IDL, TypeScript won't catch it — errors will surface at runtime only.

### Authoritative diagnostics
- Browser console filtered for `[GherkinPay]` shows the full transaction flow — each instruction logged with its tx signature. This is the first place to look when debugging on-chain failures.
- `data-testid="create-payment-wizard"` is the selector for the wizard Dialog content. `data-testid="condition-builder"` and `data-testid="condition-row-{index}"` for condition forms.
- React Query DevTools (if installed) can inspect the `["agreements"]` and `["milestones"]` cache keys for invalidation verification.

### What assumptions changed
- M001 deliverables (anchor.ts, pda.ts, constants.ts) were assumed to be in the M002 branch — they weren't. T02 created them. Future slices should verify upstream dependencies exist in the worktree before planning.
- shadcn init was assumed to be non-destructive — it overwrites CSS variables. The remap in globals.css is authoritative for the dark theme.
