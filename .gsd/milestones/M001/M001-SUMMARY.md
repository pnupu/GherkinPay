# M001: Foundation — Summary

**Last updated:** 2026-03-20
**Slices complete:** 4 of 6

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

## S02–S03: Complete (see milestone branch worktree)

S02 wired wallet adapter + Anchor clients; S03 rewrote Agreements page with live PaymentAgreement reads.

---

## S04: Milestones — Live Reads ✅

**useMilestones() hook and milestones page rewritten with live conditionAccount data, four UI states, shadcn components, zero hardcoded mock arrays.**

Key outputs:
- `app/web/src/lib/queries/milestones.ts` — `useMilestones()` React Query hook (client-side join to agreements)
- `app/web/src/app/(console)/milestones/page.tsx` — four-state live page (disconnected/loading/empty/populated)

Key patterns:
- `account.operator` (not `account.conditionOperator`) — IDL field naming drops prefix in struct context
- Enum key lowercasing: `Object.keys(account.someEnum)[0]!.toLowerCase()` for config map lookup
- Four-state page pattern consistent across agreements + milestones

---

## S05–S06: Pending
