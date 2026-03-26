# M007: Institutional Custody Framing — Research

**Date:** 2026-03-25
**Status:** Complete

## Summary

M007 is a low-risk, UI-only milestone that adds institutional custody framing to GherkinPay. The work is straightforward: a reusable "MPC Compatible" badge component with tooltip, applied to wallet addresses on the agreement detail page, a Custody Integration section in the README, and a deploy to EC2. No smart contract changes, no new dependencies, no architectural unknowns.

The codebase is well-structured for this work. The agreement detail page (`app/web/src/app/(console)/agreements/[id]/page.tsx`) already renders payer, payee, and authority addresses in a clean `<dl>` grid using `truncatePubkey()`. The existing `Badge` component (`app/web/src/components/ui/badge.tsx`) uses the standard shadcn/cva pattern. Radix UI's Tooltip primitives are already available via the installed `radix-ui@1.4.3` package — no new npm dependency is needed. The only missing piece is a `Tooltip` UI wrapper component, which follows the standard shadcn pattern of wrapping Radix primitives with project styling.

The deploy procedure is established from M006: rsync to EC2, remote npm install + build, systemctl restart. This is a repeatable process that has been proven twice (M005, M006). The README currently has sections through "License" — the Custody Integration section fits naturally between "Compliance Stack" (architecture subsection) and "Tech Stack".

## Recommendation

**Two slices, sequential:**

1. **S01: MPC Badge Component + Agreement Detail Integration** — Build the Tooltip UI component, create the MPC badge component, integrate into agreement detail page. This is the core deliverable that judges see.
2. **S02: README Custody Section + Deploy** — Add the Custody Integration documentation to README, deploy everything to EC2. This depends on S01 being merged so the deploy includes the UI changes.

S01 should be proven first because the badge rendering on real devnet data is the primary success criterion. S02 is documentation and deploy — low risk, mechanical work.

**Do NOT over-engineer this.** The badge is informational — there's no on-chain way to distinguish MPC wallets from regular wallets. Every Solana address is MPC-compatible by design. The badge appears on ALL wallet addresses to communicate this architectural compatibility.

## Implementation Landscape

### Key Files

- `app/web/src/components/ui/badge.tsx` — Existing shadcn Badge component. Already used throughout the app. The MPC badge extends this pattern, no changes needed to this file.
- `app/web/src/components/ui/tooltip.tsx` — **New file.** Shadcn Tooltip wrapper around Radix `Tooltip` primitives from `radix-ui`. Follows the same pattern as `dialog.tsx` and `select.tsx` which import from `"radix-ui"`.
- `app/web/src/components/mpc-badge.tsx` — **New file.** Composable component: `<MpcBadge />` renders a small "MPC Compatible" badge with a tooltip explaining Fireblocks/Fordefi/MPC custody compatibility. Uses `Badge` + `Tooltip` components.
- `app/web/src/app/(console)/agreements/[id]/page.tsx` — Agreement detail page. Currently renders `truncatePubkey(payment.payer)`, `truncatePubkey(payment.payee)`, `truncatePubkey(payment.authority)` as plain text in `<dd>` elements. Each of these needs an `<MpcBadge />` placed next to the address.
- `README.md` — Needs a new "Custody Integration" section. Best placed after the Compliance Stack subsection (around line 78) or as a new top-level section between "Tech Stack" and "Console Pages".
- `app/web/src/app/page.tsx` — Landing page. May optionally get a feature card for custody compatibility. Currently has 7 feature cards. **Optional** — the milestone context says badges and README; landing page is bonus.

### Patterns to Reuse

1. **Radix import pattern**: Import as `import { Tooltip as TooltipPrimitive } from "radix-ui"` — matches existing `Dialog`, `Select`, `Slot` imports.
2. **shadcn component wrapper pattern**: The `dialog.tsx` and `select.tsx` components show the exact wrapping pattern — export named subcomponents (`TooltipProvider`, `TooltipTrigger`, `TooltipContent`) with `cn()` classname merging.
3. **Badge variant pattern**: The existing `badgeVariants` in `badge.tsx` uses `cva()` with `variant` options. The MPC badge can use the `outline` or a custom variant.
4. **Address rendering pattern**: The detail page uses `<dt>/<dd>` pairs in a CSS grid. The MPC badge sits inside the `<dd>` alongside the truncated address.
5. **lucide-react icons**: Already used for `XIcon`, `PlusIcon`, `TrashIcon`. A shield or lock icon (`ShieldCheckIcon`) would be appropriate for the MPC badge.

