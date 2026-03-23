---
estimated_steps: 4
estimated_files: 1
skills_used: []
---

# T01: Create useComplianceAuditLog query hook

**Slice:** S02 — Compliance Audit Log
**Milestone:** M004

## Description

Create the `useComplianceAuditLog()` React Query hook that fetches recent gherkin_pay program transactions from devnet, parses events with Anchor's `EventParser`, and filters to 7 compliance-relevant event types. This is structurally identical to `useActivityFeed()` in `activity.ts` — clone the pattern and add an allowlist filter.

The compliance-relevant events are: `PaymentCreated`, `PaymentFunded`, `ConditionMet`, `MultisigApproval`, `PaymentReleased`, `PaymentCancelled`, `MilestoneAdvanced`.

## Steps

1. Create `app/web/src/lib/queries/audit-log.ts`
2. Define a `COMPLIANCE_EVENTS` constant array containing the 7 event names listed above. Export it (the page will use it for filter pill generation).
3. Implement `useComplianceAuditLog()` following the exact pattern from `activity.ts`:
   - Import `Program`, `EventParser` from `@coral-xyz/anchor`, `useQuery` from `@tanstack/react-query`, `useConnection` from `@solana/wallet-adapter-react`, `GherkinPay` type, `useAnchorProgram`, and `PROGRAM_ID`.
   - Cast `rawProgram` to `Program<GherkinPay>` (same pattern as activity.ts — see KNOWLEDGE.md "EventParser requires program.coder cast").
   - Fetch signatures with `connection.getSignaturesForAddress(PROGRAM_ID, { limit: 50 })`.
   - Parse transactions with `EventParser` and filter to only events whose `name` is in `COMPLIANCE_EVENTS`.
   - Use queryKey `["audit-log"]`.
   - Return the same `ActivityEvent` interface shape (reuse from `activity.ts` or re-export).
4. Verify TypeScript compiles: `cd app/web && npx tsc --noEmit`

## Must-Haves

- [ ] `COMPLIANCE_EVENTS` array contains exactly: PaymentCreated, PaymentFunded, ConditionMet, MultisigApproval, PaymentReleased, PaymentCancelled, MilestoneAdvanced
- [ ] `useComplianceAuditLog()` returns React Query result with `ActivityEvent[]` data
- [ ] Uses `Program<GherkinPay>` cast for EventParser coder access
- [ ] TypeScript compiles without errors

## Verification

- `test -f app/web/src/lib/queries/audit-log.ts`
- `grep -c "COMPLIANCE_EVENTS" app/web/src/lib/queries/audit-log.ts` returns >= 1
- `grep -c "useComplianceAuditLog" app/web/src/lib/queries/audit-log.ts` returns >= 1
- `cd app/web && npx tsc --noEmit` exits 0

## Inputs

- `app/web/src/lib/queries/activity.ts` — Pattern to clone: useActivityFeed hook with EventParser, connection, program cast
- `app/web/src/lib/anchor.ts` — useAnchorProgram() returning the program instance
- `app/web/src/lib/constants.ts` — PROGRAM_ID for getSignaturesForAddress
- `app/web/src/types/gherkin_pay.ts` — GherkinPay type for Program generic cast

## Expected Output

- `app/web/src/lib/queries/audit-log.ts` — New file exporting useComplianceAuditLog() hook and COMPLIANCE_EVENTS constant
