---
id: S02
milestone: M004
status: ready
---

# S02: Compliance Audit Log — Context

<!-- Slice-scoped context. Milestone-only sections (acceptance criteria, completion class,
     milestone sequence) do not belong here — those live in the milestone context. -->

## Goal

A dedicated Compliance Audit Log page at `/audit` shows a filterable vertical timeline of all compliance-relevant on-chain events parsed from gherkin-pay program logs, visually distinct from the existing Activity table.

## Why this Slice

Hackathon judges (AMINA Bank, UBS, Fireblocks) will evaluate audit trail visibility as a core institutional-readiness criterion. The existing Activity page shows raw events in a generic table — the audit log reframes the same data with compliance-specific presentation (timeline layout, event type icons, date range filtering) to demonstrate institutional awareness. This slice is independent of S01 (can use existing events) and unblocks nothing, but is a high-impact demo feature for judging.

## Scope

### In Scope

- New `/audit` route with its own navigation entry in the console sidebar
- Separate page from Activity — not a tab or filter mode on the existing page
- All gherkin-pay program events are compliance-relevant: PaymentCreated, PaymentFunded, ConditionAdded, ConditionMet, PaymentReleased, PaymentCompleted, PaymentCancelled, MultisigApproval, MilestoneAdvanced
- Vertical timeline layout with icons per event type, timestamps, and expandable detail rows — feels like a proper audit trail
- Filter pills by event type (same pattern as Activity page)
- Date range picker for filtering events by time window
- Text search (signature, event name)
- Pagination
- Reuse the existing `useActivityFeed()` pattern from `app/web/src/lib/queries/activity.ts` — same RPC log parsing approach with EventParser
- New `useComplianceAuditLog()` query hook (may wrap or fork `useActivityFeed`)

### Out of Scope

- Hook program (gherkin-pay-hook) log parsing — only gherkin-pay program events
- Wallet address filtering (filter by specific party involved) — deferred
- Export/download of audit log (CSV, PDF)
- Real-time streaming / WebSocket updates — standard polling via React Query is sufficient
- Any backend or indexer — purely client-side RPC fetching
- Modifications to the existing Activity page
- Modifications to the existing Compliance (allowlist management) page

## Constraints

- Must not break existing pages (agreements, milestones, compliance, relayers, activity)
- Must follow existing design system (dark green palette, existing CSS tokens + shadcn tokens per D005)
- Must use existing Anchor EventParser pattern proven in `activity.ts`
- `bun run build` must pass clean
- Hackathon deadline March 29, 2026 — timeline layout should be polished but pragmatic

## Integration Points

### Consumes

- `app/web/src/lib/queries/activity.ts` — existing EventParser pattern and `ActivityEvent` type to fork or wrap
- `app/web/src/lib/anchor.ts` — Anchor program instance for EventParser
- `app/web/src/lib/constants.ts` — PROGRAM_ID for fetching signatures
- Existing IDL (`gherkin_pay` types) — for event parsing; if S01 adds new events (e.g. with metadata_uri), those will appear automatically via EventParser
- `app/web/src/components/table-toolbar.tsx` — filter pill pattern to reuse
- `app/web/src/components/pagination.tsx` — pagination component to reuse

### Produces

- `/audit` route page at `app/web/src/app/(console)/audit/page.tsx`
- `useComplianceAuditLog()` query hook at `app/web/src/lib/queries/audit.ts`
- Timeline UI components (timeline item, event type icons, expandable detail)
- Sidebar navigation entry for "Audit Log"

## Open Questions

- Whether to fork `useActivityFeed()` into a separate `useComplianceAuditLog()` hook or wrap it with additional filtering — current thinking: fork it to keep concerns separate and allow audit-specific enhancements (date range filtering at the query level, different fetch limit).
- Icon set for event types — current thinking: use simple semantic icons (shield, check, clock, etc.) from lucide-react which is already available via shadcn.
- Date range picker component — current thinking: use a simple two-input (from/to) date picker rather than a full calendar component to keep scope tight for the hackathon.
