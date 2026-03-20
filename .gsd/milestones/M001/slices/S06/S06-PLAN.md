# S06: Activity Event Feed

**Goal:** Activity page parses and displays real on-chain events from gherkin_pay program transactions; events labelled by type with timestamp and affected payment.
**Demo:** Navigate to Activity page with wallet connected → see table of recent program events (PaymentCreated, PaymentFunded, etc.) parsed from on-chain transaction logs, with event type badges, timestamps, and truncated payment pubkeys. Empty state shown when no events exist.

## Must-Haves

- `useActivityFeed()` React Query hook fetching recent program transaction signatures, parsing logs with Anchor `EventParser`, returning typed event objects
- Activity page rewritten with shadcn Table/Badge/Skeleton, showing loading/error/empty/disconnected states
- Zero hardcoded mock arrays in `activity/page.tsx`
- All imports use `~/` alias (no `@/`)
- `bun run build` and `bun run typecheck` pass clean

## Proof Level

- This slice proves: operational
- Real runtime required: yes (devnet RPC for transaction fetching)
- Human/UAT required: no (build + typecheck verify compilation; runtime data display requires devnet transactions to exist)

## Verification

- `cd app/web && bun run build` exits 0
- `cd app/web && bun run typecheck` exits 0
- `! grep -q "const events = \[" app/web/src/app/\(console\)/activity/page.tsx` — no hardcoded array
- `grep -q "useActivityFeed" app/web/src/lib/queries/activity.ts` — hook exported
- `grep -q "use client" app/web/src/app/\(console\)/activity/page.tsx` — client component
- `grep -q "Table" app/web/src/app/\(console\)/activity/page.tsx` — uses shadcn Table
- `! grep -rq '"@/' app/web/src/lib/queries/activity.ts app/web/src/app/\(console\)/activity/page.tsx` — no @/ imports

## Integration Closure

- Upstream surfaces consumed: `app/web/src/lib/anchor.ts` (useAnchorProgram → program.coder), `app/web/src/lib/constants.ts` (PROGRAM_ID), `app/web/src/idl/gherkin_pay.json` (IDL for EventParser), shadcn Table/Badge/Skeleton components
- New wiring introduced in this slice: `useActivityFeed()` query hook consumed by activity page
- What remains before the milestone is truly usable end-to-end: nothing — S06 is the final slice in M001

## Tasks

- [ ] **T01: Create useActivityFeed query hook with EventParser log parsing** `est:30m`
  - Why: The activity page needs a data source that fetches recent program transactions from devnet and parses their logs into typed events using Anchor's EventParser
  - Files: `app/web/src/lib/queries/activity.ts`
  - Do: Create `useActivityFeed()` React Query hook. Use `connection.getSignaturesForAddress(PROGRAM_ID)` to get last 50 signatures, `connection.getParsedTransactions()` to get parsed txs, then `EventParser` from `@coral-xyz/anchor` with the program's coder to parse `meta.logMessages` from each transaction. Return flat array of `{ signature, slot, blockTime, name, data }` objects sorted by slot descending. Handle null transactions and null logMessages gracefully. Cast program to `Program<GherkinPay>` for typed coder access (per D008 pattern). React Query key: `["activity"]`.
  - Verify: `grep -q "useActivityFeed" app/web/src/lib/queries/activity.ts && grep -q "EventParser" app/web/src/lib/queries/activity.ts`
  - Done when: Hook exported, uses EventParser, compiles without type errors

- [ ] **T02: Rewrite Activity page with live event feed and shadcn components** `est:30m`
  - Why: Replace the hardcoded mock array with a live feed consuming `useActivityFeed()`, following the established page pattern from compliance/agreements/milestones pages (R005, R006)
  - Files: `app/web/src/app/(console)/activity/page.tsx`
  - Do: Rewrite as `"use client"` component consuming `useActivityFeed()`. Use shadcn Table with columns: Time (relative timestamp from blockTime), Event (Badge with event name), Payment (truncated pubkey from event data), Details (signature truncated). Include Skeleton loading rows, empty state, error state, disconnected state. Format blockTime as relative time. Use the same `truncatePubkey` inline helper pattern as other pages. Follow the exact structure of `compliance/page.tsx` for state handling.
  - Verify: `cd app/web && bun run build && bun run typecheck`
  - Done when: `bun run build` exits 0, `bun run typecheck` exits 0, no hardcoded mock arrays, page uses shadcn Table/Badge/Skeleton

## Files Likely Touched

- `app/web/src/lib/queries/activity.ts` (new)
- `app/web/src/app/(console)/activity/page.tsx` (rewrite)
