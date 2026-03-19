---
id: T01
parent: S01
milestone: M001
provides:
  - shadcn components.json config with ~/  aliases
  - cn() utility in src/lib/utils.ts
  - CSS namespace collision resolved (--border → --gp-border, --sidebar → --gp-sidebar)
  - shadcn CSS variable block with GherkinPay dark green oklch palette
  - shadcn peer dependencies installed
key_files:
  - app/web/components.json
  - app/web/src/lib/utils.ts
  - app/web/src/styles/globals.css
  - app/web/package.json
key_decisions:
  - Manual components.json creation instead of interactive shadcn init to avoid globals.css overwrite
  - Renamed --border to --gp-border and --sidebar to --gp-sidebar to avoid shadcn namespace collision
patterns_established:
  - All shadcn aliases use ~/ prefix (matching tsconfig paths), never @/
  - GherkinPay custom properties prefixed gp- when they collide with shadcn tokens
observability_surfaces:
  - grep -c "gp-border" app/web/src/styles/globals.css — should return ≥16
  - grep "var(--border)" app/web/src/styles/globals.css — should return only @theme inline refs
  - cd app/web && bun run build — non-zero exit means broken integration
duration: 8m
verification_result: passed
completed_at: 2026-03-19
blocker_discovered: false
---

# T01: Initialize shadcn config, install dependencies, and merge CSS namespaces

**Established shadcn foundation: components.json with ~/ aliases, cn() utility, 5 peer deps installed, 16 --border → --gp-border renames + 2 --sidebar → --gp-sidebar renames, shadcn CSS variables added with GherkinPay dark green oklch palette**

## What Happened

Copied `app/web` from the main repo into the worktree (untracked directory not present in git worktree). Installed existing deps with `bun install`, then added the 5 shadcn peer dependencies (class-variance-authority, clsx, tailwind-merge, lucide-react, tw-animate-css).

Created `components.json` manually to avoid the interactive `shadcn init` prompt which would overwrite `globals.css`. All aliases use `~/` to match the existing tsconfig paths (`"~/*": ["./src/*"]`).

Created `src/lib/utils.ts` with the standard `cn()` utility combining clsx and tailwind-merge.

Performed the critical CSS namespace migration: renamed `--border` to `--gp-border` (1 definition + 15 var() references = 16 total) and `--sidebar` to `--gp-sidebar` (1 definition + 1 var() reference = 2 total) throughout `globals.css`.

Added the shadcn CSS variable block to the existing `:root` with oklch values mapped from the GherkinPay dark green palette. Added `@import "tw-animate-css"` after the tailwindcss import. Added `@theme inline` block registering all shadcn tokens as Tailwind utilities, including sidebar tokens.

## Verification

- `bun install` exits cleanly (342 packages, no changes)
- `grep -c "gp-border"` returns 16 ✅
- `grep -c "gp-sidebar"` returns 2 ✅
- `grep "var(--border)"` returns only the `@theme inline` mapping line — no stale refs in CSS rules ✅
- `grep "var(--sidebar)"` returns 0 — all renamed ✅
- `components.json` contains `~/components/ui` alias ✅
- `src/lib/utils.ts` exports `cn()` function ✅
- `tw-animate-css` imported in `globals.css` ✅
- `bun run build` exits 0 — all routes build successfully ✅
- `bun run typecheck` exits 0 ✅

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun install` | 0 | ✅ pass | 0.1s |
| 2 | `grep -c "gp-border" app/web/src/styles/globals.css` | 0 (16) | ✅ pass | <0.1s |
| 3 | `grep -c "gp-sidebar" app/web/src/styles/globals.css` | 0 (2) | ✅ pass | <0.1s |
| 4 | `grep "var(--border)" app/web/src/styles/globals.css` | 0 (1 line in @theme) | ✅ pass | <0.1s |
| 5 | `cat app/web/components.json \| grep "~/components/ui"` | 0 | ✅ pass | <0.1s |
| 6 | `cat app/web/src/lib/utils.ts` (cn export) | 0 | ✅ pass | <0.1s |
| 7 | `cd app/web && bun run build` | 0 | ✅ pass | ~15s |
| 8 | `cd app/web && bun run typecheck` | 0 | ✅ pass | ~5s |

### Slice-Level Checks (Partial — T01 is intermediate)

| # | Check | Status |
|---|-------|--------|
| 1 | `bun run build` exits 0 | ✅ pass |
| 2 | `bun run typecheck` exits 0 | ✅ pass |
| 3 | `grep -c "gp-border"` ≥16 | ✅ pass |
| 4 | `var(--border)` only in shadcn defs | ✅ pass |
| 5 | UI components exist | ⏳ T02 |
| 6 | Button in console layout | ⏳ T02 |

## Diagnostics

- **CSS variable inspection:** `grep "var(--border)" app/web/src/styles/globals.css` — should return only `@theme inline` mapping. Any match in a CSS rule selector means a missed rename.
- **Build check:** `cd app/web && bun run build` — catches CSS parse errors and import failures.
- **Installed deps:** `cd app/web && bun pm ls | grep -E "class-variance|clsx|tailwind-merge|lucide|tw-animate"` — confirms all 5 shadcn peer deps.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `app/web/components.json` — new: shadcn config with new-york style, ~/ aliases, Tailwind v4 CSS path
- `app/web/src/lib/utils.ts` — new: cn() utility (clsx + tailwind-merge)
- `app/web/src/styles/globals.css` — modified: --border→--gp-border (16), --sidebar→--gp-sidebar (2), added tw-animate-css import, shadcn :root variables with oklch values, @theme inline block
- `app/web/package.json` — modified: added 5 shadcn dependencies
- `app/web/bun.lock` — modified: updated lockfile
