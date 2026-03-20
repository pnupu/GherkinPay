# S06 — Research

**Date:** 2026-03-20
**Depth:** Light research — straightforward application of established codebase patterns (query hook + page rewrite) with one novel piece (Anchor EventParser for log parsing).

## Summary

S06 replaces the hardcoded `events` array in `app/web/src/app/(console)/activity/page.tsx` with a live on-chain activity feed. The approach: use `connection.getSignaturesForAddress(PROGRAM_ID)` to fetch recent transaction signatures for the gherkin_pay program, then `connection.getParsedTransactions()` to get logs, and Anchor's `EventParser` to decode those logs into typed events (PaymentCreated, PaymentFunded, PaymentReleased, etc.).

The IDL defines 9 event types with discriminators and fields already present in the types section. Anchor 0.32 ships `EventParser` which takes a programId + coder and exposes `parseLogs(logs)` returning a generator of `{ name, data }` objects. This is simpler and more reliable for an initial implementation than WebSocket subscriptions (`program.addEventListener`), which would require managing connection lifecycle and reconnection.

The page follows the identical pattern established by S03–S05: a `useActivityFeed()` React Query hook in `lib/queries/activity.ts`, consumed by a `"use client"` page that uses shadcn Table/Badge/Skeleton with loading, error, empty, and disconnected states.

## Recommendation

Use `getSignaturesForAddress` + `getParsedTransactions` + `EventParser.parseLogs()` for the activity feed. This is a poll-based approach that fits React Query's refetch model. No wallet connection is strictly required to read program events (they're public), but the page should show a "connect wallet" prompt for consistency with the other pages, and optionally filter events by the connected wallet's pubkey appearing in event data.

Build in two tasks: (1) the query hook, (2) the page rewrite.

## Implementation Landscape

### Key Files

- `app/web/src/app/(console)/activity/page.tsx` — current hardcoded page (31 lines). Replace entirely with live feed using shadcn components. Follow the exact pattern from `compliance/page.tsx` (121 lines): `"use client"`, Table/Badge/Skeleton, loading/error/empty/disconnected states.
- `app/web/src/lib/queries/activity.ts` — **new file**. `useActivityFeed()` hook. Uses `connection.getSignaturesForAddress(PROGRAM_ID)` then `connection.getParsedTransactions()`, feeds logs through `EventParser.parseLogs()`. Returns array of parsed events with signature, slot, blockTime, event name, and event data.
- `app/web/src/lib/constants.ts` — already exports `PROGRAM_ID` (needed for `getSignaturesForAddress` and `EventParser`).
- `app/web/src/lib/anchor.ts` — `useAnchorProgram()` provides access to the program's coder via `program.coder` (needed by `EventParser`). Also provides `connection` via `useConnection()`.
- `app/web/src/idl/gherkin_pay.json` — IDL with 9 events and their discriminators + type definitions.

### IDL Event Types (all 9)

| Event | Key Fields |
|-------|-----------|
| PaymentCreated | payment, authority, payer, payee, token_mint, total_amount, is_milestone, milestone_count |
| PaymentFunded | payment, payer, amount |
| ConditionAdded | payment, milestone_index, condition_index, condition_type |
| ConditionMet | payment, milestone_index, condition_index, condition_type |
| PaymentReleased | payment, payee, amount, milestone_index |
| PaymentCompleted | payment |
| PaymentCancelled | payment, refund_amount |
| MultisigApproval | payment, signer, milestone_index, condition_index, approvals_count, threshold |
| MilestoneAdvanced | payment, completed_index, next_index |

### Build Order

1. **T01: Activity query hook** (`lib/queries/activity.ts`) — Create `useActivityFeed()` hook. Imports `PROGRAM_ID` from constants, gets `connection` from `useConnection()`, gets `program.coder` from `useAnchorProgram()` for the `EventParser`. Fetches last N signatures (e.g. 50), batch-fetches parsed transactions, runs `EventParser.parseLogs()` on each tx's log messages, returns flat array of events sorted by slot descending. Each event shaped as `{ signature: string, slot: number, blockTime: number | null, name: string, data: Record<string, any> }`. React Query key: `["activity", publicKey?.toBase58() ?? "all"]`.

2. **T02: Activity page rewrite** (`activity/page.tsx`) — Replace hardcoded array with live feed consuming `useActivityFeed()`. Use shadcn Table with columns: Time, Event, Payment, Details. Badge for event type. Skeleton loading rows. Empty state. Error state. Disconnected state (optional — events are public, but keeps UI consistent). Format blockTime as relative timestamp. Truncate pubkeys with the same `truncatePubkey` helper used in other pages.

### Verification Approach

- `bun run build` passes (compilation check)
- `bun run typecheck` passes (type check)
- No hardcoded mock arrays remain in `activity/page.tsx`
- `useActivityFeed` hook is exported and importable
- Page uses shadcn Table/Badge/Skeleton components
- Zero `@/` imports in new files (must use `~/`)

## Constraints

- `EventParser` requires `program.coder` — need the Anchor program instance, so wallet must be connected (or construct a standalone coder from the IDL). Since other pages already require wallet connection, keeping the same pattern is simplest.
- `getSignaturesForAddress` returns signatures in reverse chronological order — no additional sorting needed for display.
- `getParsedTransactions` has a batch limit — Solana RPC accepts up to 100 signatures per call, but 50 is a reasonable default for the initial feed.
- `meta.logMessages` on a parsed transaction can be `null` if the node has pruned logs — handle gracefully by skipping those transactions.

## Common Pitfalls

- **EventParser needs the right programId** — it filters log lines by CPI invoke depth. Passing the wrong programId yields zero parsed events. Use `PROGRAM_ID` from constants (same address as in the IDL).
- **`getParsedTransactions` returns `null` entries** — if a transaction is not found (pruned or not yet confirmed), the array entry is `null`. Filter these out before parsing logs.
- **blockTime can be null** — older or edge-case transactions may have `null` blockTime. Display "Unknown" or a fallback.
