---
id: S01
parent: M001
milestone: M001
provides:
  - shadcn/ui component library (Button, Table, Badge, Dialog) in src/components/ui/
  - cn() utility in src/lib/utils.ts
  - components.json with ~/ alias configuration
  - Merged CSS namespace — GherkinPay tokens coexist with shadcn tokens in globals.css
  - GherkinPay dark green oklch palette mapped into shadcn CSS variables
requires: []
affects:
  - S02
  - S03
  - S04
  - S05
  - S06
key_files:
  - app/web/components.json
  - app/web/src/lib/utils.ts
  - app/web/src/styles/globals.css
  - app/web/src/components/ui/button.tsx
  - app/web/src/components/ui/table.tsx
  - app/web/src/components/ui/badge.tsx
  - app/web/src/components/ui/dialog.tsx
  - app/web/src/app/(console)/layout.tsx
key_decisions:
  - Manual components.json creation instead of interactive shadcn init to avoid globals.css overwrite
  - Renamed --border to --gp-border and --sidebar to --gp-sidebar to avoid shadcn namespace collision
  - shadcn canary path for Tailwind v4 CSS-based config compatibility
patterns_established:
  - All shadcn aliases use ~/ prefix (matching tsconfig paths), never @/
  - GherkinPay custom properties prefixed gp- when they collide with shadcn tokens
  - shadcn components live in src/components/ui/ with ~/lib/utils imports
  - Typecheck must run after build (tsconfig includes .next/types/**)
observability_surfaces:
  - "grep -c 'gp-border' app/web/src/styles/globals.css" — must return ≥16, confirms no CSS rename regression
  - "grep 'var(--border)' app/web/src/styles/globals.css" — only @theme inline mapping, no stale refs in CSS rules
  - "ls app/web/src/components/ui/" — lists installed shadcn components
  - "cd app/web && bun run build" — non-zero exit means broken integration
  - "cd app/web && bun run typecheck" — catches import alias mismatches and type errors
drill_down_paths:
  - .gsd/milestones/M001/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T02-SUMMARY.md
duration: 13m
verification_result: passed
completed_at: 2026-03-19
---

# S01: shadcn Setup and Design System

**shadcn/ui installed, themed to GherkinPay dark green palette, and building clean alongside existing CSS — Button, Table, Badge, Dialog available; CSS namespace collision resolved; `bun run build` and `bun run typecheck` pass.**

## What Happened

T01 established the shadcn foundation. Copied `app/web` into the worktree (untracked by git), installed dependencies, then created `components.json` manually to avoid the interactive `shadcn init` overwriting `globals.css`. Created `src/lib/utils.ts` with the `cn()` utility (clsx + tailwind-merge). Installed five shadcn peer deps: class-variance-authority, clsx, tailwind-merge, lucide-react, tw-animate-css.

The critical work was the CSS namespace migration: renamed `--border` to `--gp-border` (16 occurrences — 1 definition + 15 var() references) and `--sidebar` to `--gp-sidebar` (2 occurrences) throughout `globals.css`. This prevents shadcn's own `--border` and `--sidebar` tokens from colliding with GherkinPay's existing design system. Added the shadcn CSS variable block to `:root` with oklch values mapped from the GherkinPay dark green palette, plus an `@theme inline` block registering all shadcn tokens as Tailwind utilities.

T02 added the four core shadcn components via `npx shadcn@latest add button table badge dialog --yes`. The CLI correctly resolved `~/lib/utils` imports from `components.json` — no manual fixup needed. Imported Button into the console layout sidebar as a "Connect Wallet" smoke test. Build and typecheck both pass clean.

## Verification

- All four component files exist in `src/components/ui/` ✅
- `grep -c "gp-border"` returns 16 — all renames intact ✅
- `var(--border)` only appears in `@theme inline` mapping — no stale refs in CSS rules ✅
- No `@/lib/utils` imports found in any component — all use `~/lib/utils` ✅
- Button imported and rendered in `(console)/layout.tsx` ✅
- `bun run build` exits 0 — all 9 routes build successfully ✅
- `bun run typecheck` exits 0 ✅

## Requirements Advanced

- R006 (shadcn/ui Component System) — Foundation established: shadcn installed, themed, four core components available, build passes. Remaining: S02–S06 adopt these components in page-level UI.

## Requirements Validated

- None — R006 is partially fulfilled by S01 but requires supporting slices to complete adoption.

## New Requirements Surfaced

- None

## Requirements Invalidated or Re-scoped

- None

## Deviations

None.

## Known Limitations

- Only four shadcn components installed (Button, Table, Badge, Dialog). Additional components (Form, Select, Input, etc.) will need `npx shadcn add` as S02–S06 require them.
- The Button in the console layout is a smoke test placeholder — S02 will replace it with a real wallet connect button.
- Visual runtime verification was not performed (build pass is the proof level for this slice). CSS variable collisions would manifest as wrong colors at runtime.

## Follow-ups

- None — all planned work completed as specified.

## Files Created/Modified

- `app/web/components.json` — new: shadcn config with new-york style, ~/ aliases, Tailwind v4 CSS path
- `app/web/src/lib/utils.ts` — new: cn() utility (clsx + tailwind-merge)
- `app/web/src/styles/globals.css` — modified: --border→--gp-border (16), --sidebar→--gp-sidebar (2), added tw-animate-css import, shadcn :root variables with oklch values, @theme inline block
- `app/web/package.json` — modified: added 5 shadcn dependencies
- `app/web/bun.lock` — modified: updated lockfile
- `app/web/src/components/ui/button.tsx` — new: shadcn Button component
- `app/web/src/components/ui/table.tsx` — new: shadcn Table component family
- `app/web/src/components/ui/badge.tsx` — new: shadcn Badge component
- `app/web/src/components/ui/dialog.tsx` — new: shadcn Dialog component
- `app/web/src/app/(console)/layout.tsx` — modified: added Button import and "Connect Wallet" smoke test

## Forward Intelligence

### What the next slice should know
- shadcn components import from `~/components/ui/<name>`. The `cn()` utility imports from `~/lib/utils`. These paths are set by `components.json` and must not change.
- To add more shadcn components: `cd app/web && npx shadcn@latest add <component> --yes`. The CLI reads `components.json` and generates correct `~/` imports automatically.
- The "Connect Wallet" Button in the sidebar footer (`layout.tsx`) is a placeholder for S02 to replace with the real wallet connect button.

### What's fragile
- CSS variable namespace — if anyone adds a raw `--border` or `--sidebar` custom property in a non-shadcn context, it will collide with shadcn's tokens. Always use `--gp-border` / `--gp-sidebar` for GherkinPay-specific properties.
- `@theme inline` block in `globals.css` must stay in sync with shadcn's expected token names. Adding new shadcn components that reference new tokens (e.g., `--chart-*`) may require extending this block.

### Authoritative diagnostics
- `grep -c "gp-border" app/web/src/styles/globals.css` — returns 16; any lower means a CSS rename was reverted or a new collision was introduced
- `grep "var(--border)" app/web/src/styles/globals.css` — must return only the `@theme inline` mapping line; matches in CSS rule selectors indicate a missed rename
- `cd app/web && bun run build` — exit 0 is the definitive integration health check; captures CSS parse errors, missing imports, and type errors in one pass
- `ls app/web/src/components/ui/` — quick component inventory check

### What assumptions changed
- No assumptions changed. shadcn canary + Tailwind v4 + Next.js 15 worked without issues. The CSS namespace collision pattern (--border, --sidebar) was anticipated and resolved as planned.
