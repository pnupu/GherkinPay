# M003: Advanced Flows

**Vision:** Wire all remaining condition engine instructions into the frontend — permissionless cranks, coordinated multisig approvals, webhook attestation, compliance management, and relayer registration — so GherkinPay's escrow protocol is fully operable from the browser on devnet.

## Success Criteria

- A user can navigate from the agreements list to a detail view showing all conditions and their current status
- Any connected wallet can crank a time, oracle, or token gate condition from the agreement detail view when preconditions are met
- A connected wallet that is in a multisig signer list can approve, see approval progress, and trigger condition-met when threshold is reached
- A connected wallet matching the registered relayer can paste an event hash and confirm a webhook condition
- An admin can add or update a wallet's compliance allowlist entry on the Compliance page with live on-chain writes
- A relayer operator can register their pubkey and label on the Relayers page
- When all conditions on a payment are satisfied, the UI enables an "Evaluate & Release" action

## Key Risks / Unknowns

- Pyth devnet feed staleness — pull-based feeds may require a Hermes price update POST before the on-chain PriceUpdateV2 account is fresh enough (MAX_PRICE_AGE_SECS = 60). If stale, `crankOracle` fails. This is the highest-friction point in M003 and shapes S01 ordering (oracle crank last among cranks).
- Agreement detail page does not exist yet — M001/M002 deliver the list page but no detail route. S01 must create both the route and the condition query infrastructure that S02 also depends on.
- Relayer registry has no on-chain account — the contract checks `relayer == condition.webhook.relayer` but has no registry. Must decide on storage approach during planning.

## Proof Strategy

- Pyth feed staleness → retire in S01 by building the oracle crank with a staleness warning and optional Hermes refresh pre-flight. Proven when an oracle-conditioned payment can be cranked successfully on devnet.
- Agreement detail page → retire in S01 by creating the `/agreements/[id]` route, condition query hook, and condition cards with crank actions. Proven when a user can click an agreement row and see its live conditions.
- Relayer registry → retire in S03 using localStorage for devnet MVP. Proven when a relayer can register on the Relayers page and the pubkey persists across page reloads.

## Verification Classes

- Contract verification: Each mutation hook is verified by sending a real transaction on devnet and confirming the on-chain account state changes (condition `met` flag, approval booleans, compliance entry `is_allowed`)
- Integration verification: Full oracle-gated flow — create payment (M002), fund, crank oracle (M003), evaluate & release — all via the UI on devnet
- Operational verification: None (no background services or daemons)
- UAT / human verification: Multisig flow requires wallet switching (connect as signer 1, approve; switch to signer 2, approve) — manual verification needed to confirm the connected-wallet gating works correctly

## Milestone Definition of Done

This milestone is complete only when all are true:

- All three slice deliverables are complete and verified on devnet
- Agreement detail page shows live condition data with type-specific action buttons
- All 7 instructions (crankTime, crankOracle, crankTokenGate, signMultisig, confirmWebhook, setCompliance, relayer registration) are callable from the UI
- Oracle-conditioned payment can be created, funded, oracle-cranked, and released entirely via the UI on devnet
- 2-of-3 multisig payment can have two signers approve via the UI and then release
- Compliance entry can be created via the Compliance page and verified on-chain
- Success criteria are re-checked against live browser behavior, not just artifact presence
- Program error codes (OraclePriceStale, SignerNotInList, etc.) are decoded into human-readable messages

## Requirement Coverage

- Covers: R011 (time crank), R012 (oracle crank), R013 (token gate crank), R014 (multisig signing), R015 (webhook confirmation), R016 (compliance management), R017 (relayer registration)
- Partially covers: none
- Leaves for later: R018 (Pyth feed browser — deferred, users paste feed pubkeys)
- Orphan risks: none — all Active requirements mapped to this milestone have a primary owning slice

## Slices

- [x] **S01: Permissionless Cranks** `risk:high` `depends:[]`
  > After this: user clicks an agreement row, sees live conditions, and can crank time/oracle/token gate conditions from the detail view on devnet
- [x] **S02: Permissioned Actions** `risk:medium` `depends:[S01]`
  > After this: a multisig signer can approve and see approval progress; a relayer wallet can paste an event hash and confirm a webhook condition — both on the agreement detail view
- [ ] **S03: Admin Flows** `risk:low` `depends:[]`
  > After this: admin can manage compliance allowlist entries on the Compliance page and register relayer pubkeys on the Relayers page — both with live on-chain writes

## Boundary Map

### S01 → S02

Produces:
- Agreement detail page at `/agreements/[id]` with condition card rendering and type-specific action button slots
- `useConditions(paymentPubkey)` React Query hook returning parsed `ConditionAccount` data
- `ConditionCard` component pattern with variant-specific rendering (type badge, metadata display, action button area)
- Mutation hook pattern for condition instructions (condition_index arg, payment + conditionAccount account resolution, `queryClient.invalidateQueries` on success)
- Program error decoding utility mapping anchor error codes to user-friendly messages

Consumes:
- M001: `useAnchorProgram()`, PDA helpers (`getConditionPDA`), wallet adapter context
- M002: mutation hook pattern (`useMutation` shape), `TransactionStatus` component, agreements list page with clickable rows

### S01 → S03

Produces:
- Nothing directly — S03 operates on separate pages (Compliance, Relayers) and programs (gherkin_pay_hook)

Consumes:
- M001: `useAnchorProgram()` (hook program variant), PDA helpers
- M02: mutation hook pattern, `TransactionStatus` component

### S02 (consumes from S01)

Consumes:
- Agreement detail page layout and condition card component from S01
- `useConditions()` query hook from S01
- Condition instruction mutation pattern from S01
- Error decoding utility from S01
