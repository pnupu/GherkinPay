# M001: Foundation — Summary

**Last updated:** 2026-03-19
**Slices complete:** 1 of 6

---

## S01: shadcn Setup and Design System ✅

**shadcn/ui canary installed and themed with GherkinPay dark green oklch palette; CSS namespace collision resolved via gp- prefix; Button/Table/Badge/Dialog wired; bun run build and typecheck pass clean.**

Key outputs:
- `app/web/components.json` — shadcn config, `~/` aliases, Tailwind v4 CSS path
- `app/web/src/lib/utils.ts` — `cn()` utility (importable as `~/lib/utils`)
- `app/web/src/styles/globals.css` — merged: `--gp-border`/`--gp-sidebar` renamed, shadcn oklch variables added, `@theme inline` block
- `app/web/src/components/ui/` — Button, Table, Badge, Dialog (shadcn new-york style)
- `app/web/src/app/(console)/layout.tsx` — smoke-test "Connect Wallet" Button in sidebar

Key patterns:
- GherkinPay custom properties get `gp-` prefix when colliding with shadcn tokens
- All shadcn imports use `~/` prefix (not `@/`), matching tsconfig paths
- Manual `components.json` creation (not interactive `shadcn init`) to avoid globals.css overwrite
- `bun run typecheck` must follow `bun run build` (`.next/types` needed)

---

## S02–S06: Pending
