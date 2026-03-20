# Knowledge Base

## Zod discriminatedUnion + .refine() breaks the union

**Context:** Building condition-builder.tsx (M002/S01/T03)

When using `z.discriminatedUnion("type", [...schemas])`, individual sub-schemas that use `.refine()` get wrapped in `ZodEffects`, which breaks the discriminated union (it requires `ZodObject` instances). Solution: move cross-field validation to `superRefine` on the parent schema instead.

## React-hook-form Controller paths for discriminated unions

**Context:** Building condition-builder.tsx (M002/S01/T03)

RHF's `Controller` `name` prop is strictly typed and doesn't support dynamic paths into discriminated union fields (e.g., `conditions.${index}.feedAccount` when the conditions array is a discriminated union). The only workaround is `as never` casts on the name prop. Similarly, nested `useFieldArray` on a discriminated union sub-path (like `conditions.${index}.signers`) requires `control as Control<any>`.

## ESLint flat config file-level disable with "use client"

**Context:** M002/S01/T03

In Next.js with ESLint flat config, a `/* eslint-disable */` comment placed after `"use client"` directive DOES work. However, `reportUnusedDisableDirectives: true` will flag them as unused if there are no violations in the comment's scope. Place the comment on line 2 (after "use client") for client components.
