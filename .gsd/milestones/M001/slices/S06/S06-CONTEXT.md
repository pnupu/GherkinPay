---
id: S06
milestone: M001
status: ready
---

# S06: Activity Event Feed — Context

## Goal

Replace the hardcoded activity list with a live feed of real on-chain events parsed from the last N gherkin_pay program transactions, showing all program events regardless of which wallet is connected.

## Why this Slice

S02 wired RPC and program constants; all other pages are live after S03–S05. S06 is the last page to clear hardcoded data, completing the milestone definition of done (zero hardcoded arrays, all 5 pages live).

## Scope

### In Scope

- `useActivityFeed()` React Query hook fetching the last N gherkin_pay program transactions via `getSignaturesForAddress` + `getParsedTransactions`, then parsing Anchor event logs from each transaction
- All 9 program event types parsed: `PaymentCreated`, `PaymentFunded`, `ConditionAdded`, `ConditionMet`, `PaymentReleased`, `PaymentCompleted`, `PaymentCancelled`, `MultisigApproval`, `MilestoneAdvanced`
- Each event row shows: human-readable label + key field summary (e.g. "Payment Released — 5xAb…Kp3q — 0.5 USDC"; "Multisig Approval — 5xAb…Kp3q — 2/3 signers") — label style matches the event type, fields shown are the most meaningful ones per type
- Timestamp derived from transaction block time (Unix epoch from `getParsedTransactions` response)
- Feed is global — all gherkin_pay program events, not scoped to the connected wallet's agreements
- A connected wallet is required to view the page — show the standard disconnected connect-prompt state (consistent with agreements, milestones, compliance pages)
- Four UI states: disconnected (connect prompt), loading (skeleton rows), empty (no transactions found), populated (event list)
- `bun run build` and `bun run typecheck` pass clean
- Zero hardcoded arrays remain in the activity page after this slice

### Out of Scope

- Real-time WebSocket subscription (`program.addEventListener`) — polling/one-shot fetch only for M001
- Pagination / "Load more" — fixed window of last N transactions
- Filtering or searching the feed by event type or payment — M002 or later
- Linking event rows to the explorer or to the agreement detail — M002
- Highlighting events belonging to the connected wallet — M002
- Any events from the gherkin_pay_hook program — those belong on the Compliance page, not here

## Constraints

- Use `RPC_ENDPOINT` and `PROGRAM_ID` from `~/lib/constants` — no direct env var access in the hook
- Must require wallet connection for display (consistent with all other console pages in this milestone)
- No `@/` imports — use `~/` alias throughout
- Follow the established four-state page pattern (disconnected / loading / empty / populated) exactly as in agreements, milestones, and compliance pages
- No hardcoded arrays may remain after this slice

## Integration Points

### Consumes

- `PROGRAM_ID` from `~/lib/constants` — used as the address for `getSignaturesForAddress`
- `RPC_ENDPOINT` from `~/lib/constants` (or `~/env`) — for direct `Connection` instantiation in the hook
- `useWallet()` from wallet adapter — as the gate for the enabled guard (query disabled when disconnected)
- shadcn `Table`, `Badge`, `Skeleton` from `~/components/ui/` — for the feed UI
- Four-state page pattern established in S03, S04, S05

### Produces

- `app/web/src/lib/queries/activity.ts` — `useActivityFeed()` React Query hook returning parsed events with type, summary string, and timestamp
- `app/web/src/app/(console)/activity/page.tsx` — fully rewritten with live event feed, four UI states, zero hardcoded arrays

## Open Questions

- How many transactions to fetch (N) — current thinking: 50 is a reasonable default for devnet; this is a constant in the hook, not user-configurable in M001
- Anchor event parsing approach — events are encoded in transaction log messages prefixed with `Program data:` base64 blobs; the implementation should use `program.coder.events.decode()` or equivalent to decode them, not hand-roll the discriminator matching. Research this during planning.
- Transactions with no parseable events (e.g. failed txs, other program invocations in the same slot) — silently skip them; do not show blank rows
- Block time may be null for very recent unconfirmed transactions — fall back to "just now" or omit the timestamp rather than crashing
