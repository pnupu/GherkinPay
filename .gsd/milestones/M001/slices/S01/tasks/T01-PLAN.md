---
estimated_steps: 8
estimated_files: 5
---

# T01: Initialize shadcn config, install dependencies, and merge CSS namespaces

**Slice:** S01 — shadcn Setup and Design System
**Milestone:** M001

## Description

Establishes the shadcn foundation inside the existing GherkinPay Next.js 15 frontend. The main risk here is the CSS variable namespace collision: the existing design system uses `--border` (16 references) and `--sidebar` (2 references) as custom property names, which collide with shadcn's token names. This task creates the config manually (avoiding interactive prompts), installs dependencies, sets up the `cn()` utility, and carefully merges the shadcn CSS variable block into the existing `globals.css` after renaming the colliding properties.

**Relevant skills:** `lint` (for formatting verification after CSS edits)

## Steps

1. **Copy `app/web` into the worktree.** The `app/web` directory exists in the main repo at `/Users/ilkka/GherkinPay/app/web` but is untracked and not present in the worktree. Copy it:
   ```bash
   cp -R /Users/ilkka/GherkinPay/app/web app/web
   ```

2. **Install existing dependencies.** Run in the `app/web` directory:
   ```bash
   cd app/web && bun install
   ```
   Verify the dev server could theoretically start (don't actually start it — just confirm deps install cleanly).

3. **Install shadcn dependencies.** Add the packages shadcn components need:
   ```bash
   cd app/web && bun add class-variance-authority clsx tailwind-merge lucide-react tw-animate-css
   ```

4. **Create `components.json`.** Write this file at `app/web/components.json` — do NOT run `shadcn init` (it's interactive and may overwrite `globals.css`):
   ```json
   {
     "$schema": "https://ui.shadcn.com/schema.json",
     "style": "new-york",
     "rsc": true,
     "tsx": true,
     "tailwind": {
       "config": "",
       "css": "src/styles/globals.css",
       "baseColor": "neutral",
       "cssVariables": true,
       "prefix": ""
     },
     "aliases": {
       "components": "~/components",
       "utils": "~/lib/utils",
       "ui": "~/components/ui",
       "lib": "~/lib",
       "hooks": "~/hooks"
     }
   }
   ```
   **Critical:** All aliases use `~/` prefix to match the `tsconfig.json` paths config (`"~/*": ["./src/*"]`). Using `@/` would break every component import.

5. **Create `src/lib/utils.ts`.** Write the `cn()` utility at `app/web/src/lib/utils.ts`:
   ```typescript
   import { type ClassValue, clsx } from "clsx";
   import { twMerge } from "tailwind-merge";

   export function cn(...inputs: ClassValue[]) {
     return twMerge(clsx(inputs));
   }
   ```

6. **Rename `--border` → `--gp-border` in `globals.css`.** This is the most critical step. In `app/web/src/styles/globals.css`:
   - In the `:root` block, rename the property definition: `--border: #2a3b30;` → `--gp-border: #2a3b30;`
   - Find-replace ALL `var(--border)` to `var(--gp-border)` throughout the file. There are ~16 occurrences in CSS rules (`.sidebar`, `.nav-link`, `.panel`, `.table`, `.landing-*`, etc.)
   - **Do NOT rename** any shadcn-related `--border` references (those will be added in the next step)

7. **Rename `--sidebar` → `--gp-sidebar` in `globals.css`.** Same approach:
   - In `:root`: `--sidebar: #0d130f;` → `--gp-sidebar: #0d130f;`
   - Replace `var(--sidebar)` → `var(--gp-sidebar)` in existing CSS rules (~2 occurrences)

8. **Add shadcn CSS imports and theme variables to `globals.css`.** Insert after the existing `@import "tailwindcss";` line:
   ```css
   @import "tw-animate-css";
   ```
   
   Then add the shadcn `@theme inline` block and custom property definitions. Add a `:root` section for shadcn tokens (below the existing `:root` block, or merged into it) with the GherkinPay dark green palette mapped to oklch values:

   | shadcn token | Value | Mapped from |
   |---|---|---|
   | `--background` | oklch(0.07 0.01 155) | `--bg` (#080b09) |
   | `--foreground` | oklch(0.96 0.01 155) | `--text` (#edf4ee) |
   | `--card` / `--card-foreground` | oklch(0.13 0.02 155) / oklch(0.96 0.01 155) | `--surface` |
   | `--popover` / `--popover-foreground` | oklch(0.13 0.02 155) / oklch(0.96 0.01 155) | `--surface` |
   | `--primary` / `--primary-foreground` | oklch(0.72 0.19 155) / oklch(0.16 0.03 155) | `--green` |
   | `--secondary` / `--secondary-foreground` | oklch(0.19 0.02 155) / oklch(0.96 0.01 155) | `--surface-hover` |
   | `--muted` / `--muted-foreground` | oklch(0.13 0.02 155) / oklch(0.72 0.03 155) | `--text-muted` |
   | `--accent` / `--accent-foreground` | oklch(0.19 0.02 155) / oklch(0.96 0.01 155) | hover |
   | `--destructive` | oklch(0.55 0.2 25) | standard red |
   | `--border` | oklch(0.28 0.03 155) | #2a3b30 (same value as old `--border`) |
   | `--input` | oklch(0.28 0.03 155) | same |
   | `--ring` | oklch(0.72 0.19 155) | green focus rings |
   | `--radius` | 0.5rem | default |

   Also add the `@theme inline` block that registers these as Tailwind utilities:
   ```css
   @theme inline {
     --color-background: var(--background);
     --color-foreground: var(--foreground);
     --color-card: var(--card);
     --color-card-foreground: var(--card-foreground);
     --color-popover: var(--popover);
     --color-popover-foreground: var(--popover-foreground);
     --color-primary: var(--primary);
     --color-primary-foreground: var(--primary-foreground);
     --color-secondary: var(--secondary);
     --color-secondary-foreground: var(--secondary-foreground);
     --color-muted: var(--muted);
     --color-muted-foreground: var(--muted-foreground);
     --color-accent: var(--accent);
     --color-accent-foreground: var(--accent-foreground);
     --color-destructive: var(--destructive);
     --color-border: var(--border);
     --color-input: var(--input);
     --color-ring: var(--ring);
     --radius: var(--radius);
   }
   ```

## Must-Haves

- [ ] `app/web` directory present in worktree with all existing source files
- [ ] `components.json` uses `~/` path aliases (not `@/`)
- [ ] `src/lib/utils.ts` exports `cn()` function
- [ ] Zero remaining `var(--border)` references in existing (non-shadcn) CSS rules — all renamed to `var(--gp-border)`
- [ ] Zero remaining `var(--sidebar)` references in existing CSS rules — all renamed to `var(--gp-sidebar)`
- [ ] shadcn CSS variable block present with GherkinPay dark green oklch values
- [ ] `tw-animate-css` imported in `globals.css`

## Verification

- `cd app/web && bun install` exits cleanly
- `grep -c "gp-border" app/web/src/styles/globals.css` returns ≥16
- `grep "var(--border)" app/web/src/styles/globals.css` returns ONLY lines in the shadcn `:root` definitions (not in CSS rules like `.panel`, `.table`, etc.)
- `grep -c "gp-sidebar" app/web/src/styles/globals.css` returns ≥2
- `cat app/web/components.json | grep "~/components/ui"` confirms correct alias
- `cat app/web/src/lib/utils.ts` shows `cn` export

## Observability Impact

- **Signals changed:** `globals.css` gains shadcn CSS custom properties in `:root` — inspectable via browser DevTools computed styles on any element.
- **Inspection surface:** `grep -c "gp-border" app/web/src/styles/globals.css` validates rename completeness (expect ≥16). `grep "var(--border)" app/web/src/styles/globals.css` shows only shadcn definitions if clean.
- **Failure visibility:** A missed `--border` rename causes existing UI elements to pick up shadcn's `--border` value instead of the GherkinPay `--gp-border` value — visually detectable as wrong border colors. `bun install` failure is immediately visible as non-zero exit.
- **No runtime services:** This task only modifies static config and CSS — no servers, logs, or runtime diagnostics needed.

## Inputs

- `/Users/ilkka/GherkinPay/app/web` — existing untracked frontend source to copy into worktree
- Research findings on exact collision points: `--border` (16 refs), `--sidebar` (2 refs)

## Expected Output

- `app/web/components.json` — shadcn config with `~/` aliases, new-york style, Tailwind v4 CSS path
- `app/web/src/lib/utils.ts` — `cn()` utility
- `app/web/src/styles/globals.css` — modified: renames applied, shadcn CSS variables and imports added
- `app/web/package.json` — modified: new deps (class-variance-authority, clsx, tailwind-merge, lucide-react, tw-animate-css)
- `app/web/bun.lock` — updated lockfile
