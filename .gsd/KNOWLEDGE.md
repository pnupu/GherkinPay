# Knowledge Base


## shadcn path alias: use ~/ not @/

GherkinPay's tsconfig.json maps `"~/*": ["./src/*"]`. The shadcn default is `@/` but all aliases in `components.json` must use `~/`. When running `npx shadcn add`, generated components will use the alias from components.json — verify imports after generation.

## CSS variable collision pattern

When integrating shadcn into an existing design system, check for collisions on these common names: `--border`, `--sidebar`, `--background`, `--foreground`, `--ring`. Rename the existing system's properties with a prefix (e.g., `--gp-border`) rather than modifying shadcn, since shadcn components hardcode the unprefixed names.

## sed on macOS: requires '' after -i

macOS sed requires `sed -i ''` (empty string argument after -i flag) for in-place editing. Linux sed uses `sed -i` without the empty string.

## Typecheck must run after build in app/web

The `tsconfig.json` includes `.next/types/**/*.ts` which Next.js generates during `bun run build`. Running `bun run typecheck` before build (or on a clean `.next/` dir) fails with TS6053 "File not found" errors for every route type file. Always build first, then typecheck.
