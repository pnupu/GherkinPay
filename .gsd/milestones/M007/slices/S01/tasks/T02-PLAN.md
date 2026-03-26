---
estimated_steps: 4
estimated_files: 1
skills_used: []
---

# T02: Integrate MpcBadge into agreement detail page and verify build

**Slice:** S01 — MPC Badge + Agreement Detail Integration
**Milestone:** M007

## Description

Wire the `<MpcBadge />` component into the agreement detail page next to the three wallet addresses: payer, payee, and authority. Adjust the `<dd>` elements to use flex layout so the badge sits inline with the truncated public key. Then run a full build to prove everything compiles clean.

The agreement detail page is at `app/web/src/app/(console)/agreements/[id]/page.tsx`. The wallet addresses are rendered in a `<dl>` grid inside a `<Card>`. Each address is in a `<dd>` with `className="font-mono text-xs"`. The badge should appear to the right of each address.

## Steps

1. Open `app/web/src/app/(console)/agreements/[id]/page.tsx` and add the import:
   ```tsx
   import { MpcBadge } from "~/components/mpc-badge";
   ```

2. Find the three `<dd>` elements for Payer, Payee, and Authority (they contain `truncatePubkey(payment.payer)`, `truncatePubkey(payment.payee)`, and `truncatePubkey(payment.authority)`). For each one, change from:
   ```tsx
   <dd className="font-mono text-xs">{truncatePubkey(payment.payer)}</dd>
   ```
   to:
   ```tsx
   <dd className="flex items-center gap-1.5 font-mono text-xs">
     {truncatePubkey(payment.payer)}
     <MpcBadge />
   </dd>
   ```
   Apply the same pattern to all three (payer, payee, authority). Do NOT add MpcBadge to Token Mint, Payment ID, or other non-wallet fields.

3. Run the build to verify clean compilation:
   ```bash
   cd app/web && bun run build
   ```
   The build must exit 0 with no type errors or import failures.

4. Verify badge count in the file:
   ```bash
   grep -c "MpcBadge" app/web/src/app/\(console\)/agreements/\[id\]/page.tsx
   ```
   Should return at least 4 (1 import + 3 usages).

## Must-Haves

- [ ] MpcBadge imported from `~/components/mpc-badge`
- [ ] MpcBadge renders next to payer address
- [ ] MpcBadge renders next to payee address
- [ ] MpcBadge renders next to authority address
- [ ] `<dd>` elements use flex layout for proper badge alignment
- [ ] `bun run build` exits 0

## Verification

- `cd app/web && bun run build` exits 0
- `grep -c "MpcBadge" app/web/src/app/\(console\)/agreements/\[id\]/page.tsx` returns >= 4
- `grep -q "flex" app/web/src/app/\(console\)/agreements/\[id\]/page.tsx` confirms flex layout on dd elements

## Observability Impact

- Signals added/changed: MPC badges render as visible DOM elements with `data-slot="badge"` attribute; tooltip portals appear on hover
- How a future agent inspects this: `grep -c "MpcBadge" app/web/src/app/\(console\)/agreements/\[id\]/page.tsx` confirms integration count; browser DevTools shows badge elements in the agreement card's dl grid
- Failure state exposed: If MpcBadge import fails, build exits non-zero with TS error pointing to the import line; if TooltipProvider is missing from layout, hovering any badge triggers a React error boundary

## Inputs

- `app/web/src/app/(console)/agreements/[id]/page.tsx` — existing agreement detail page to modify
- `app/web/src/components/mpc-badge.tsx` — MPC badge component created in T01

## Expected Output

- `app/web/src/app/(console)/agreements/[id]/page.tsx` — modified with MpcBadge integration on payer, payee, and authority addresses
