---
id: T02
parent: S01
milestone: M003
provides:
  - useAgreements() query hook fetching all PaymentAgreement accounts
  - useConditions(paymentPubkey) query hook with memcmp filter on ConditionAccount
  - usePaymentDetail(paymentPubkey) query hook for single agreement fetch
  - ConditionCard component rendering all 5 condition types with type-specific metadata
  - AgreementsClient component with clickable rows linking to /agreements/[pubkey]
  - Agreement detail page at /agreements/[id] with payment header + condition cards
  - Helper utilities: truncatePubkey, formatTokenAmount, extractStatus
key_files:
  - app/web/src/lib/queries/agreements.ts
  - app/web/src/lib/queries/conditions.ts
  - app/web/src/components/condition-card.tsx
  - app/web/src/components/agreements-client.tsx
  - app/web/src/app/(console)/agreements/[id]/page.tsx
  - app/web/src/app/(console)/agreements/page.tsx
key_decisions:
  - File-level eslint-disable for Anchor query files — Program<Idl> account accessors are inherently untyped; targeted suppression is the pragmatic pattern for Anchor 0.32
patterns_established:
  - Query hooks use (program.account as any).accountName pattern with eslint-disable header for Anchor SDK untyped accessors
  - BN-to-number conversion via toNumber() with fallback to Number(toString()) for mixed BN/number runtime types
  - Condition enum parsing via Object.keys(variant)[0] to extract discriminant name from Anchor enum objects
  - memcmp filter at offset 8 (after discriminator) for account relationship queries
  - Four UI states (disconnected, loading, error, populated) as standard pattern for wallet-aware pages
  - ConditionCard has data-testid="crank-action-{index}" slot for T03 crank buttons
observability_surfaces:
  - React Query cache keys ["agreements"], ["conditions", paymentPubkey], ["payment", paymentPubkey] visible in devtools
  - Four explicit UI states surface RPC failures visibly with error.message
duration: 10m
verification_result: passed
completed_at: 2026-03-20
blocker_discovered: false
---

# T02: Create agreement detail page with useConditions() hook and condition card rendering

**Built agreement list and detail pages with React Query hooks for on-chain PaymentAgreement and ConditionAccount data, ConditionCard component rendering all 5 condition types, and clickable row navigation from list to detail view.**

## What Happened

Created three React Query hooks: `useAgreements()` fetching all PaymentAgreement accounts, `useConditions(paymentPubkey)` filtering ConditionAccounts by payment via memcmp at offset 8, and `usePaymentDetail(paymentPubkey)` for single agreement fetch. All hooks are wallet-aware (enabled only when program is non-null) and handle BN-to-number conversion for Anchor 0.32's runtime types.

Built `ConditionCard` component that renders all 5 condition types (TimeBased, Oracle, TokenGated, Multisig, Webhook) with type-specific metadata displays: formatted dates with relative labels for time locks, comparison operator symbols with scaled target values for oracles, truncated pubkeys for token gates and webhooks, and approval progress for multisig. Each card has met/pending status badge and an empty `data-testid="crank-action-{index}"` slot for T03 crank buttons.

Created `AgreementsClient` with shadcn Table showing truncated pubkeys, type badges, formatted amounts, status badges, and each row as a Next.js Link to `/agreements/{pubkey}`. The detail page at `/agreements/[id]` shows a payment header card with all account fields and a conditions grid organized by milestone.

Both pages handle four UI states: disconnected (connect wallet prompt), loading (skeleton rows/cards), error (message display), and populated (data table/cards).

Replaced the old hardcoded agreements page with the new client component. Build passes clean with zero errors.

## Verification

All 5 T02-specific verification checks pass. Slice-level checks for crank mutations and error decoder correctly fail (T03 scope).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run build` | 0 | ✅ pass | ~2s |
| 2 | `test -f app/web/src/app/(console)/agreements/[id]/page.tsx` | 0 | ✅ pass | <1s |
| 3 | `test -f app/web/src/lib/queries/conditions.ts` | 0 | ✅ pass | <1s |
| 4 | `test -f app/web/src/components/condition-card.tsx` | 0 | ✅ pass | <1s |
| 5 | `grep -q "useConditions" app/web/src/lib/queries/conditions.ts` | 0 | ✅ pass | <1s |

### Slice-level checks (partial — expected for T02)

| # | Command | Exit Code | Verdict | Notes |
|---|---------|-----------|---------|-------|
| 6 | `cd app/web && bun run build` | 0 | ✅ pass | |
| 7 | `test -f app/web/src/app/(console)/agreements/[id]/page.tsx` | 0 | ✅ pass | |
| 8 | `test -f app/web/src/lib/queries/conditions.ts` | 0 | ✅ pass | |
| 9 | `test -f app/web/src/lib/mutations/crank-time.ts` | 1 | ⏳ T03 | |
| 10 | `test -f app/web/src/lib/mutations/crank-oracle.ts` | 1 | ⏳ T03 | |
| 11 | `test -f app/web/src/lib/mutations/crank-token-gate.ts` | 1 | ⏳ T03 | |
| 12 | `test -f app/web/src/lib/errors.ts` | 1 | ⏳ T03 | |
| 13 | `grep crank hooks in detail page` | 1 | ⏳ T03 | |

## Diagnostics

- Connect wallet on devnet, navigate to `/agreements` — table populates from on-chain data
- Click any row → detail page at `/agreements/[pubkey]` shows payment header + condition cards
- React Query devtools: inspect `["agreements"]`, `["conditions", pubkey]`, `["payment", pubkey]` cache entries
- ConditionCard renders `data-testid="crank-action-{index}"` empty div — T03 fills with crank buttons

## Deviations

- Added file-level eslint-disable for `no-unsafe-*` and `no-explicit-any` rules in query files. Anchor's `Program<Idl>` returns untyped account accessors, making these suppressions unavoidable. This matches the T01 pattern of casting IDL as `Idl` rather than fighting the type system.

## Known Issues

- `formatTokenAmount` in agreements-client.tsx wraps raw numbers in a `{ toString }` object to match the helper signature — could be simplified to accept plain numbers directly.
- ConditionCard `_paymentPubkey` prop is destructured with underscore prefix to suppress lint — it will be used by T03 crank buttons.

## Files Created/Modified

- `app/web/src/lib/queries/agreements.ts` — useAgreements() hook, truncatePubkey, formatTokenAmount helpers
- `app/web/src/lib/queries/conditions.ts` — useConditions(), usePaymentDetail() hooks with condition enum parsing
- `app/web/src/components/condition-card.tsx` — ConditionCard rendering all 5 types with metadata and status badges
- `app/web/src/components/agreements-client.tsx` — agreements list with shadcn Table, clickable rows, 4 UI states
- `app/web/src/app/(console)/agreements/[id]/page.tsx` — agreement detail page with payment header + conditions grid
- `app/web/src/app/(console)/agreements/page.tsx` — rewired to use AgreementsClient (replaced hardcoded data)
- `.gsd/milestones/M003/slices/S01/tasks/T02-PLAN.md` — added Observability Impact section (pre-flight fix)
