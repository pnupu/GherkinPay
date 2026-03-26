# S01: MPC Badge + Agreement Detail Integration

**Goal:** Wallet addresses on the agreement detail page display an "MPC Compatible" badge with a tooltip explaining Fireblocks/Fordefi custody provider compatibility.
**Demo:** Navigate to `/agreements/<id>` on localhost — payer, payee, and authority addresses each show an "MPC Compatible" badge. Hovering the badge reveals a tooltip explaining Fireblocks/Fordefi/MPC custody compatibility.

## Must-Haves

- Reusable `tooltip.tsx` shadcn wrapper using Radix Tooltip primitives from the `radix-ui` package
- `<TooltipProvider>` wraps the app in the root layout (`app/web/src/app/layout.tsx`)
- Reusable `mpc-badge.tsx` component: small "MPC Compatible" badge with ShieldCheck icon and custody tooltip
- MPC badges render next to payer, payee, and authority addresses in the agreement detail page
- `bun run build` exits 0

## Verification

- `cd app/web && bun run build` exits 0 with no type errors
- `test -f app/web/src/components/ui/tooltip.tsx` — tooltip component exists
- `test -f app/web/src/components/mpc-badge.tsx` — MPC badge component exists
- `grep -q "TooltipProvider" app/web/src/app/layout.tsx` — TooltipProvider wired into root layout
- `grep -q "MpcBadge" app/web/src/app/\(console\)/agreements/\[id\]/page.tsx` — badge integrated into detail page
- `grep -c "MpcBadge" app/web/src/app/\(console\)/agreements/\[id\]/page.tsx` returns >= 3 (payer, payee, authority)
- Failure-path check: if `TooltipProvider` is missing from the root layout, Radix Tooltip throws a runtime error "TooltipProvider must be used within a TooltipProvider". The `bun run build` step catches import/type errors; runtime tooltip errors surface as React error boundaries in the browser console.

## Observability / Diagnostics

- Runtime signals: React error boundary catches if TooltipProvider is missing — Radix throws "TooltipProvider must be used within a TooltipProvider" at runtime
- Inspection surfaces: Browser DevTools → Elements panel shows `data-slot="badge"` on MPC badges; tooltip content visible as Radix portal in DOM on hover
- Failure visibility: Build failure exits non-zero with TypeScript error messages; missing provider causes console error on first tooltip hover
- Redaction constraints: none

## Integration Closure

- Upstream surfaces consumed: `app/web/src/app/(console)/agreements/[id]/page.tsx` (existing detail page), `app/web/src/app/layout.tsx` (root layout), `radix-ui` package (Tooltip primitives), `lucide-react` (ShieldCheck icon)
- New wiring introduced in this slice: `<TooltipProvider>` in root layout, `<MpcBadge />` in agreement detail `<dd>` elements
- What remains before the milestone is truly usable end-to-end: S02 (README custody section + EC2 deploy)

## Tasks

- [x] **T01: Create tooltip and MPC badge components, wire TooltipProvider** `est:25m`
  - Why: Provides the reusable tooltip wrapper and MPC badge component that the detail page integration depends on. Wires TooltipProvider into the root layout so tooltips work everywhere.
  - Files: `app/web/src/components/ui/tooltip.tsx`, `app/web/src/components/mpc-badge.tsx`, `app/web/src/app/layout.tsx`
  - Do: Create tooltip.tsx following shadcn patterns (import `Tooltip` from `"radix-ui"`, export Tooltip, TooltipTrigger, TooltipContent, TooltipProvider). Create mpc-badge.tsx with ShieldCheck icon from lucide-react and a tooltip explaining MPC custody compatibility. Add `<TooltipProvider>` wrapping `{children}` in root layout. Use `~/` path alias per KNOWLEDGE.md.
  - Verify: `test -f app/web/src/components/ui/tooltip.tsx && test -f app/web/src/components/mpc-badge.tsx && grep -q "TooltipProvider" app/web/src/app/layout.tsx`
  - Done when: Both component files exist, TooltipProvider is in root layout, no import errors

- [x] **T02: Integrate MpcBadge into agreement detail page and verify build** `est:20m`
  - Why: Closes the slice by rendering MPC badges next to the three wallet addresses (payer, payee, authority) and proving the build is clean.
  - Files: `app/web/src/app/(console)/agreements/[id]/page.tsx`
  - Do: Import `MpcBadge` from `~/components/mpc-badge`. Add `<MpcBadge />` next to payer, payee, and authority `<dd>` elements. Wrap each `<dd>` content in a flex container for proper badge alignment. Run `bun run build` to verify clean compilation.
  - Verify: `cd app/web && bun run build` exits 0; `grep -c "MpcBadge" src/app/\(console\)/agreements/\[id\]/page.tsx` returns >= 3
  - Done when: Build passes clean, three MPC badges appear in the agreement detail page markup

## Files Likely Touched

- `app/web/src/components/ui/tooltip.tsx`
- `app/web/src/components/mpc-badge.tsx`
- `app/web/src/app/layout.tsx`
- `app/web/src/app/(console)/agreements/[id]/page.tsx`
