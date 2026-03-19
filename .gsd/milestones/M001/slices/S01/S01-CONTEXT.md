---
id: S01
milestone: M001
status: ready
---

# S01: shadcn Setup and Design System — Context

## Goal

Install shadcn/ui (canary, Tailwind v4 path), consolidate CSS tokens into a single unified set using shadcn naming, and verify the dark green GherkinPay theme renders correctly alongside shadcn components.

## Why this Slice

S01 is the prerequisite for everything else. S02 needs a shadcn Button for the wallet connect UI. S03–S06 all consume Table, Badge, and Dialog. Until shadcn is installed and proven to coexist with the existing CSS, no downstream slice can start.

## Scope

### In Scope

- `shadcn@canary` init in `app/web` (Tailwind v4 path, no tailwind.config.ts)
- Add four components to prove coexistence: Button, Table, Badge, Dialog
- **CSS token consolidation**: rename the existing GherkinPay tokens (`--bg`, `--green`, `--surface`, `--surface-hover`, `--border`, `--text`, `--text-muted`, `--green-strong`, `--sidebar`) to shadcn's naming conventions (`--background`, `--primary`, `--muted`, etc.) and update every reference in `globals.css`
- Map GherkinPay dark green palette values into shadcn's token set (e.g. `--background: #080b09`, `--primary: #23c55e`)
- Verify `bun run build` passes clean after install
- Visual smoke test: dev server renders existing pages without layout breaks; at least one shadcn Button/Badge/Table/Dialog appears on screen with dark green colour applied

### Out of Scope

- Replacing existing hand-rolled CSS classes (`.btn`, `.panel`, `.table`, `.nav-link`) with shadcn components — existing pages keep their classes until they are rewritten in S03–S06 with live data
- Installing components beyond the proof set (Button, Table, Badge, Dialog) — downstream slices add what they need
- Skeleton, Sonner/Toast, Form, Input, Select — these are S02+ concerns
- Wallet connect UI (S02)
- Any on-chain reads (S03–S06)

## Constraints

- Tailwind v4: shadcn must use the canary path; no `tailwind.config.ts` (D001)
- Existing CSS classes (`.btn`, `.panel`, `.table`, etc.) must continue working after the token rename — they reference the old variable names and must be updated in the same pass
- Token rename must be thorough: search `globals.css` for every `var(--bg)`, `var(--green)`, `var(--surface)`, `var(--border)`, `var(--text)`, `var(--text-muted)`, `var(--sidebar)` and update to the new shadcn-aligned names
- Path alias is `~/` (maps to `./src/`) — `lib/utils.ts` must live at `app/web/src/lib/utils.ts`
- Package manager is `bun`

## Integration Points

### Consumes

- `app/web/src/styles/globals.css` — existing token definitions and CSS classes; this file is the source of truth for the consolidated token set
- `app/web/src/app/(console)/layout.tsx` — existing shell; must render without visual regression after token rename
- `app/web/package.json` — existing Tailwind v4 + Next.js 15 setup

### Produces

- `app/web/src/components/ui/` — shadcn component library (Button, Table, Badge, Dialog; more added by downstream slices as needed)
- `app/web/src/lib/utils.ts` — `cn()` utility, importable as `~/lib/utils`
- `app/web/src/styles/globals.css` — consolidated single token namespace (shadcn names, GherkinPay dark green values)
- `app/web/components.json` — shadcn config file

## Open Questions

- Exact shadcn token mapping: some shadcn tokens have no direct GherkinPay analogue (e.g. `--card`, `--accent`, `--destructive`, `--popover`). These should be set to sensible defaults that match the dark green palette during the merge — current thinking is `--card: var(--surface)`, `--accent: var(--surface-hover)`, `--destructive: #e53e3e`.
- The `--sidebar` token is used in the console layout. shadcn does not have a `--sidebar` token. Current thinking: keep it as a non-shadcn custom token alongside the shadcn set, or map it to a shadcn sidebar token if one exists in the canary release.
