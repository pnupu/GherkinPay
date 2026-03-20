---
estimated_steps: 5
estimated_files: 1
---

# T01: Create useActivityFeed query hook with EventParser log parsing

**Slice:** S06 — Activity Event Feed
**Milestone:** M001

## Description

Create the `useActivityFeed()` React Query hook that fetches recent gherkin_pay program transactions from devnet, parses their log messages using Anchor's `EventParser`, and returns typed event objects. This is the data layer for the Activity page — the page rewrite in T02 consumes this hook.

The hook follows the same pattern as `useComplianceEntries()` in `~/lib/queries/compliance.ts`: a `"use client"` module exporting a single React Query hook that depends on `useAnchorProgram()`.

## Steps

1. Create `app/web/src/lib/queries/activity.ts` as a `"use client"` module
2. Import dependencies: `useConnection` from `@solana/wallet-adapter-react`, `useAnchorProgram` from `~/lib/anchor`, `PROGRAM_ID` from `~/lib/constants`, `useQuery` from `@tanstack/react-query`, `EventParser` from `@coral-xyz/anchor`, `Program` type from `@coral-xyz/anchor`, `GherkinPay` type from `~/types/gherkin_pay`
3. Define the `ActivityEvent` interface: `{ signature: string; slot: number; blockTime: number | null; name: string; data: Record<string, any> }`
4. Implement `useActivityFeed()`:
   - Get `connection` from `useConnection()`, get `program` from `useAnchorProgram()`, cast to `Program<GherkinPay> | null`
   - React Query key: `["activity"]`, enabled when `!!program`
   - In queryFn:
     a. Call `connection.getSignaturesForAddress(PROGRAM_ID, { limit: 50 })` to get recent signatures
     b. Extract signature strings, call `connection.getParsedTransactions(signatures, { maxSupportedTransactionVersion: 0 })` to batch-fetch
     c. Create `EventParser` with `new EventParser(PROGRAM_ID, program!.coder)`
     d. Iterate over transactions, skip null entries, skip entries with null `meta?.logMessages`
     e. For each valid transaction, call `eventParser.parseLogs(tx.meta!.logMessages!)` — this returns a generator; iterate it collecting `{ name, data }` pairs
     f. For each parsed event, create an `ActivityEvent` with `{ signature: sigInfo.signature, slot: tx.slot, blockTime: tx.blockTime, name: event.name, data: event.data }`
     g. Return the flat array (already in reverse chronological order from `getSignaturesForAddress`)
5. Export `useActivityFeed` and the `ActivityEvent` type

## Must-Haves

- [ ] Hook uses `EventParser` from `@coral-xyz/anchor` to parse program logs
- [ ] Hook uses `getSignaturesForAddress` with `PROGRAM_ID` to fetch recent transactions
- [ ] Hook handles null transactions and null logMessages gracefully (skip, don't crash)
- [ ] Hook is a `"use client"` module
- [ ] All imports use `~/` alias, no `@/`
- [ ] `ActivityEvent` type is exported for T02 consumption
- [ ] Program is cast to `Program<GherkinPay>` for typed coder access (per D008 pattern)

## Verification

- `grep -q "useActivityFeed" app/web/src/lib/queries/activity.ts` — hook exported
- `grep -q "EventParser" app/web/src/lib/queries/activity.ts` — uses EventParser
- `grep -q "getSignaturesForAddress" app/web/src/lib/queries/activity.ts` — fetches signatures
- `grep -q '"use client"' app/web/src/lib/queries/activity.ts` — client module
- `! grep -q '"@/' app/web/src/lib/queries/activity.ts` — no @/ imports

## Inputs

- `app/web/src/lib/anchor.ts` — `useAnchorProgram()` hook providing program instance with coder
- `app/web/src/lib/constants.ts` — `PROGRAM_ID` for `getSignaturesForAddress` and `EventParser`
- `app/web/src/idl/gherkin_pay.json` — IDL defining 9 event types with discriminators
- `app/web/src/types/gherkin_pay.ts` — `GherkinPay` type for Program generic cast
- `app/web/src/lib/queries/compliance.ts` — reference pattern for React Query hook structure

## Expected Output

- `app/web/src/lib/queries/activity.ts` — `useActivityFeed()` hook and `ActivityEvent` type export
