# S01: shadcn Setup and Design System — Research

**Date:** 2026-03-19
**Depth:** Targeted — known technology (shadcn + Tailwind v4), moderately complex integration due to CSS variable namespace collision.

## Summary

The frontend at `app/web` is a Next.js 15 App Router project using Tailwind v4.2.1 via `@tailwindcss/postcss` (no `tailwind.config.ts`). All existing styles live in `globals.css` as plain CSS custom properties (`--bg`, `--surface`, `--border`, etc.) and class-based rules (`.btn`, `.panel`, `.table`). There is no `src/lib/` directory, no `components.json`, and no existing shadcn setup.

The main risk is a **CSS variable namespace collision**: the existing design system uses `--border` and `--sidebar` which are also shadcn token names. Additionally, shadcn defaults to the `@/` path alias while this project uses `~/`. Both are easily resolved during `shadcn init` configuration.

shadcn v4.0.8 now supports Tailwind v4 natively (no longer requires canary). The `init` command will create `components.json`, install `tw-animate-css`, `class-variance-authority`, `clsx`, `tailwind-merge`, and `lucide-react`, add the `cn()` utility, and inject the shadcn CSS variable block into `globals.css`.

## Recommendation

Run `npx shadcn@latest init` in the `app/web` directory with these config choices:
- Style: `new-york`
- Base color: `neutral` (closest to the dark green palette — we remap immediately)
- CSS variables: `true`
- Path alias: `~/` (matching existing `tsconfig.json`)
- CSS path: `src/styles/globals.css`
- Components path: `src/components/ui`
- Utils path: `src/lib/utils`

After init, **manually merge** the generated shadcn CSS variables into the existing `globals.css` rather than letting init overwrite it. The existing `--border` and `--sidebar` custom properties must be **renamed** to `--gp-border` and `--gp-sidebar` (with find-replace across all existing CSS class rules) to avoid collision with shadcn's `--border` and `--sidebar` token families. Then map shadcn's oklch tokens to GherkinPay's dark green palette.

Then add components: `button`, `table`, `badge`, `dialog` (minimum set to prove the integration + satisfy downstream slice needs).

## Implementation Landscape

### Key Files

- `app/web/src/styles/globals.css` — **The merge point.** Currently ~370 lines of custom CSS with custom properties and component classes. shadcn init will try to inject its `@import` directives and `:root`/`.dark` variable blocks here. Must be manually merged: keep all existing rules, add shadcn imports at top, rename `--border` → `--gp-border` and `--sidebar` → `--gp-sidebar` in existing rules, add shadcn variable block with GherkinPay dark green values in oklch.
- `app/web/package.json` — Gets new deps: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css`. Uses bun as package manager.
- `app/web/tsconfig.json` — Already has `"~/*": ["./src/*"]` path alias. shadcn `components.json` must use `~/` prefix.
- `app/web/components.json` — **New file.** Created by `shadcn init`. Must set `aliases.components` to `~/components/ui`, `aliases.utils` to `~/lib/utils`, etc.
- `app/web/src/lib/utils.ts` — **New file.** The `cn()` utility (clsx + tailwind-merge). Created by init.
- `app/web/src/components/ui/button.tsx` — **New file.** First shadcn component. Proves the integration works.
- `app/web/src/components/ui/table.tsx` — **New file.** Needed by S03/S04 for agreement/milestone tables.
- `app/web/src/components/ui/badge.tsx` — **New file.** Needed by S03 for status badges.
- `app/web/src/components/ui/dialog.tsx` — **New file.** Needed by S02 for wallet modal and S03+ for detail views.
- `app/web/src/app/(console)/layout.tsx` — Server component. Import a shadcn `<Button>` to prove rendering works in the app shell.
- `app/web/src/app/_components/dashboard-nav.tsx` — Client component. No changes needed in S01.
- `app/web/postcss.config.js` — Already configured with `@tailwindcss/postcss`. No changes needed.
- `app/web/next.config.js` — No changes needed.

### CSS Variable Collision — Exact Renames

The following existing CSS custom properties collide with shadcn token names:

| Existing property | Collides with | Rename to |
|---|---|---|
| `--border` | shadcn `--border` (used in `@theme inline` as `--color-border`) | `--gp-border` |
| `--sidebar` | shadcn `--sidebar` (sidebar component color family) | `--gp-sidebar` |

All references in `globals.css` class rules (`.sidebar`, `.nav-link`, `.panel`, `.table`, `.landing-*`, etc.) must be updated to use the renamed properties.

### shadcn Dark Green Theme Mapping

Map shadcn oklch tokens to GherkinPay's dark palette. The app is dark-only (no light/dark toggle), so only the `:root` block is needed. Approximate mapping:

| shadcn token | GherkinPay value | Notes |
|---|---|---|
| `--background` | `#080b09` (oklch ~0.07 0.01 155) | `--bg` |
| `--foreground` | `#edf4ee` (oklch ~0.96 0.01 155) | `--text` |
| `--card` / `--popover` | `#131b16` (oklch ~0.13 0.02 155) | `--surface` |
| `--primary` | `#23c55e` (oklch ~0.72 0.19 155) | `--green` |
| `--primary-foreground` | `#041108` | dark text on green buttons |
| `--secondary` | `#1b281f` (oklch ~0.19 0.02 155) | `--surface-hover` |
| `--muted` | `#131b16` | same as surface |
| `--muted-foreground` | `#98af9e` (oklch ~0.72 0.03 155) | `--text-muted` |
| `--accent` | `#1b281f` | surface-hover |
| `--border` | `#2a3b30` (oklch ~0.28 0.03 155) | existing `--gp-border` value |
| `--input` | `#2a3b30` | same as border |
| `--ring` | `#23c55e` | green for focus rings |
| `--destructive` | standard red | keep default |

