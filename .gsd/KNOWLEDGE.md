# Knowledge Base


## Anchor enum deserialization in JS: variants become objects

Anchor enum variants deserialize to JS objects with a single key matching the variant name (camelCase). A Rust `ConditionType::TimeBased { unlock_at }` becomes `{ timeBased: { unlockAt } }` in JavaScript. Check for condition types using `Object.keys(condition)[0]` or `'timeBased' in condition`. This applies to all Anchor enum types, not just conditions.

## Pyth PriceUpdateV2 byte offsets for off-chain parsing

When parsing Pyth PriceUpdateV2 accounts off-chain, price is at bytes 73–81 (i64 little-endian) and publish_time is at bytes 93–101 (i64 little-endian). These match the on-chain program's offsets. Always use BigInt for these values — they can exceed JS Number.MAX_SAFE_INTEGER.

## Standalone scripts can't typecheck under app/web tsconfig

Scripts in `scripts/` that import from `../app/web/src/...` via relative paths work at runtime with bun but fail `npx tsc --noEmit` when run from app/web/, because the relative path escapes the tsconfig rootDir. This is expected — verify standalone scripts by running them with bun, not via tsc.

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

## Anchor #[instruction()] only needs seed-referenced params

The `#[instruction()]` attribute on Anchor account structs only needs to list parameters that are referenced in `seeds = [...]` or other account constraints. Anchor deserializes ALL instruction parameters from the data regardless — the attribute just makes specific ones available for constraint expressions. Don't add parameters to `#[instruction()]` unless they're used in seeds/constraints.

## IDL metadata_uri integrity check

After modifying the gherkin_pay IDL, `grep -c metadata_uri app/web/src/idl/gherkin_pay.json` should return 4 (PaymentAgreement type + create_payment args + create_milestone_payment args + PaymentCreated event). If it doesn't return 4, the IDL is incomplete.

## Worktrees need bun install

Git worktrees don't share `node_modules` — running `bun install` is required before any build/dev command in a fresh worktree under `app/web/`.

## audit-log.ts imports ActivityEvent from activity.ts

The compliance audit log hook (`audit-log.ts`) re-imports the `ActivityEvent` interface from `activity.ts` rather than duplicating it. If the ActivityEvent shape changes in activity.ts, audit-log.ts must be updated in lockstep. Both files share the same EventParser pipeline pattern.

## Compliance filter pills show all event types including zero-count

Unlike the Activity page which only shows filter pills for event types present in data, the Audit Log page always renders all 7 COMPLIANCE_EVENTS pills with counts. This is deliberate — in an audit context, knowing which event types are absent is as important as seeing present ones.
