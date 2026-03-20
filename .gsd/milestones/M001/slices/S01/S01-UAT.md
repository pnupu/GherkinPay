# S01: shadcn Setup and Design System — UAT

**Milestone:** M001
**Written:** 2026-03-19

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: This slice installs tooling and resolves CSS conflicts — build pass and file existence are the primary proof. No user-facing flows to exercise at runtime.

## Preconditions

- Working directory is the M001 worktree with `app/web` present
- `bun install` has been run in `app/web`
- No dev server required (build-only verification)

## Smoke Test

Run `cd app/web && bun run build` — must exit 0 with all 9 routes listed in the output.

## Test Cases

### 1. shadcn config exists with correct aliases

1. Run `cat app/web/components.json`
2. **Expected:** File exists. `aliases.components` is `~/components/ui`, `aliases.utils` is `~/lib/utils`, `aliases.ui` is `~/components/ui`, `aliases.lib` is `~/lib`, `aliases.hooks` is `~/hooks`.

### 2. cn() utility exists and exports correctly

1. Run `cat app/web/src/lib/utils.ts`
2. **Expected:** File exports a `cn` function that combines `clsx` and `twMerge`.

### 3. All four shadcn components exist with correct imports

1. Run `ls app/web/src/components/ui/{button,table,badge,dialog}.tsx`
2. **Expected:** All four files exist.
3. Run `grep -r '@/lib/utils' app/web/src/components/ui/`
4. **Expected:** No matches — all components use `~/lib/utils`, not `@/lib/utils`.

### 4. CSS namespace collision resolved — --border renamed

1. Run `grep -c "gp-border" app/web/src/styles/globals.css`
2. **Expected:** Returns 16 or higher.
3. Run `grep "var(--border)" app/web/src/styles/globals.css`
4. **Expected:** Only one match, in the `@theme inline` block (shadcn mapping). No matches in `.panel`, `.table`, or other CSS rule selectors.

### 5. CSS namespace collision resolved — --sidebar renamed

1. Run `grep -c "gp-sidebar" app/web/src/styles/globals.css`
2. **Expected:** Returns 2 or higher.
3. Run `grep "var(--sidebar)" app/web/src/styles/globals.css`
4. **Expected:** Zero matches — all old `--sidebar` references now use `--gp-sidebar`.

### 6. shadcn CSS variables present with oklch values

1. Run `grep "oklch" app/web/src/styles/globals.css | head -5`
2. **Expected:** Multiple lines showing oklch color values for shadcn tokens (--background, --primary, --card, etc.).

### 7. Button smoke test wired in console layout

1. Run `grep "Button" app/web/src/app/\(console\)/layout.tsx`
2. **Expected:** Shows `import { Button }` from `~/components/ui/button` and a `<Button` render.

### 8. Build passes clean

1. Run `cd app/web && bun run build`
2. **Expected:** Exit code 0. Output shows "Compiled successfully" and lists all routes without errors.

### 9. Typecheck passes clean

1. Run `cd app/web && bun run typecheck`
2. **Expected:** Exit code 0. No type errors.

### 10. shadcn peer dependencies installed

1. Run `cd app/web && bun pm ls 2>/dev/null | grep -E "class-variance-authority|clsx|tailwind-merge|lucide-react|tw-animate-css"`
2. **Expected:** All five packages listed.

## Edge Cases

### Stale --border reference introduced by future edit

1. Add a line `border-color: var(--border);` to a CSS rule in `globals.css`
2. Run `bun run build`
3. **Expected:** Build still passes (CSS is valid), but the element will use shadcn's `--border` value instead of GherkinPay's `--gp-border`. This is a silent visual regression — the diagnostic is `grep "var(--border)" globals.css` returning matches outside `@theme inline`.

### Adding a new shadcn component

1. Run `cd app/web && npx shadcn@latest add input --yes`
2. Check `app/web/src/components/ui/input.tsx`
3. **Expected:** File exists, imports from `~/lib/utils` (not `@/lib/utils`).

## Failure Signals

- `bun run build` exits non-zero — broken CSS, missing imports, or type errors
- `grep -c "gp-border"` returns less than 16 — CSS rename regression
- `grep "var(--border)"` matches in CSS rule selectors (not just `@theme inline`) — missed rename causing visual regression
- `grep '@/lib/utils'` matches in any component — wrong alias path
- Any `src/components/ui/` file missing — shadcn add failed

## Requirements Proved By This UAT

- R006 (partially) — shadcn installed, themed, four components available, build passes. Full validation requires S02–S06 to adopt components in page-level UI.

## Not Proven By This UAT

- Runtime visual appearance — no dev server started, no screenshot comparison. CSS variable values are correct by inspection but not visually verified.
- Component interactivity — Dialog open/close, Button click handlers not tested (no runtime context).
- R001–R005 — not in scope for S01.

## Notes for Tester

- Typecheck must run **after** build. The `tsconfig.json` includes `.next/types/**/*.ts` which Next.js generates during build. Running typecheck on a clean `.next/` directory fails with TS6053 errors — this is expected project behavior, not a bug.
- The "Connect Wallet" button in the sidebar is a non-functional placeholder. S02 will replace it with real wallet adapter integration.
