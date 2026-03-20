# Knowledge Base


## shadcn path alias: use ~/ not @/

GherkinPay's tsconfig.json maps `"~/*": ["./src/*"]`. The shadcn default is `@/` but all aliases in `components.json` must use `~/`. When running `npx shadcn add`, generated components will use the alias from components.json — verify imports after generation.

## CSS variable collision pattern

When integrating shadcn into an existing design system, check for collisions on these common names: `--border`, `--sidebar`, `--background`, `--foreground`, `--ring`. Rename the existing system's properties with a prefix (e.g., `--gp-border`) rather than modifying shadcn, since shadcn components hardcode the unprefixed names.

## sed on macOS: requires '' after -i

macOS sed requires `sed -i ''` (empty string argument after -i flag) for in-place editing. Linux sed uses `sed -i` without the empty string.

## Typecheck must run after build in app/web

The `tsconfig.json` includes `.next/types/**/*.ts` which Next.js generates during `bun run build`. Running `bun run typecheck` before build (or on a clean `.next/` dir) fails with TS6053 "File not found" errors for every route type file. Always build first, then typecheck.

## Root lint glob catches .next build artifacts

The root `package.json` lint script uses `prettier */*.js "*/**/*{.js,.ts}" --check` which matches files inside `app/web/.next/`. The `.prettierignore` must include `.next` to avoid formatting failures on generated build output.

## Anchor v0.30+ reads program address from IDL

The `Program` constructor in `@coral-xyz/anchor` v0.30+ reads the program address directly from the IDL JSON's `address` field. No need to pass `PROGRAM_ID` separately — just pass the IDL and provider.

## Anchor 0.32 Program<IDL> generic defaults to Idl

`new Program(idl as unknown as GherkinPay, provider)` does NOT make TypeScript infer `Program<GherkinPay>` — the constructor signature takes `idl: any`, so the generic defaults to `Idl`. Accessing `program.account.paymentAgreement` fails with "Property does not exist on AccountNamespace<Idl>". Fix: cast the program to `Program<GherkinPay>` at the usage site, or add an explicit type annotation in `useAnchorProgram()`.

## Build script lives in app/web, not repo root

The root `package.json` has no `build` script — only lint. All build/typecheck/dev commands must run from `app/web/`: `cd app/web && bun run build`. Running `bun run build` at the repo root fails with "Script not found".

## EventParser requires program.coder cast

Anchor's `EventParser` constructor takes a `Coder` from a typed program. When using `useAnchorProgram()` which returns `Program<Idl>`, you must cast to `Program<GherkinPay>` to access the correctly typed coder for event parsing. The EventParser then extracts named events from transaction log messages.
