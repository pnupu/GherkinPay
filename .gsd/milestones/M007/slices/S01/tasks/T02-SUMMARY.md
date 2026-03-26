---
id: T02
parent: S01
milestone: M007
provides:
  - MpcBadge integrated into agreement detail page next to payer, payee, and authority addresses
key_files:
  - app/web/src/app/(console)/agreements/[id]/page.tsx
key_decisions:
  - Used flex layout with gap-1.5 on dd elements for badge alignment, matching compact spacing
patterns_established:
  - Wallet address dd elements use "flex items-center gap-1.5" when badges are appended inline
observability_surfaces:
  - Browser DevTools: data-slot="badge" attribute on MPC badge elements in the dl grid
  - grep -c "MpcBadge" on the detail page file returns 4 (1 import + 3 usages)
duration: 6m
verification_result: passed
completed_at: 2026-03-25
blocker_discovered: false
---

# T02: Integrate MpcBadge into agreement detail page and verify build

**Wired MpcBadge component next to payer, payee, and authority addresses in the agreement detail page with flex-aligned layout**

## What Happened

Imported `MpcBadge` from `~/components/mpc-badge` into the agreement detail page. Updated the three wallet address `<dd>` elements (payer, payee, authority) to use `flex items-center gap-1.5` layout and appended `<MpcBadge />` after each truncated pubkey. Token Mint, Payment ID, and other non-wallet fields were intentionally left unchanged. Cleared stale `.next` cache and ran a clean production build — exits 0 with no type errors.

## Verification

- `bun run build` exits 0 — clean production build with all routes compiled
- `grep -c "MpcBadge"` returns 4 (1 import + 3 JSX usages) — all three wallet addresses covered
- `grep -q "flex"` confirms flex layout on dd elements
- All slice-level verification checks pass: tooltip.tsx exists, mpc-badge.tsx exists, TooltipProvider in root layout, MpcBadge in detail page

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && rm -rf .next && bun run build` | 0 | ✅ pass | 6.1s |
| 2 | `test -f app/web/src/components/ui/tooltip.tsx` | 0 | ✅ pass | <1s |
| 3 | `test -f app/web/src/components/mpc-badge.tsx` | 0 | ✅ pass | <1s |
| 4 | `grep -q "TooltipProvider" app/web/src/app/layout.tsx` | 0 | ✅ pass | <1s |
| 5 | `grep -q "MpcBadge" app/web/src/app/(console)/agreements/[id]/page.tsx` | 0 | ✅ pass | <1s |
| 6 | `grep -c "MpcBadge" app/web/src/app/(console)/agreements/[id]/page.tsx` → 4 | 0 | ✅ pass | <1s |

## Diagnostics

- `grep -c "MpcBadge" app/web/src/app/\(console\)/agreements/\[id\]/page.tsx` — confirms integration count (expect 4)
- Browser DevTools Elements panel: `data-slot="badge"` attribute on MPC badge elements within the agreement card's dl grid
- Hovering any badge: `[data-radix-popper-content-wrapper]` portal node appears with tooltip content
- If MpcBadge import fails, build exits non-zero with TS error pointing to the import line

## Deviations

- Initial build attempt failed due to stale webpack cache (unrelated pre-existing Pyth dependency resolution issue). Cleared `.next` directory and rebuild succeeded. Verified the same failure occurs without my changes when using stale cache.

## Known Issues

None.

## Files Created/Modified

- `app/web/src/app/(console)/agreements/[id]/page.tsx` — Added MpcBadge import and integrated badge next to payer, payee, and authority address dd elements with flex layout
