---
id: T02
parent: S01
milestone: M001
provides:
  - shadcn Button, Table, Badge, Dialog components in src/components/ui/
  - Button smoke-test rendered in console layout sidebar
key_files:
  - app/web/src/components/ui/button.tsx
  - app/web/src/components/ui/table.tsx
  - app/web/src/components/ui/badge.tsx
  - app/web/src/components/ui/dialog.tsx
  - app/web/src/app/(console)/layout.tsx
key_decisions:
  - Used shadcn CLI with --yes flag for non-interactive component generation
patterns_established:
  - shadcn components live in src/components/ui/ with ~/lib/utils imports
observability_surfaces:
  - "ls app/web/src/components/ui/" lists installed components
  - "bun run build" in app/web catches broken imports or CSS errors
  - "bun run typecheck" catches alias mismatches
duration: 5m
verification_result: passed
completed_at: 2026-03-19
blocker_discovered: false
---

# T02: Add shadcn components, wire smoke-test Button, and verify build

**Added Button/Table/Badge/Dialog shadcn components and wired smoke-test Button in console sidebar; build and typecheck pass clean.**

## What Happened

Ran `npx shadcn@latest add button table badge dialog --yes` in `app/web`, which generated all four component files in `src/components/ui/`. The CLI correctly used `~/lib/utils` imports (no `@/` fixup needed) thanks to the `components.json` configured in T01. Imported `Button` into the console layout and rendered a "Connect Wallet" outline button in the sidebar footer as a smoke test. Both `bun run build` and `bun run typecheck` pass with zero errors.

## Verification

- All four component files exist in `src/components/ui/`
- No `@/lib/utils` imports found — all use `~/lib/utils`
- Button imported and rendered in `(console)/layout.tsx`
- `gp-border` count in globals.css = 16 (all renames intact from T01)
- `var(--border)` only appears in the `@theme inline` block (shadcn mapping, expected)
- `bun run build` exits 0
- `bun run typecheck` exits 0

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `ls app/web/src/components/ui/{button,table,badge,dialog}.tsx` | 0 | ✅ pass | <1s |
| 2 | `grep -r '@/lib/utils' app/web/src/components/ui/` | 1 (no match) | ✅ pass | <1s |
| 3 | `grep "Button" app/web/src/app/(console)/layout.tsx` | 0 | ✅ pass | <1s |
| 4 | `cd app/web && bun run build` | 0 | ✅ pass | 13s |
| 5 | `cd app/web && bun run typecheck` | 0 | ✅ pass | 13s |
| 6 | `grep -c "gp-border" app/web/src/styles/globals.css` | 0 (returns 16) | ✅ pass | <1s |

## Diagnostics

- **Component inventory:** `ls app/web/src/components/ui/` — should list button.tsx, table.tsx, badge.tsx, dialog.tsx
- **Build health:** `cd app/web && bun run build` — non-zero exit means broken shadcn integration
- **Import alias audit:** `grep -r '@/lib/utils' app/web/src/components/ui/` — must return nothing
- **Smoke test presence:** `grep "Button" app/web/src/app/\(console\)/layout.tsx` — confirms Button wired in

## Deviations

None.

## Known Issues

- Typecheck must run after build because `tsconfig.json` includes `.next/types/**/*.ts` which are only generated during build. Running typecheck on a clean `.next/` directory fails with TS6053 errors. This is a pre-existing project characteristic, not introduced by this task.

## Files Created/Modified

- `app/web/src/components/ui/button.tsx` — shadcn Button component (new-york style)
- `app/web/src/components/ui/table.tsx` — shadcn Table component family
- `app/web/src/components/ui/badge.tsx` — shadcn Badge component
- `app/web/src/components/ui/dialog.tsx` — shadcn Dialog component
- `app/web/src/app/(console)/layout.tsx` — added Button import and "Connect Wallet" smoke-test button in sidebar
