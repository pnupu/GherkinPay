# S01: shadcn Setup and Design System

**Goal:** shadcn/ui installed and themed into the existing GherkinPay Next.js 15 frontend; core components available; build passes; dark green design intact.
**Demo:** `bun run build` passes in `app/web` with shadcn Button rendered in the console layout alongside the existing dark green UI — no visual regressions, no CSS variable collisions.

## Must-Haves

- `components.json` configured with `~/` path alias (matching `tsconfig.json`)
- `src/lib/utils.ts` with `cn()` utility (clsx + tailwind-merge)
- `--border` → `--gp-border` and `--sidebar` → `--gp-sidebar` renamed across all existing CSS rules (16 + 2 references)
- shadcn CSS variable block added to `globals.css` with GherkinPay dark green oklch values
- Button, Table, Badge, Dialog components in `src/components/ui/`
- `bun run build` passes with zero errors
- Existing GherkinPay dark green theme visually intact

## Proof Level

- This slice proves: operational
- Real runtime required: yes (build + dev server visual check)
- Human/UAT required: no (build pass is sufficient; visual check is automated-friendly)

## Verification

- `cd app/web && bun run build` — exits 0 with no errors
- `cd app/web && bun run typecheck` — exits 0
- `grep -c "gp-border" app/web/src/styles/globals.css` — returns ≥16 (all old `--border` refs renamed)
- `grep "var(--border)" app/web/src/styles/globals.css` — returns 0 matches in non-shadcn sections (no stale refs)
- `ls app/web/src/components/ui/button.tsx app/web/src/components/ui/table.tsx app/web/src/components/ui/badge.tsx app/web/src/components/ui/dialog.tsx` — all exist
- `grep "Button" app/web/src/app/\(console\)/layout.tsx` — shadcn Button imported and rendered

## Integration Closure

- Upstream surfaces consumed: none (first slice)
- New wiring introduced in this slice: `components.json` config, `cn()` utility, shadcn CSS variables merged into `globals.css`, `src/components/ui/` component library
- What remains before the milestone is truly usable end-to-end: S02 (wallet connect), S03–S06 (live data pages)

## Tasks

- [ ] **T01: Initialize shadcn config, install dependencies, and merge CSS namespaces** `est:1h`
  - Why: Establishes the shadcn foundation — config, utility, dependencies — and resolves the CSS variable namespace collision before any components can be added. This is the riskiest step because a missed `--border` rename breaks existing styling.
  - Files: `app/web/components.json`, `app/web/src/lib/utils.ts`, `app/web/src/styles/globals.css`, `app/web/package.json`
  - Do: (1) Copy `app/web` from main repo (`/Users/ilkka/GherkinPay/app/web`) into the worktree since it's untracked. (2) Run `bun install` in `app/web`. (3) Create `components.json` manually with `~/` aliases (avoid interactive shadcn init). (4) Create `src/lib/utils.ts` with `cn()`. (5) Install shadcn deps: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css`. (6) In `globals.css`: rename all `--border` custom property refs to `--gp-border` (16 occurrences in rules) and `--sidebar` to `--gp-sidebar` (2 occurrences). Keep the `:root` definition lines renamed too. (7) Add `@import "tw-animate-css"` after the tailwindcss import. (8) Add shadcn `@theme inline` block mapping oklch tokens to GherkinPay dark green palette.
  - Verify: `cd app/web && bun install && grep -c "gp-border" src/styles/globals.css` shows ≥16; `grep "var(--border)" src/styles/globals.css` returns only shadcn theme definitions (not old rules); `cat components.json` shows `~/` paths; `ls src/lib/utils.ts` exists.
  - Done when: `components.json`, `src/lib/utils.ts` exist; all `--border`/`--sidebar` refs in existing CSS rules point to `--gp-border`/`--gp-sidebar`; shadcn CSS variables present in `globals.css` with GherkinPay oklch values.

- [ ] **T02: Add shadcn components, wire smoke-test Button, and verify build** `est:45m`
  - Why: Proves the shadcn integration actually works end-to-end — components render inside the existing app shell with correct imports, and the full Next.js build passes clean. This is the slice's exit gate.
  - Files: `app/web/src/components/ui/button.tsx`, `app/web/src/components/ui/table.tsx`, `app/web/src/components/ui/badge.tsx`, `app/web/src/components/ui/dialog.tsx`, `app/web/src/app/(console)/layout.tsx`
  - Do: (1) Run `npx shadcn@latest add button table badge dialog` in `app/web`. (2) Verify all generated component files use `~/lib/utils` imports (not `@/lib/utils`). Fix if needed. (3) Import `Button` from `~/components/ui/button` into the console layout and render it as a minimal smoke test (e.g., a small themed button in the header area). (4) Run `bun run build` — must exit 0. (5) Run `bun run typecheck` — must exit 0.
  - Verify: `cd app/web && bun run build` exits 0; `bun run typecheck` exits 0; `ls src/components/ui/{button,table,badge,dialog}.tsx` all exist; `grep "Button" src/app/\(console\)/layout.tsx` shows import.
  - Done when: All 4 shadcn components exist with correct `~/` imports; Button rendered in console layout; `bun run build` and `bun run typecheck` both pass clean.

## Files Likely Touched

- `app/web/components.json` (new)
- `app/web/src/lib/utils.ts` (new)
- `app/web/src/styles/globals.css` (modified — CSS merge + renames)
- `app/web/package.json` (modified — new deps)
- `app/web/src/components/ui/button.tsx` (new)
- `app/web/src/components/ui/table.tsx` (new)
- `app/web/src/components/ui/badge.tsx` (new)
- `app/web/src/components/ui/dialog.tsx` (new)
- `app/web/src/app/(console)/layout.tsx` (modified — Button smoke test)
