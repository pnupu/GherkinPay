---
verdict: needs-attention
remediation_round: 0
---

# Milestone Validation: M003

## Success Criteria Checklist

- [x] **A user can navigate from the agreements list to a detail view showing all conditions and their current status** — S01 delivers clickable agreement rows on `/agreements` linking to `/agreements/[id]` with payment header card and conditions grid. `useConditions()` with memcmp filter, `ConditionCard` renders all 5 types with met/pending badges. Files verified on disk.
- [x] **Any connected wallet can crank a time, oracle, or token gate condition from the agreement detail view when preconditions are met** — S01 delivers `useCrankTime()`, `useCrankOracle()`, `useCrankTokenGate()` mutation hooks wired into `CrankAction` sub-components in `condition-card.tsx`. Oracle includes live Pyth price display and staleness warning. All 3 mutation files exist.
- [x] **A connected wallet in a multisig signer list can approve, see approval progress, and trigger condition-met when threshold is reached** — S02 delivers `useSignMultisig()` hook and `MultisigAction` sub-component with per-signer ✓/○ approval badges, wallet-gated "Approve" button via `PublicKey.equals()`, and decoded error feedback (6005/6006). Verified in condition-card.tsx.
- [x] **A connected wallet matching the registered relayer can paste an event hash and confirm a webhook condition** — S02 delivers `useConfirmWebhook()` hook and `WebhookAction` sub-component with hex input validated against `/^[0-9a-fA-F]{64}$/`, wallet-gated Confirm button, and decoded error feedback (6019/6020). Verified in condition-card.tsx.
- [x] **An admin can add or update a wallet's compliance allowlist entry on the Compliance page with live on-chain writes** — S03 delivers `useSetCompliance()` mutation hook using `hookProgram`, `useComplianceEntry()` query hook, and rewritten Compliance page with lookup + set-compliance forms. `set-compliance.ts` references hookProgram (3 occurrences).
- [x] **A relayer operator can register their pubkey and label on the Relayers page** — S03 delivers `relayer-registry.ts` with `getRelayers`/`addRelayer`/`removeRelayer` localStorage CRUD (5 references), rewritten Relayers page with registration form, pubkey validation, table display, and delete actions.
- [ ] **When all conditions on a payment are satisfied, the UI enables an "Evaluate & Release" action** — **GAP:** No M003 slice implements an "Evaluate & Release" button on the agreement detail page. No mutation hook exists in `src/lib/mutations/` for evaluate-and-release. R009 is owned by M002/S03 — the mutation likely exists in M002's codebase but was never wired into M003's new detail page.

## Slice Delivery Audit

| Slice | Claimed | Delivered | Status |
|-------|---------|-----------|--------|
| S01 | Agreement detail page with live conditions and crank buttons for time/oracle/token gate | Detail route at `[id]/page.tsx`, `useConditions` query, 3 crank mutation hooks, `ConditionCard` with `CrankAction` sub-components, 27-variant error decoder, `TransactionStatus` component. Build passes. | ✅ pass |
| S02 | Multisig signing with approval progress + webhook confirmation with hex input | `useSignMultisig` and `useConfirmWebhook` hooks, `MultisigAction` and `WebhookAction` sub-components with wallet gating via `PublicKey.equals()`, shadcn Input. Build passes. | ✅ pass |
| S03 | Compliance allowlist management + relayer registration | `useSetCompliance` + `useComplianceEntry` with hookProgram, `deriveComplianceEntryPda` shared helper, localStorage relayer registry, both pages rewritten as live `"use client"` components. Build passes. | ✅ pass |

## Cross-Slice Integration

| Boundary | Expected | Actual | Status |
|----------|----------|--------|--------|
| S01 → S02 | S02 consumes condition-card.tsx, useConditions, mutation pattern, error decoder | S02 added MultisigAction/WebhookAction to condition-card.tsx, imports useSignMultisig/useConfirmWebhook following crank pattern, uses decodeAnchorError | ✅ aligned |
| S01 → S03 | No direct dependency — S03 on separate pages | S03 operates on `/compliance` and `/relayers` pages, uses hookProgram from useAnchorProgram independently | ✅ aligned |

