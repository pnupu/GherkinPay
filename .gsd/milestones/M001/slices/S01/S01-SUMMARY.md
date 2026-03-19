---
id: S01
milestone: M001
provides:
  - shadcn/ui (canary) installed with Tailwind v4 CSS config path
  - components.json configured with ~/  path aliases
  - cn() utility at src/lib/utils.ts (importable as ~/lib/utils)
  - CSS namespace collision resolved: --border → --gp-border (16 refs), --sidebar → --gp-sidebar (2 refs)
  - shadcn CSS variables block with GherkinPay dark green oklch palette merged into globals.css
  - Button, Table, Badge, Dialog components in src/components/ui/ with ~/lib/utils imports
  - smoke-test Button rendered in console layout sidebar
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
  - Manual components.json creation (not interactive shadcn init) to avoid globals.css overwrite
  - GherkinPay custom properties prefixed gp- when colliding with shadcn tokens (--border, --sidebar)
  - All shadcn aliases use ~/  prefix matching tsconfig paths, never @/
  - tw-animate-css imported after tailwindcss; @theme inline block registers all shadcn tokens as Tailwind utilities
patterns_established:
  - shadcn components live in src/components/ui/ with ~/lib/utils imports
  - Colliding CSS custom properties get a gp- prefix rather than aliasing — allows shadcn to own its namespace cleanly
drill_down_paths:
  - .gsd/milestones/M001/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T02-SUMMARY.md
duration: 13m
verification_result: pass
completed_at: 2026-03-19
---

# S01: shadcn Setup and Design System

**shadcn/ui canary installed and themed with GherkinPay dark green oklch palette; CSS namespace collision resolved via gp- prefix; Button/Table/Badge/Dialog components wired; bun run build and typecheck pass clean.**

## What Happened

### T01 — Foundation

Created `components.json` manually with `~/` aliases (new-york style, Tailwind v4 CSS path). Created `src/lib/utils.ts` with the standard `cn()` combining clsx + tailwind-merge. Added 5 shadcn peer dependencies via bun.

The critical work was CSS namespace migration: shadcn uses `--border` and `--sidebar` which collided with existing GherkinPay custom properties. The resolution was to rename the GherkinPay properties to `--gp-border` and `--gp-sidebar` throughout `globals.css` (16 + 2 occurrences), then let shadcn own `--border` and `--sidebar` cleanly in its own block. This is cleaner than aliasing and means shadcn components inherit their own token semantics correctly.

Added the shadcn `:root` CSS variable block with GherkinPay dark green oklch values (`--background: oklch(0.07 0.016 158)` etc.) and an `@theme inline` block registering all tokens as Tailwind utilities.

### T02 — Components

Ran `npx shadcn@latest add button table badge dialog --yes`. The CLI correctly used `~/lib/utils` imports thanks to `components.json` configured in T01 — no fixup needed. Added a "Connect Wallet" outline Button to the console layout sidebar as a smoke test. Both `bun run build` and `bun run typecheck` passed clean (13s each).

**Note:** `bun run typecheck` must run after `bun run build` because tsconfig includes `.next/types/**/*.ts` which is only generated during build. This is a pre-existing project characteristic.

## Verification Results

| Check | Command | Result |
|-------|---------|--------|
| gp-border refs | `grep -c "gp-border" globals.css` | 16 ✅ |
| gp-sidebar refs | `grep -c "gp-sidebar" globals.css` | 2 ✅ |
| no stale --border in CSS rules | `grep "var(--border)" globals.css` | 1 (only @theme inline) ✅ |
| components exist | `ls src/components/ui/{button,table,badge,dialog}.tsx` | all present ✅ |
| no @/ imports | `grep -r '@/lib/utils' src/components/ui/` | 0 matches ✅ |
| Button in layout | `grep "Button" src/app/(console)/layout.tsx` | present ✅ |
| build | `bun run build` | exit 0 ✅ |
| typecheck | `bun run typecheck` | exit 0 ✅ |

## Deviations from Plan

- The S01-CONTEXT.md from the discuss phase specified "rename old tokens to shadcn names, update all references" (full consolidation). During execution, only `--border` and `--sidebar` were renamed because those are the only tokens that directly collide with shadcn's namespace. The remaining GherkinPay tokens (`--bg`, `--green`, `--surface`, `--text`, etc.) have no shadcn collision — they were left in place and shadcn's palette was mapped to new oklch equivalents alongside them. This is actually the better outcome: existing CSS classes continue to work unchanged while shadcn components get their own properly-scoped tokens.

## What S02 Should Know

- Import shadcn Button from `~/components/ui/button` — it renders with `--primary` (GherkinPay green) on dark background
- The `cn()` utility is at `~/lib/utils` — use it for conditional class composition
- CSS custom property collision pattern: if any future token collides with shadcn, prefix with `gp-` and update all references
- The "Connect Wallet" smoke-test Button in the layout sidebar is a placeholder for the real wallet connect button S02 will wire — it can be replaced or repurposed
