---
estimated_steps: 5
estimated_files: 7
---

# T02: Create agreement detail page with useConditions() hook and condition card rendering

**Slice:** S01 — Permissionless Cranks
**Milestone:** M003

## Description

Build the agreement detail page at `/agreements/[id]` — the central surface for all M003 condition interactions. The route uses the payment's base58 pubkey as the URL parameter (D010). The page fetches the PaymentAgreement account and its ConditionAccount(s), then renders condition cards with type-specific metadata. This task also wires up the agreements list page with clickable rows linking to the detail view.

The ConditionCard component must render all 5 condition types (time, oracle, token gate, multisig, webhook) with type-appropriate metadata display. Crank action buttons are added in T03 — this task focuses on data fetching and presentation.

From M001/S03 summary:
- Query hooks live in `lib/queries/` with one file per domain
- Status enum extraction via `Object.keys(account.status)[0]` with config lookup
- BN amount formatting via Intl.NumberFormat after dividing by 1e6 (USDC decimals)
- Pubkey truncation as first4…last4 for counterparty display
- Wallet-aware queries: enabled only when program is non-null

From M001/S03 summary:
- Cast `Program<Idl>` to `Program<GherkinPay>` at query hook level (Anchor 0.32 type issue)

**Relevant skills:** react-best-practices, frontend-design

## Steps

1. Create `app/web/src/lib/queries/agreements.ts` with `useAgreements()` React Query hook. Fetches all PaymentAgreement accounts via `program.account.paymentAgreement.all()`. Query key: `["agreements"]`. Enabled only when program is non-null. Returns parsed accounts with pubkey, authority, payer, payee, tokenMint, totalAmount, status, isMilestone, milestoneCount, currentMilestone, createdAt.

2. Create `app/web/src/lib/queries/conditions.ts` with `useConditions(paymentPubkey: string)` React Query hook. Fetches ConditionAccount(s) for a specific payment using `program.account.conditionAccount.all()` with a memcmp filter on the payment field (offset 8, 32 bytes). Query key: `["conditions", paymentPubkey]`. Returns parsed conditions array with milestoneIndex, milestoneStatus, operator, conditions (the Condition enum variants), isFinalized. Also export a `usePaymentDetail(paymentPubkey: string)` hook that fetches a single PaymentAgreement by pubkey using `program.account.paymentAgreement.fetch()`.

3. Create `app/web/src/components/condition-card.tsx` — a React component rendering a single condition. Props: condition (parsed Condition enum variant), index (number), paymentPubkey (string). Uses shadcn Card with: type badge (TimeBased, Oracle, TokenGated, Multisig, Webhook), met/unmet status badge (green for met, amber for pending), type-specific metadata:
   - TimeBased: unlock_at formatted as date, "past" or "in X days" relative label
   - Oracle: feed_account (truncated pubkey), operator symbol (>, >=, <, <=, ==), target_value with decimals, met status
   - TokenGated: required_mint (truncated), min_amount, holder (truncated)
   - Multisig: signer count, threshold, approval progress "N of M signed"
   - Webhook: relayer (truncated), event_hash (hex, first 8 chars)
   Include an empty action button area (div with data-testid="crank-action-{index}") that T03 will fill.

4. Create `app/web/src/components/agreements-client.tsx` — client component for the agreements list page. Uses useAgreements() hook, renders shadcn Table with columns: ID (truncated pubkey), Payer, Payee, Type (simple/milestone), Amount, Status (badge), Created. Each row is a Next.js Link to `/agreements/{pubkey}`. Handle four states: disconnected (connect prompt), loading (Skeleton rows), empty (informational message), populated (table).

5. Create `app/web/src/app/(console)/agreements/[id]/page.tsx` — the detail page. Reads `params.id` (base58 pubkey). Uses usePaymentDetail() and useConditions(). Renders: back link to /agreements, payment header (ID, payer, payee, amount, status, type), condition cards grid. Handle loading/error/not-found states. Update `app/web/src/app/(console)/agreements/page.tsx` to use AgreementsClient component.

## Must-Haves

- [ ] `useConditions(paymentPubkey)` fetches ConditionAccount data with memcmp filter
- [ ] `usePaymentDetail(paymentPubkey)` fetches single PaymentAgreement by pubkey
- [ ] ConditionCard renders all 5 condition types with type-specific metadata
- [ ] Agreement list page has clickable rows linking to `/agreements/[pubkey]`
- [ ] Detail page shows payment header + condition cards
- [ ] Four UI states handled (disconnected, loading, error, populated) on both pages
- [ ] `bun run build` exits 0

## Verification

- `cd app/web && bun run build` exits 0
- `test -f app/web/src/app/\(console\)/agreements/\[id\]/page.tsx` — detail route exists
- `test -f app/web/src/lib/queries/conditions.ts` — conditions hook exists
- `test -f app/web/src/components/condition-card.tsx` — card component exists
- `grep -q "useConditions" app/web/src/lib/queries/conditions.ts` — hook exported

## Inputs

- `app/web/src/lib/anchor.ts` — useAnchorProgram() hook from T01
- `app/web/src/lib/pda.ts` — PDA derivation helpers from T01
- `app/web/src/lib/utils.ts` — cn() utility from T01
- `app/web/src/types/gherkin_pay.ts` — TypeScript types from T01
- `app/web/src/idl/gherkin_pay.json` — IDL from T01
- `app/web/src/components/ui/card.tsx` — shadcn Card from T01
- `app/web/src/components/ui/badge.tsx` — shadcn Badge from T01
- `app/web/src/components/ui/table.tsx` — shadcn Table from T01
- `app/web/src/components/ui/skeleton.tsx` — shadcn Skeleton from T01
- `app/web/src/app/(console)/agreements/page.tsx` — existing agreements page to rewrite
- `programs/gherkin-pay/src/state/condition.rs` — ConditionAccount layout reference

## Expected Output

- `app/web/src/lib/queries/agreements.ts` — useAgreements() query hook
- `app/web/src/lib/queries/conditions.ts` — useConditions() and usePaymentDetail() query hooks
- `app/web/src/components/condition-card.tsx` — type-specific condition card component
- `app/web/src/components/agreements-client.tsx` — agreements list client component with clickable rows
- `app/web/src/app/(console)/agreements/[id]/page.tsx` — agreement detail page
- `app/web/src/app/(console)/agreements/page.tsx` — updated to use AgreementsClient