### Build Order

1. **Tooltip UI component** (`tooltip.tsx`) — Unblocks the MPC badge. Standard shadcn pattern, no risk.
2. **MPC Badge component** (`mpc-badge.tsx`) — Self-contained, can be tested in isolation. Depends on Tooltip.
3. **Agreement detail page integration** — Wire `<MpcBadge />` next to the three wallet addresses. Depends on MPC Badge.
4. **README Custody Integration section** — Independent of UI work, but logically belongs in S02 after UI is proven.
5. **EC2 deploy** — Final step, depends on everything else being committed and built.

### Verification Approach

**S01 (UI):**
- `cd app/web && bun run build` exits 0 — build passes with new components
- Visual verification: navigate to `/agreements/<id>` on localhost, confirm MPC badges appear next to all three wallet addresses (payer, payee, authority)
- Tooltip hover: hovering the badge shows the custody compatibility explanation

**S02 (README + Deploy):**
- `grep -c "Custody Integration\|MPC" README.md` returns expected count
- `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` returns 200
- Browser verification at live URL: agreement detail shows MPC badges

## Constraints

- **No Tooltip component exists yet** — must be created as `app/web/src/components/ui/tooltip.tsx`. The Radix primitives are available from `radix-ui@1.4.3` but the shadcn wrapper must be written.
- **`radix-ui` package uses the unified import** — import as `import { Tooltip as TooltipPrimitive } from "radix-ui"`, NOT from `@radix-ui/react-tooltip`.
- **Path alias is `~/`** not `@/` — per KNOWLEDGE.md, all component imports use `~/components/...`.
- **Tailwind v4 CSS-based config** — no `tailwind.config.js`. Styling is via CSS variables in `globals.css` and utility classes.
- **Worktree needs `bun install`** — per KNOWLEDGE.md, git worktrees don't share `node_modules`.
- **EC2 deploy is rsync-based** — `rsync` to `ubuntu@3.8.170.147`, remote `npm install --legacy-peer-deps && npm run build`, then `sudo systemctl restart gherkinpay-web`. SSH key at `~/.ssh/gherkinpay-eic`.
- **Build must produce 10+ routes** — M006 had 10 routes; M007 adds no new pages, so the count stays the same.
- **jito-ts webpack alias must remain** — in `next.config.js`, `"jito-ts": false` cannot be removed.

## Common Pitfalls

- **TooltipProvider must wrap the app** — Radix Tooltip requires a `<TooltipProvider>` ancestor. This needs to be added to the root layout or the console layout. Without it, tooltips silently fail to render. The typical shadcn pattern adds it in the root layout wrapping `{children}`.
- **Badge overflow on narrow screens** — The `<dd>` cells in the agreement detail grid use `font-mono text-xs`. Adding a badge next to the address may overflow on mobile. Use `flex items-center gap-1` on the `<dd>` and ensure the badge doesn't wrap.
- **Tooltip z-index in dark theme** — The tooltip content needs proper z-index and dark-themed styling. Use the project's `--popover` / `--popover-foreground` CSS variables for consistency with the existing dark green palette.

## Open Risks

- **No significant risks.** This is UI labels and documentation. The only execution risk is ensuring the tooltip renders correctly in the dark theme, which is verified with a build + visual check.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| shadcn/ui | shadcn/ui@shadcn (41.6K installs) | available — not needed for this scope (no complex shadcn patterns) |

## Sources

- Codebase exploration of `agreements/[id]/page.tsx`, `badge.tsx`, `conditions.ts`, `page.tsx` (landing)
- M006 summary and validation for deploy procedure
- Radix UI runtime inspection confirming Tooltip export from `radix-ui@1.4.3`
