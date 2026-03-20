---
estimated_steps: 4
estimated_files: 1
---

# T02: Rewrite Activity page with live event feed and shadcn components

**Slice:** S06 — Activity Event Feed
**Milestone:** M001

## Description

Replace the hardcoded mock array in `activity/page.tsx` with a live feed consuming `useActivityFeed()` from T01. The page follows the exact same pattern as `compliance/page.tsx`: `"use client"`, shadcn Table/Badge/Skeleton, and loading/error/empty/disconnected states. This completes R005 (Activity page shows real on-chain events) and R006 (shadcn components used throughout).

## Steps

1. Rewrite `app/web/src/app/(console)/activity/page.tsx` as a `"use client"` component
2. Import `useActivityFeed` and `ActivityEvent` from `~/lib/queries/activity`, `useWallet` from `@solana/wallet-adapter-react`, shadcn `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableHead`/`TableCell` from `~/components/ui/table`, `Badge` from `~/components/ui/badge`, `Skeleton` from `~/components/ui/skeleton`, `PublicKey` from `@solana/web3.js`
3. Add inline `truncatePubkey(pubkey: PublicKey)` helper (same pattern as compliance/agreements/milestones pages) and a `formatTime(blockTime: number | null)` helper that returns a relative time string (e.g., "2m ago", "3h ago") or "Unknown" for null
4. Build the page with four states following `compliance/page.tsx` structure:
   - **Disconnected:** "Connect your wallet to view activity events." centered message (same as compliance page even though events are public — keeps UI consistent across all pages)
   - **Error:** "Failed to load activity events" with error message
   - **Loading:** Skeleton rows (4 rows × 4 columns)
   - **Empty:** "No activity events found. Events appear when payment transactions are executed on-chain."
   - **Data:** shadcn Table with columns: Time, Event, Payment, Signature. Time shows formatted blockTime. Event shows Badge with event name (e.g. "PaymentCreated"). Payment shows truncated pubkey from `event.data.payment` (all 9 events have a `payment` field). Signature shows truncated tx signature.
5. Remove the entire hardcoded `events` array and old markup. Keep the `topbar` header with updated title/subtitle. Verify no `@/` imports.

## Must-Haves

- [ ] Page is a `"use client"` component consuming `useActivityFeed()`
- [ ] Uses shadcn Table, Badge, and Skeleton components
- [ ] Shows disconnected, loading, error, empty, and data states
- [ ] Zero hardcoded mock arrays remain
- [ ] All imports use `~/` alias, no `@/`
- [ ] `bun run build` exits 0
- [ ] `bun run typecheck` exits 0

## Verification

- `cd app/web && bun run build` exits 0
- `cd app/web && bun run typecheck` exits 0
- `! grep -q "const events = \[" app/web/src/app/\(console\)/activity/page.tsx` — no hardcoded array
- `grep -q "use client" app/web/src/app/\(console\)/activity/page.tsx` — client component
- `grep -q "Table" app/web/src/app/\(console\)/activity/page.tsx` — uses shadcn Table
- `grep -q "Badge" app/web/src/app/\(console\)/activity/page.tsx` — uses shadcn Badge
- `grep -q "Skeleton" app/web/src/app/\(console\)/activity/page.tsx` — uses shadcn Skeleton
- `grep -q "useActivityFeed" app/web/src/app/\(console\)/activity/page.tsx` — consumes hook

## Inputs

- `app/web/src/lib/queries/activity.ts` — `useActivityFeed()` hook and `ActivityEvent` type from T01
- `app/web/src/app/(console)/compliance/page.tsx` — reference pattern for page structure (states, layout, shadcn usage)
- `app/web/src/app/(console)/activity/page.tsx` — existing file to rewrite (remove hardcoded array)

## Expected Output

- `app/web/src/app/(console)/activity/page.tsx` — rewritten with live event feed, shadcn components, all UI states
