---
estimated_steps: 7
estimated_files: 1
---

# T03: Condition builder component

**Slice:** S01 — Create Payment Wizard
**Milestone:** M002

## Description

Build the ConditionBuilder component — a dynamic form that lets users add/remove conditions (up to 8), select condition type via dropdown, and fill in type-specific fields. Used in both simple and milestone modes of the wizard.

## Steps

1. Create `app/web/src/components/condition-builder.tsx`
2. Define the condition form schema with zod: discriminated union of 5 types — TimeBased (unlockAt: datetime string → converted to unix timestamp BN), Multisig (signers: PublicKey strings up to 5, threshold: number), Oracle (feedAccount: PublicKey string, operator: gt|gte|lt|lte|eq, targetValue: number, decimals: number), Webhook (relayer: PublicKey string, eventHash: hex string → [u8;32]), TokenGated (requiredMint: PublicKey string, minAmount: number, holder: PublicKey string)
3. Render AND/OR operator selection at the top using shadcn RadioGroup
4. Render the conditions list using react-hook-form `useFieldArray`. Each condition row has: a shadcn Select for condition type, type-specific input fields using shadcn Input/Select/Label, and a remove button
5. "Add Condition" button at the bottom (disabled when count reaches MAX_CONDITIONS=8)
6. For Multisig: dynamic signer list with add/remove (max MAX_SIGNERS=5) and threshold input (1 to signers.length)
7. Validate all fields: PublicKey strings must be valid base58, amounts must be positive, datetime must be valid, threshold ≤ signers.length

## Must-Haves

- [ ] All 5 condition types render with correct type-specific fields
- [ ] Dynamic add/remove of conditions, capped at 8
- [ ] Multisig signer list dynamic add/remove, capped at 5
- [ ] AND/OR operator selection
- [ ] Zod validation for all fields

## Verification

- `cd app/web && bun run typecheck` exits 0
- Component imports and renders without error in isolation

## Inputs

- `app/web/src/components/ui/input.tsx` — shadcn Input (from T01)
- `app/web/src/components/ui/label.tsx` — shadcn Label (from T01)
- `app/web/src/components/ui/select.tsx` — shadcn Select (from T01)
- `app/web/src/components/ui/radio-group.tsx` — shadcn RadioGroup (from T01)
- `programs/gherkin-pay/src/state/condition.rs` — condition type definitions, limits

## Expected Output

- `app/web/src/components/condition-builder.tsx` — dynamic condition form builder component

## Observability Impact

- **Signals changed:** ConditionBuilder emits `data-testid="condition-builder"` and `data-testid="condition-row-{index}"` attributes for automated testing and browser inspection. Validation errors are rendered inline as `<p class="text-xs text-destructive">` elements.
- **Inspection:** Use `data-testid` selectors to query condition count, current type selections, and error state in browser automation. The component exposes `onValidChange` callback for parent forms to track validation state.
- **Failure visibility:** Zod validation errors for each field (invalid base58 address, future date requirement, threshold > signers, etc.) are surfaced as inline error messages below each field. No console logging from this component — it is a pure form component.
