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

## Anchor v0.32 accountsPartial() and enum as-never casts

**Context:** M002/S01/T02

Anchor v0.32's deep generic types reject `Record<string, unknown>` for enum instruction arguments. Use `{ variantName: { ...fields } } as never` to satisfy the type checker. Similarly, use `accountsPartial()` instead of `accounts()` when some accounts are PDA-resolved (Anchor infers them). These patterns apply to all instruction calls in mutation hooks.

## shadcn init overwrites CSS variables

**Context:** M002/S01/T01

Running `npx shadcn@canary init` or adding components overwrites `:root` CSS variables in globals.css with light-theme oklch defaults. If the app uses a dark theme, you must remap all shadcn semantic tokens (--background, --foreground, --card, --popover, --primary, etc.) after every shadcn operation. The remapped values in globals.css are authoritative.

## Nested react-hook-form forms cause context conflicts

**Context:** M002/S01/T04

When a parent component uses react-hook-form and a child component (like ConditionBuilder) also uses its own internal RHF `useForm()`, the nested FormProvider contexts conflict. Solution: use plain useState for the parent wizard state and make the child component controlled via value/onChange/onValidChange props rather than sharing a single RHF instance.

## Token-2022 ATA balance check before mutation

**Context:** M002/S02/T02

When checking if a wallet has a Token-2022 ATA with sufficient balance, use a two-step approach: first call `connection.getAccountInfo(ata)` to check existence (null = no ATA), then call `connection.getTokenAccountBalance(ata)` for the balance amount. Don't skip the existence check — `getTokenAccountBalance` throws on a non-existent account rather than returning zero.

## Client component extraction for wallet-dependent pages

**Context:** M002/S02/T02

Next.js App Router pages that need wallet hooks (`useWallet`, `useConnection`) must be client components, but making the page itself a client component loses server rendering benefits. Extract a separate `*-client.tsx` component (e.g., `agreements-client.tsx`) and keep the page as a thin server shell that renders the header and delegates the data-dependent section. SSG pre-render will log WalletContext warnings — these are benign and expected.
