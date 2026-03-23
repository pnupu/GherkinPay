# S02: Compliance Audit Log — Research

**Date:** 2026-03-23
**Depth:** Light — this is a straightforward frontend page following the established Activity page pattern

## Summary

The Compliance Audit Log is a new page at `/audit` that displays a filterable timeline of compliance-relevant on-chain events. The existing Activity page (`/activity`) and its `useActivityFeed()` query hook already demonstrate the exact pattern: fetch recent program transactions, parse events with Anchor's `EventParser`, and render them in a filterable table with `TableToolbar` + `Pagination`.

The gherkin_pay program already emits 9 event types, several of which are compliance-relevant: `PaymentCreated` (has `metadata_uri` — Travel Rule), `ConditionMet`, `MultisigApproval`, `PaymentReleased`, `PaymentCancelled`. No contract changes are needed — this is purely a frontend slice.

The work breaks into three clean units: (1) a query hook that filters activity events to compliance-relevant ones, (2) the page component, and (3) a nav link.

## Recommendation

Clone the Activity page pattern. Create a `useComplianceAuditLog()` hook that reuses the same `getSignaturesForAddress` + `EventParser` approach from `activity.ts`, but filters to compliance-relevant event names. Build the page using the same `Table` + `TableToolbar` + `Pagination` components. Add an "Audit Log" nav entry in `dashboard-nav.tsx`.

Do NOT create a separate RPC fetching mechanism — reuse the exact same pattern. The only difference from Activity is: (a) filtering to compliance event types, (b) richer column display (showing metadata_uri for PaymentCreated, signer for MultisigApproval, amounts for PaymentReleased), and (c) the route is `/audit`.

## Implementation Landscape

### Key Files

- `app/web/src/lib/queries/activity.ts` — **Pattern to follow.** `useActivityFeed()` fetches signatures, parses logs with `EventParser`, returns `ActivityEvent[]`. The audit log hook is structurally identical.
- `app/web/src/app/(console)/activity/page.tsx` — **Pattern to follow.** Table + toolbar + pagination + skeleton loading + wallet-not-connected state. Clone and adapt.
- `app/web/src/components/table-toolbar.tsx` — Reusable `TableToolbar` with `FilterPills` + `SearchInput`. Already supports filter options with counts.
- `app/web/src/components/pagination.tsx` — Reusable `Pagination` + `usePagination` hook.
- `app/web/src/app/_components/dashboard-nav.tsx` — `navItems` array. Add `{ href: "/audit", label: "Audit Log" }`.
- `app/web/src/lib/anchor.ts` — `useAnchorProgram()` — returns the program instance needed for `EventParser`.
- `app/web/src/lib/constants.ts` — `PROGRAM_ID` used for `getSignaturesForAddress`.
- `programs/gherkin-pay/src/events.rs` — Source of truth for event structs. 9 events total, all already in the IDL.

### Compliance-Relevant Events

These events should be included in the audit log (all from gherkin_pay program):

| Event | Compliance Relevance | Key Data Fields |
|-------|---------------------|-----------------|
| `PaymentCreated` | Travel Rule metadata attached | `payment`, `authority`, `payer`, `payee`, `metadata_uri` |
| `PaymentFunded` | Settlement value locked | `payment`, `payer`, `amount` |
| `ConditionMet` | Condition evaluation / approval | `payment`, `milestone_index`, `condition_index`, `condition_type` |
| `MultisigApproval` | Signer authorization | `payment`, `signer`, `approvals_count`, `threshold` |
| `PaymentReleased` | Settlement executed | `payment`, `payee`, `amount`, `milestone_index` |
| `PaymentCancelled` | Refund / reversal | `payment`, `refund_amount` |
| `MilestoneAdvanced` | Settlement progression | `payment`, `completed_index`, `next_index` |

Exclude `ConditionAdded` (setup, not compliance action) and `PaymentCompleted` (redundant with final `PaymentReleased`).

### Build Order

1. **Query hook** (`app/web/src/lib/queries/audit-log.ts`) — Create `useComplianceAuditLog()`. Structurally identical to `useActivityFeed()` but with a `COMPLIANCE_EVENTS` allowlist filter and queryKey `["audit-log"]`. This is the data foundation — build first.
2. **Page component** (`app/web/src/app/(console)/audit/page.tsx`) — Clone Activity page structure. Add richer columns: Event, Details (context-dependent on event type), Payment, Time, Signature. Use `TableToolbar` for filtering by event type and search.
3. **Nav link** — Add "Audit Log" to `navItems` in `dashboard-nav.tsx`. Trivial change, do last.

### Verification Approach

- `bun run build` in `app/web/` passes clean (no type errors, no missing imports)
- `/audit` route renders with wallet disconnected (shows connect prompt)
- `/audit` route renders with wallet connected (shows table with events or empty state)
- Filter pills work (clicking a compliance event type filters the table)
- Search works (typing a signature substring filters results)
- All existing pages still render (nav change doesn't break routing)

## Constraints

- The hook program (`gherkin_pay_hook`) emits zero events — all parseable events come from `gherkin_pay` only. The audit log cannot show transfer hook executions directly; it can only show gherkin_pay events that trigger around transfers.
- `EventParser` requires the program to be cast as `Program<GherkinPay>` (see KNOWLEDGE.md: "EventParser requires program.coder cast").
- `useAnchorProgram()` returns `Program<Idl>` — must cast to `Program<GherkinPay>` in the hook, same as `activity.ts` does.
