---
estimated_steps: 5
estimated_files: 6
---

# T02: Add shadcn components, wire smoke-test Button, and verify build

**Slice:** S01 — shadcn Setup and Design System
**Milestone:** M001

## Description

Adds the four core shadcn components needed by downstream slices (Button, Table, Badge, Dialog), renders a Button in the console layout as a smoke test, and runs the full Next.js build to prove zero errors. This is the slice's exit gate — if the build passes with a real shadcn component rendering in the app shell, the CSS merge and config from T01 are proven correct.

**Relevant skills:** `lint` (for verifying code formatting)

## Steps

1. **Add shadcn components via CLI.** Run in `app/web`:
   ```bash
   cd app/web && npx shadcn@latest add button table badge dialog
   ```
   This generates files in `src/components/ui/`. If the CLI prompts for anything, answer with defaults. If the CLI fails (e.g., can't detect the project config), manually copy component source from shadcn GitHub for the new-york style variant, adjusting imports to use `~/lib/utils`.

2. **Verify import paths in generated components.** Check each generated file:
   ```bash
   grep -r '@/lib/utils' app/web/src/components/ui/
   ```
   If any file uses `@/lib/utils` instead of `~/lib/utils`, fix them. The `components.json` should make the CLI use `~/` but this is a known pitfall. All imports must use the `~/` alias.

3. **Wire a smoke-test Button into the console layout.** Edit `app/web/src/app/(console)/layout.tsx`:
   - Add `import { Button } from "~/components/ui/button";`
   - The console layout is a **server component** (no `"use client"` directive). `Button` is a client component but can be rendered from a server component without issues — React handles this.
   - Add a small Button in the header area, e.g. next to the brand name or in the sidebar footer:
     ```tsx
     <Button variant="outline" size="sm">
       Connect Wallet
     </Button>
     ```
   - This button is a temporary placeholder — S02 will replace it with a real wallet connect button. Its purpose here is to prove shadcn components render correctly inside the existing app shell.

4. **Run the full build.** Execute:
   ```bash
   cd app/web && bun run build
   ```
   Must exit 0 with no errors. TypeScript and Next.js build both pass.

5. **Run typecheck separately.** Execute:
   ```bash
   cd app/web && bun run typecheck
   ```
   Must exit 0. This confirms all shadcn component types resolve correctly.

## Must-Haves

- [ ] `src/components/ui/button.tsx` exists with `~/lib/utils` import
- [ ] `src/components/ui/table.tsx` exists with `~/lib/utils` import
- [ ] `src/components/ui/badge.tsx` exists with `~/lib/utils` import
- [ ] `src/components/ui/dialog.tsx` exists with `~/lib/utils` import
- [ ] Button imported and rendered in `(console)/layout.tsx`
- [ ] `bun run build` exits 0
- [ ] `bun run typecheck` exits 0

## Verification

- `ls app/web/src/components/ui/{button,table,badge,dialog}.tsx` — all four files exist
- `grep -r '@/lib/utils' app/web/src/components/ui/` — returns nothing (all use `~/`)
- `grep "Button" app/web/src/app/\(console\)/layout.tsx` — shows import line
- `cd app/web && bun run build` — exits 0
- `cd app/web && bun run typecheck` — exits 0

## Inputs

- `app/web/components.json` — shadcn config from T01 (must exist with correct `~/` aliases)
- `app/web/src/lib/utils.ts` — `cn()` utility from T01
- `app/web/src/styles/globals.css` — merged CSS from T01 (shadcn theme variables present)
- `app/web/package.json` — with shadcn deps installed from T01

## Expected Output

- `app/web/src/components/ui/button.tsx` — shadcn Button component (new-york style)
- `app/web/src/components/ui/table.tsx` — shadcn Table component family
- `app/web/src/components/ui/badge.tsx` — shadcn Badge component
- `app/web/src/components/ui/dialog.tsx` — shadcn Dialog component
- `app/web/src/app/(console)/layout.tsx` — modified: imports and renders `Button` as smoke test
- `.next/` build output confirming clean build

## Observability Impact

- **Component inventory:** `ls app/web/src/components/ui/` — lists installed shadcn components. Missing files indicate failed `shadcn add`.
- **Import alias correctness:** `grep -r '@/lib/utils' app/web/src/components/ui/` — must return nothing. Any match means the CLI generated wrong imports.
- **Build status:** `cd app/web && bun run build` — non-zero exit means broken integration (CSS parse errors, missing imports, type mismatches).
- **Type resolution:** `cd app/web && bun run typecheck` — catches `~/` alias mismatches and missing type exports from shadcn components.
- **Smoke-test rendering:** `grep "Button" app/web/src/app/\(console\)/layout.tsx` — confirms the Button component is wired into the app shell. Absence means the smoke test wasn't added.
- **Failure shape:** If shadcn components import wrong aliases, Next.js build fails with "Module not found: Can't resolve '~/lib/utils'" or similar. If CSS variables are missing, components render with browser defaults (grey borders, white backgrounds).
