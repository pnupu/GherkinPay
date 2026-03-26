---
id: M007
provides:
  - "MPC Compatible" badges with tooltips on payer/payee/authority addresses in agreement detail page
  - Reusable Tooltip UI component (shadcn wrapper around Radix primitives) available app-wide
  - MpcBadge component — self-contained, no-props badge with ShieldCheck icon and custody explanation tooltip
  - README Custody Integration section documenting MPC wallet compatibility with Fireblocks/Fordefi/Anchorage examples
  - Full M007 build deployed to EC2 at gherkinpay.lacertalabs.xyz
key_decisions:
  - D014: Universal MPC badge on all wallet addresses — no on-chain way to distinguish MPC wallets from regular ones, so badge appears everywhere as an architectural fact
patterns_established:
  - "Radix Tooltip imported as { Tooltip as TooltipPrimitive } from 'radix-ui' (monolithic package)"
  - "TooltipProvider is app-wide in root layout — any component can use <Tooltip> without a local provider"
  - "Wallet address <dd> elements use flex items-center gap-1.5 when badges are appended inline"
observability_surfaces:
  - "curl -s -o /dev/null -w '%{http_code}' https://gherkinpay.lacertalabs.xyz — live health check"
  - "grep -c MpcBadge app/web/src/app/(console)/agreements/[id]/page.tsx — expect 4 (1 import + 3 usages)"
requirement_outcomes:
  - id: R031
    from_status: active
    to_status: validated
    proof: "MPC badges render next to payer, payee, and authority addresses in agreement detail page. Hovering shows Fireblocks/Fordefi custody compatibility tooltip. bun run build exits 0. grep -c MpcBadge returns 4 (1 import + 3 usages)."
  - id: R032
    from_status: active
    to_status: validated
    proof: "README contains ### Custody Integration subsection between Compliance Stack and Tech Stack sections. grep -c 'Custody Integration' README.md returns 1. grep -c 'Fireblocks|Fordefi|Anchorage' README.md returns 3. Section documents MPC wallet compatibility, PDA-based escrow design, and lists three example custody providers in a table."
  - id: R030
    from_status: validated
    to_status: validated
    proof: "Re-deployed via rsync + remote npm install/build + systemctl restart. curl returns HTTP 200. All M007 features live at demo URL."
duration: ~25m
verification_result: passed
completed_at: 2026-03-25
---

# M007: Institutional Custody Framing

**Added MPC custody compatibility badges to the agreement detail page, documented custody integration in the README, and deployed everything to production.**

## What Happened

S01 built the UI components: a reusable `tooltip.tsx` shadcn wrapper around Radix Tooltip primitives (using the monolithic `radix-ui` import pattern), and an `MpcBadge` component that combines a ShieldCheck icon with an emerald-toned outline badge and a hover tooltip explaining Fireblocks/Fordefi compatibility. The `<TooltipProvider>` was added to the root layout for app-wide tooltip support. The badge was integrated next to payer, payee, and authority addresses on the agreement detail page using flex layout for inline alignment. The badge appears on all wallet addresses universally — there's no on-chain way to distinguish MPC wallets from regular ones, so the badge communicates an architectural truth about the protocol.

S02 added a 14-line Custody Integration subsection to the README between Compliance Stack and Tech Stack, documenting that GherkinPay uses standard Ed25519 signers (any MPC wallet works), funds are in PDAs not user wallets, and listing Fireblocks, Fordefi, and Anchorage Digital as example providers. The full build was then deployed to EC2 via rsync, remote npm install/build, and systemd restart. HTTP 200 confirmed, MPC badge text verified in deployed bundles.

## Cross-Slice Verification

| Success Criterion | Evidence | Result |
|---|---|---|
| MPC badges on payer, payee, authority addresses | `grep -c MpcBadge` returns 4 (1 import + 3 usages) in agreement detail page | ✅ |
| Tooltip shows custody compatibility explanation | TooltipProvider in root layout, MpcBadge wraps Badge in Tooltip with Fireblocks/Fordefi text | ✅ |
| README Custody Integration section | `grep -c "Custody Integration" README.md` returns 1; Fireblocks/Fordefi/Anchorage all present | ✅ |
| Deployed to EC2 | `curl` returns HTTP 200; systemd service active; MPC badge in deployed bundles | ✅ |
| `bun run build` exits 0 | Build produces 10 routes, no errors | ✅ |

**Definition of done:** Both slices `[x]`, both slice summaries exist, cross-slice boundary (S01 badge components consumed by S02 deploy) verified through successful build and deploy.

## Requirement Changes

- **R031** (differentiator): active → validated — MPC badges on wallet addresses in agreement detail with working tooltips
- **R032** (differentiator): active → validated — README Custody Integration section with MPC/Fireblocks/Fordefi/Anchorage content
- **R030** (operability): remains validated — re-deployed with M007 features, HTTP 200 confirmed

## Forward Intelligence

### What the next milestone should know
- M007 is fully deployed. The live app at gherkinpay.lacertalabs.xyz includes all features through M007.
- The Tooltip infrastructure is app-wide — any component can use `<Tooltip>` without additional setup.
- `MpcBadge` is self-contained with no props. Just import and place it.
- No contract changes were made. The on-chain program is unchanged since M005.

### What's fragile
- Nothing new. The same EC2 rsync deploy fragility from M006 applies.

### Authoritative diagnostics
- `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz` — live health (expect 200)
- `grep -c MpcBadge app/web/src/app/(console)/agreements/[id]/page.tsx` — expect 4
- `grep -c "Custody Integration" README.md` — expect 1
- `cd app/web && bun run build` — full build verification, expect exit 0 with 10 routes

### What assumptions changed
- None. This milestone confirmed that the existing component patterns (shadcn wrappers, Radix primitives, Badge component) extend cleanly for new UI elements.

## Files Created/Modified

- `app/web/src/components/ui/tooltip.tsx` — New: shadcn Tooltip wrapper around Radix primitives
- `app/web/src/components/mpc-badge.tsx` — New: MPC Compatible badge with ShieldCheck icon and tooltip
- `app/web/src/app/layout.tsx` — Modified: added TooltipProvider to root layout
- `app/web/src/app/(console)/agreements/[id]/page.tsx` — Modified: MpcBadge next to payer, payee, authority addresses
- `README.md` — Modified: added Custody Integration subsection