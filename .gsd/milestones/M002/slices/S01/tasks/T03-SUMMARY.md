---
id: T03
parent: S01
milestone: M002
provides:
  - ConditionBuilder controlled component with dynamic add/remove of up to 8 conditions
  - Zod validation schema (conditionBuilderSchema) for all 5 condition types
  - ConditionBuilderValue and ConditionFormValue exported types
  - MAX_CONDITIONS and MAX_SIGNERS constants re-exported for UI consumers
key_files:
  - app/web/src/components/condition-builder.tsx
key_decisions:
  - Used superRefine for cross-field validation (multisig threshold ≤ signers.length) instead of .refine() on individual schemas, because ZodEffects breaks z.discriminatedUnion
  - Used `as never` casts for react-hook-form Controller name props on dynamic discriminated union paths — no typed alternative exists in RHF for deeply nested discriminated unions
  - Installed react-hook-form + @hookform/resolvers as runtime dependencies for form state management
patterns_established:
  - Dynamic sub-field arrays (e.g., Multisig signers) use nested useFieldArray with `control as Control<any>` cast
  - Controller components used for all form fields to integrate shadcn Base UI primitives with react-hook-form
  - Error messages extracted via getErrorMessage helper to avoid unsafe member access on discriminated error types
  - Condition types use string literal discriminator ("timeBased" | "multisig" | "oracle" | "webhook" | "tokenGated") matching the Anchor enum variants
observability_surfaces:
  - data-testid="condition-builder" on root div for automated testing
  - data-testid="condition-row-{index}" on each condition card
  - onValidChange callback reports form validity to parent
  - Inline validation errors rendered as <p class="text-xs text-destructive"> elements
duration: 20m
verification_result: passed
completed_at: 2026-03-20T15:20:00+02:00
blocker_discovered: false
---

# T03: Condition builder component

**Built ConditionBuilder component with all 5 condition types (TimeBased, Multisig, Oracle, Webhook, TokenGated), dynamic add/remove up to 8 conditions, Multisig signer list up to 5, AND/OR operator selection, and full Zod validation.**

## What Happened

Created `condition-builder.tsx` — a controlled React component that renders a dynamic form for building payment conditions. The component uses react-hook-form with `useFieldArray` for the conditions list and nested `useFieldArray` for Multisig signers. Each condition type renders type-specific fields:

- **TimeBased**: datetime-local input, validated as a future date
- **Multisig**: dynamic signer list (add/remove, max 5) with base58 validation, threshold input with cross-field validation (threshold ≤ signers.length)
- **Oracle**: feed account (base58), comparison operator (Select: gt/gte/lt/lte/eq), target value, decimals (0-18)
- **Webhook**: relayer (base58), event hash (64 hex chars)
- **TokenGated**: required mint (base58), min amount (positive), holder (base58)

The AND/OR operator selection uses shadcn RadioGroup at the top. All PublicKey fields validate base58 encoding via `new PublicKey()`. The component accepts `value`/`onChange`/`onValidChange` props for controlled usage by the wizard.

Installed `react-hook-form` and `@hookform/resolvers` as new dependencies. The Zod schema uses `z.discriminatedUnion` on the `type` field with `superRefine` for cross-field validation (multisig threshold).

## Verification

- `bun run typecheck` exits 0 — no type errors
- `bun run build` exits 0 — all pages compile, ESLint passes, no warnings

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run typecheck` | 0 | ✅ pass | ~3s |
| 2 | `cd app/web && bun run build` | 0 | ✅ pass | ~8s |

## Diagnostics

- **Component usage:** Import `ConditionBuilder` and pass `value` (ConditionBuilderValue), `onChange`, and optionally `onValidChange`. The value shape is `{ operator: "and" | "or", conditions: ConditionFormValue[] }`.
- **Testing selectors:** `[data-testid="condition-builder"]` for the root, `[data-testid="condition-row-0"]` etc. for individual conditions.
- **Validation:** Errors appear inline below each field. The `onValidChange` callback fires with `true`/`false` as the form validity changes.
- **Default condition:** Adding a new condition defaults to TimeBased type. Changing the type via the Select resets to that type's defaults.

## Deviations

- Installed `react-hook-form` and `@hookform/resolvers` — not explicitly listed in the task plan but required by the "use react-hook-form useFieldArray" instruction.
- Used `superRefine` on the full builder schema for multisig threshold validation instead of `.refine()` on the multisig sub-schema, because `ZodEffects` breaks `z.discriminatedUnion`.

## Known Issues

- One `eslint-disable-next-line @typescript-eslint/no-explicit-any` in MultisigFields for `Control<any>` cast — unavoidable when using nested `useFieldArray` on a dynamic discriminated union path.

## Files Created/Modified

- `app/web/src/components/condition-builder.tsx` — ConditionBuilder component with all 5 condition types, dynamic add/remove, Zod validation
- `app/web/package.json` — added react-hook-form and @hookform/resolvers dependencies
- `.gsd/milestones/M002/slices/S01/tasks/T03-PLAN.md` — added Observability Impact section