### Build Order

1. **Task 1: Run `shadcn init` and fix config** — Run the init command, then fix `components.json` aliases to use `~/`. This produces `components.json`, `src/lib/utils.ts`, and installs deps.
2. **Task 2: Merge CSS and resolve collisions** — Rename `--border` → `--gp-border` and `--sidebar` → `--gp-sidebar` in all existing CSS rules. Merge shadcn's CSS imports and `@theme inline` block into `globals.css`. Set all shadcn oklch color values to the GherkinPay dark green palette. This is the riskiest step — a missed rename breaks styling.
3. **Task 3: Add components (Button, Table, Badge, Dialog)** — Run `npx shadcn@latest add button table badge dialog`. Verify each resolves its imports correctly with `~/` paths.
4. **Task 4: Smoke-test integration** — Import `<Button>` into the console layout or agreements page. Run `bun run build` to confirm zero errors. Visually verify the dev server shows the button styled correctly alongside existing UI.

### Verification Approach

1. `cd app/web && bun run build` — must pass with zero errors
2. `bun run dev` — app starts, existing dark green UI is visually intact
3. A shadcn `<Button>` renders correctly inside the console layout (green primary variant matching the existing `.btn-primary` style)
4. `<Table>`, `<Badge>`, `<Dialog>` components import without errors
5. No CSS variable conflicts: existing `.panel`, `.table`, `.nav-link` rules still render correctly with `--gp-border`

## Constraints

- **Bun is the package manager** — all install commands must use `bun` or be invoked through `npx` (which will defer to bun). shadcn CLI detects this from `packageManager` in `package.json`.
- **Path alias is `~/` not `@/`** — shadcn defaults to `@/`; `components.json` must be configured for `~/`.
- **No `tailwind.config.ts`** — Tailwind v4 uses CSS-native config. shadcn v4 supports this natively; the `tailwind.config` field in `components.json` should be empty string.
- **App Router with server components** — Console layout is a server component. shadcn components that use client-only features (Dialog) need `"use client"` — shadcn handles this automatically.
- **Dark-only theme** — The app has no light mode toggle. shadcn's `.dark` class toggle pattern is unnecessary; we only define `:root` values.

## Common Pitfalls

- **`--border` collision breaks all borders** — If the rename from `--border` to `--gp-border` misses any reference in `globals.css`, existing panels/tables/nav will lose their border styling. Must do a thorough find-replace across the entire file.
- **shadcn init overwrites `globals.css`** — The init command may try to replace the CSS file contents. Either back it up first or run init in non-destructive mode and manually merge the output.
- **Wrong path alias in generated components** — If `components.json` uses `@/` instead of `~/`, every added component will have broken imports. Must verify `components.json` aliases before adding components.

## Open Risks

- **shadcn init interactive prompts** — The CLI is interactive; in a CI/agent context, it may need `--defaults` flag or manual `components.json` creation to avoid hanging on prompts. Fallback: create `components.json` manually and run `shadcn add` directly.
