---
id: T01
parent: S01
milestone: M007
provides:
  - tooltip.tsx shadcn wrapper component
  - mpc-badge.tsx MPC badge component with custody tooltip
  - TooltipProvider wired into root layout
key_files:
  - app/web/src/components/ui/tooltip.tsx
  - app/web/src/components/mpc-badge.tsx
  - app/web/src/app/layout.tsx
key_decisions:
  - Used function component pattern (not forwardRef) consistent with existing dialog.tsx and badge.tsx
  - Placed TooltipProvider inside TRPCReactProvider wrapping children directly
patterns_established:
  - Radix Tooltip primitives imported from monolithic "radix-ui" package as `{ Tooltip as TooltipPrimitive }`
  - Tooltip component uses "use client" directive like other Radix-based UI components
observability_surfaces:
  - Radix Tooltip injects portal DOM nodes on hover visible as [data-radix-popper-content-wrapper] in DevTools
  - Missing TooltipProvider causes runtime error "TooltipProvider must be used within a TooltipProvider"
duration: 4m
verification_result: passed
completed_at: 2026-03-25
blocker_discovered: false
---

# T01: Create tooltip and MPC badge components, wire TooltipProvider

**Created shadcn tooltip wrapper, MPC badge component with Fireblocks/Fordefi custody tooltip, and wired TooltipProvider into root layout**

## What Happened

Created three deliverables following existing shadcn patterns in the codebase:

1. `tooltip.tsx` — A shadcn-style wrapper around Radix Tooltip primitives exported from the monolithic `radix-ui` package. Exports `TooltipProvider`, `Tooltip`, `TooltipTrigger`, and `TooltipContent`. The content component renders through a portal with dark-theme-compatible styling (`bg-primary text-primary-foreground`), slide/fade animations, and `data-slot` attributes matching the project convention.

2. `mpc-badge.tsx` — An `MpcBadge` component combining a `ShieldCheck` icon with an outline badge styled in emerald tones (`border-emerald-700/40 text-emerald-400`). Hovering reveals a tooltip explaining compatibility with MPC custody providers (Fireblocks, Fordefi, institutional wallets) and that standard Solana signers work without protocol changes.

3. `layout.tsx` — Added `<TooltipProvider>` wrapping `{children}` inside the existing `TRPCReactProvider`, so tooltips work app-wide without needing per-component providers.

## Verification

All task-level and applicable slice-level verification checks pass. The Next.js production build completes with zero type errors.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run build` | 0 | ✅ pass | 25.4s |
| 2 | `test -f app/web/src/components/ui/tooltip.tsx && test -f app/web/src/components/mpc-badge.tsx` | 0 | ✅ pass | <1s |
| 3 | `grep -q "TooltipProvider" app/web/src/app/layout.tsx` | 0 | ✅ pass | <1s |
| 4 | `grep -q "ShieldCheck" app/web/src/components/mpc-badge.tsx` | 0 | ✅ pass | <1s |
| 5 | `grep -q "Fireblocks" app/web/src/components/mpc-badge.tsx` | 0 | ✅ pass | <1s |

Slice checks 5–6 (MpcBadge in agreement detail page, count >= 3) are not yet passing — expected, as those belong to T02.

## Diagnostics

- `grep -q "TooltipProvider" app/web/src/app/layout.tsx` — confirms provider is wired
- Browser DevTools Elements panel: hover any `MpcBadge` → look for `[data-radix-popper-content-wrapper]` portal node
- Browser console: if TooltipProvider is missing, Radix throws "TooltipProvider must be used within a TooltipProvider"
- `data-slot="tooltip-content"` attribute on tooltip content elements for DevTools inspection

## Deviations

None. Implementation followed the task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `app/web/src/components/ui/tooltip.tsx` — New shadcn tooltip wrapper with TooltipProvider, Tooltip, TooltipTrigger, TooltipContent exports
- `app/web/src/components/mpc-badge.tsx` — New MPC badge component with ShieldCheck icon and Fireblocks/Fordefi custody tooltip
- `app/web/src/app/layout.tsx` — Added TooltipProvider import and wrapped children in the root layout