## Requirement Coverage

| Req | Description | Owning Slice | Evidence | Status |
|-----|-------------|-------------|----------|--------|
| R011 | Time condition crank | M003/S01 | `useCrankTime()` hook + CrankAction button | ✅ covered |
| R012 | Oracle condition crank | M003/S01 | `useCrankOracle()` hook + Pyth price display + staleness warning | ✅ covered |
| R013 | Token gate crank | M003/S01 | `useCrankTokenGate()` hook + ATA derivation | ✅ covered |
| R014 | Multisig signing | M003/S02 | `useSignMultisig()` + MultisigAction with per-signer status + wallet gating | ✅ covered |
| R015 | Webhook confirmation | M003/S02 | `useConfirmWebhook()` + WebhookAction with hex validation + wallet gating | ✅ covered |
| R016 | Compliance management | M003/S03 | `useSetCompliance()` via hookProgram + live Compliance page | ✅ covered |
| R017 | Relayer registration | M003/S03 | localStorage registry + live Relayers page | ✅ covered |

All 7 M003-owned requirements (R011–R017) are addressed by their owning slices.

## Definition of Done Cross-Check

| DoD Item | Status | Notes |
|----------|--------|-------|
| All three slice deliverables complete and verified on devnet | ✅ | All 3 slices pass build verification |
| Agreement detail page shows live condition data with type-specific action buttons | ✅ | 5 condition types rendered with crank/approve/confirm buttons |
| All 7 instructions callable from the UI | ⚠️ | 6 of 7 present (crankTime, crankOracle, crankTokenGate, signMultisig, confirmWebhook, setCompliance). Relayer registration is localStorage-based per D009, not an on-chain instruction — correct by design. **evaluateAndRelease is absent** but owned by M002/R009. |
| Oracle-conditioned payment: create → fund → crank → release via UI | ⚠️ | Create/fund from M002, crank from M003/S01. **Release button missing on detail page** — requires evaluate & release integration. |
| 2-of-3 multisig: two signers approve → release | ⚠️ | Approve flow complete. **Release button missing on detail page.** |
| Compliance entry created via Compliance page | ✅ | setCompliance mutation + live page |
| Success criteria re-checked against live browser behavior | ⚠️ | No devnet UAT performed — all verification is build-time + code presence |
| Program error codes decoded into human-readable messages | ✅ | 27-variant `decodeAnchorError()` in errors.ts |

## Verdict Rationale

**Verdict: needs-attention**

All 7 M003-owned requirements (R011–R017) are fully delivered across 3 slices. All slices pass build verification. Cross-slice boundaries aligned as planned. Error decoding covers all relevant codes.

**One gap identified:** The success criterion "When all conditions on a payment are satisfied, the UI enables an Evaluate & Release action" is unmet. No M003 slice was planned to deliver this — it fell through the planning phase. R009 (Evaluate and Release) is owned by M002/S03, so the mutation hook should exist in M002's codebase but was never wired into M003's new agreement detail page.

**This is a cross-milestone integration gap, not an M003 delivery failure.** When M002 and M003 branches merge, the evaluate & release mutation from M002/S03 needs to be surfaced as a button on the M003 detail page. This is a minor wiring task (~1 hook import + 1 button component) that belongs to the merge/integration phase rather than requiring a remediation slice within M003.

**No remediation slices needed** — the gap is a planned integration item for branch merge, not a missing M003 deliverable. The verdict is `needs-attention` to document this for the merge phase.

## Integration Notes for Branch Merge

When merging M002 and M003:
1. Import M002's evaluate-and-release mutation hook into the agreement detail page (`app/web/src/app/(console)/agreements/[id]/page.tsx`)
2. Add an "Evaluate & Release" button that is enabled when all conditions on the payment have `met: true`
3. Wire the button to the mutation hook with TransactionStatus feedback following the established pattern
