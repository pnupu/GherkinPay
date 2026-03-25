---
depends_on: [M006]
---

# M007: Institutional Custody Framing

**Gathered:** 2026-03-24
**Status:** Ready for planning

## Project Description

GherkinPay is a Solana escrow protocol for condition-gated stablecoin payments. M007 adds institutional custody integration framing — MPC-compatible wallet badges, custody-aware UI labels, and README documentation explaining that any MPC custody provider (Fireblocks, Fordefi, etc.) can act as payer or payee.

## Why This Milestone

Fireblocks is a StableHacks hackathon partner. Judges will look for custody integration awareness. GherkinPay's escrow PDA design is already compatible — Fireblocks MPC wallets are standard Solana keypairs. This milestone makes that compatibility visible and documented rather than leaving judges to infer it.

## User-Visible Outcome

### When this milestone is complete, the user can:

- See "MPC Compatible" badges next to payer/payee/authority wallet addresses in the agreement detail page
- Hover over badges to see a tooltip explaining Fireblocks/Fordefi/MPC custody provider compatibility
- Read a Custody Integration section in the README explaining the architectural compatibility

### Entry point / environment

- Entry point: https://gherkinpay.lacertalabs.xyz and project README on GitHub
- Environment: Browser → Next.js → Solana Devnet
- Live dependencies involved: EC2 instance for deploy

## Completion Class

- Contract complete means: no contract changes needed
- Integration complete means: UI badges render correctly on real agreement data from devnet
- Operational complete means: deployed to EC2, README updated on GitHub

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Agreement detail page shows MPC Compatible badges on wallet addresses when viewing a real devnet payment
- README Custody Integration section exists and accurately describes the compatibility architecture
- App is deployed at gherkinpay.lacertalabs.xyz with custody labels visible

## Risks and Unknowns

- **None significant** — this is UI labels and documentation. The only risk is getting the framing right for judges.

## Existing Codebase / Prior Art

- `app/web/src/components/agreements-client.tsx` — Agreement list and detail views; wallet addresses displayed via `truncatePubkey()`
- `app/web/src/lib/queries/agreements.ts` — ParsedAgreement type with `authority`, `payer`, `payee` fields
- `README.md` — Project README with Key Capabilities table and Architecture section
- `infra/README.md` — EC2 deploy procedure

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions.

## Relevant Requirements

- R031 — Custody-compatible wallet labels in agreement detail page (primary)
- R032 — README documents MPC custody provider compatibility (primary)
- R030 — EC2 deploy (shared with M006)

## Scope

### In Scope

- "MPC Compatible" badge component with tooltip
- Badges on payer, payee, authority addresses in agreement detail
- README Custody Integration section
- Deploy to EC2

### Out of Scope / Non-Goals

- Actual Fireblocks API integration (not needed — the protocol is already compatible)
- Custody provider detection (no way to distinguish MPC wallets from regular wallets on-chain)
- Smart contract changes

## Technical Constraints

- Badges are informational only — there's no on-chain way to distinguish MPC wallets from regular wallets
- The badge appears on ALL addresses since any Solana address is MPC-compatible by design
- Must use existing shadcn Badge/Tooltip components for consistency

## Integration Points

- **EC2 (gherkinpay.lacertalabs.xyz)** — Deploy target

## Open Questions

- None — scope is straightforward
