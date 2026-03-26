# M007: Institutional Custody Framing

**Vision:** Make GherkinPay's inherent MPC custody compatibility visible to hackathon judges through UI badges, tooltips, and README documentation — then deploy the complete build.

## Success Criteria

- Agreement detail page shows "MPC Compatible" badges next to payer, payee, and authority wallet addresses when viewing any devnet payment
- Hovering a badge reveals a tooltip explaining Fireblocks/Fordefi/MPC custody provider compatibility
- README contains a Custody Integration section that accurately describes the compatibility architecture
- App is deployed at gherkinpay.lacertalabs.xyz with custody labels visible

## Key Risks / Unknowns

None significant — this is UI labels and documentation. The protocol is already custody-compatible by design.

## Verification Classes

- Contract verification: `bun run build` exits 0 with no errors
- Integration verification: none (no new runtime boundaries)
- Operational verification: `curl` returns HTTP 200 at live URL after deploy
- UAT / human verification: visual check of badges + tooltips on agreement detail page

## Milestone Definition of Done

This milestone is complete only when all are true:

- [x] MPC badges render on agreement detail page next to all three wallet addresses
- [x] Tooltip hover works and explains custody provider compatibility
- [x] README Custody Integration section exists with MPC/Fireblocks/Fordefi content
- [x] `bun run build` exits 0
- [x] Live app at gherkinpay.lacertalabs.xyz shows custody framing after deploy

## Requirement Coverage

- Covers: R031 (custody-compatible wallet labels), R032 (README custody documentation), R030 (EC2 deploy)
- Partially covers: none
- Leaves for later: none
- Orphan risks: none

## Slices

- [x] **S01: MPC Badge + Agreement Detail Integration** `risk:low` `depends:[]`
  > After this: navigating to any agreement detail page shows "MPC Compatible" badges with working tooltips next to payer, payee, and authority addresses on localhost
- [x] **S02: README Custody Section + EC2 Deploy** `risk:low` `depends:[S01]`
  > After this: README documents custody compatibility, and the live app at gherkinpay.lacertalabs.xyz shows MPC badges on agreement detail pages

## Boundary Map

### S01 → S02

Produces:
- `<MpcBadge />` React component (no props) rendering "MPC Compatible" badge with ShieldCheck icon and tooltip
- `<TooltipProvider>` wrapped in root layout enabling tooltips app-wide
- `tooltip.tsx` shadcn wrapper around Radix Tooltip primitives

Consumes:
- nothing (first slice)

### S02

Produces:
- README Custody Integration section between Compliance Stack and Tech Stack
- Deployed build at gherkinpay.lacertalabs.xyz including all M007 UI changes

Consumes:
- S01's MPC badge component and tooltip infrastructure (included in build)
