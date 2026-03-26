---
estimated_steps: 5
estimated_files: 3
skills_used: []
---

# T01: Create tooltip and MPC badge components, wire TooltipProvider

**Slice:** S01 — MPC Badge + Agreement Detail Integration
**Milestone:** M007

## Description

Create the shadcn-style tooltip wrapper component using Radix Tooltip primitives from the `radix-ui` package, create the MPC badge component that combines a ShieldCheck icon with a tooltip explaining MPC custody compatibility, and wire `<TooltipProvider>` into the root layout so tooltips work app-wide.

The project uses `radix-ui` v1.4.3 (monolithic package) — import as `import { Tooltip } from "radix-ui"`, not from separate `@radix-ui/react-tooltip`. The path alias is `~/` (not `@/`) per the project's `components.json` and tsconfig. Follow the existing shadcn component patterns in `app/web/src/components/ui/` (see `badge.tsx`, `dialog.tsx` for reference).

## Steps

1. Create `app/web/src/components/ui/tooltip.tsx`:
   - Import `{ Tooltip as TooltipPrimitive }` from `"radix-ui"`
   - Export: `TooltipProvider` (re-export `TooltipPrimitive.Provider`), `Tooltip` (re-export `TooltipPrimitive.Root`), `TooltipTrigger` (re-export `TooltipPrimitive.Trigger`), `TooltipContent` (styled wrapper around `TooltipPrimitive.Content` with portal)
   - `TooltipContent` should include: `sideOffset={4}`, dark theme compatible styling (`bg-popover text-popover-foreground` or `bg-primary text-primary-foreground`), rounded corners, shadow, padding, `animate-in fade-in-0 zoom-in-95` animation classes
   - Use `cn()` from `~/lib/utils` for className merging
   - Forward ref on TooltipContent

2. Create `app/web/src/components/mpc-badge.tsx`:
   - Import `ShieldCheck` from `"lucide-react"`
   - Import `Tooltip`, `TooltipTrigger`, `TooltipContent` from `"~/components/ui/tooltip"`
   - Import `Badge` from `"~/components/ui/badge"`
   - Export an `MpcBadge` component that renders:
     ```
     <Tooltip>
       <TooltipTrigger asChild>
         <Badge variant="outline" className="...">
           <ShieldCheck className="size-3" />
           MPC Compatible
         </Badge>
       </TooltipTrigger>
       <TooltipContent>
         <p>Compatible with MPC custody providers like Fireblocks, Fordefi, and other institutional wallets. Standard Solana signers — no protocol changes needed.</p>
       </TooltipContent>
     </Tooltip>
     ```
   - Style the badge to be small, non-intrusive: use `text-[10px]` or `text-xs`, green/emerald tint or neutral outline, `gap-1`, `cursor-help`

3. Edit `app/web/src/app/layout.tsx`:
   - Import `{ TooltipProvider }` from `"~/components/ui/tooltip"`
   - Wrap the `{children}` tree inside `<TooltipProvider delayDuration={300}>...</TooltipProvider>` — place it inside `<WalletContextProvider>` and `<TRPCReactProvider>`, wrapping `{children}` directly
   - Ensure it's a client boundary-safe addition (TooltipProvider is client-only — the layout already has client child components so this is fine as a client import used inside the server layout via composition)

4. Verify files exist and imports resolve:
   - `test -f app/web/src/components/ui/tooltip.tsx`
   - `test -f app/web/src/components/mpc-badge.tsx`
   - `grep -q "TooltipProvider" app/web/src/app/layout.tsx`

5. Run a quick type check by attempting the build: `cd app/web && bun run build` — it should not fail on imports. If it does, fix any import path issues (remember: `~/` alias, not `@/`).

## Must-Haves

- [ ] `tooltip.tsx` exports TooltipProvider, Tooltip, TooltipTrigger, TooltipContent
- [ ] `mpc-badge.tsx` exports MpcBadge with ShieldCheck icon and custody tooltip text
- [ ] `layout.tsx` wraps children in TooltipProvider
- [ ] All imports use `~/` path alias
- [ ] Components follow existing shadcn patterns (cn(), forwardRef, data-slot attributes)

## Verification

- `test -f app/web/src/components/ui/tooltip.tsx && test -f app/web/src/components/mpc-badge.tsx`
- `grep -q "TooltipProvider" app/web/src/app/layout.tsx`
- `grep -q "ShieldCheck" app/web/src/components/mpc-badge.tsx`
- `grep -q "Fireblocks" app/web/src/components/mpc-badge.tsx`

## Observability Impact

- Signals added/changed: Radix Tooltip injects portal DOM nodes on hover — visible in DevTools Elements panel as `[data-radix-popper-content-wrapper]`
- How a future agent inspects this: `grep -q "TooltipProvider" app/web/src/app/layout.tsx` confirms provider is wired; browser DevTools shows tooltip portal on badge hover
- Failure state exposed: Missing TooltipProvider causes Radix runtime error "TooltipProvider must be used within a TooltipProvider" in browser console on first tooltip hover

## Inputs

- `app/web/src/components/ui/badge.tsx` — existing badge component to reference for style patterns and to import in mpc-badge
- `app/web/src/components/ui/dialog.tsx` — reference for how radix-ui primitives are imported in this project
- `app/web/src/app/layout.tsx` — root layout where TooltipProvider must be added
- `app/web/src/lib/utils.ts` — cn() utility used in component styling
- `app/web/package.json` — confirms radix-ui and lucide-react are available

## Expected Output

- `app/web/src/components/ui/tooltip.tsx` — new shadcn tooltip wrapper component
- `app/web/src/components/mpc-badge.tsx` — new MPC badge component with tooltip
- `app/web/src/app/layout.tsx` — modified to include TooltipProvider
