---
id: T02
parent: S01
milestone: M004
provides:
  - metadataUri field in IDL JSON (PaymentAgreement type, both create instructions, PaymentCreated event)
  - metadataUri threaded through create-payment mutation for simple and milestone flows
  - Travel Rule Metadata URI input field in create-payment wizard step 1
  - metadataUri in ParsedPaymentDetail query hook
  - Metadata URI display row on agreement detail page with clickable link for HTTP URIs
key_files:
  - app/web/src/idl/gherkin_pay.json
  - app/web/src/lib/mutations/create-payment.ts
  - app/web/src/components/create-payment-wizard.tsx
  - app/web/src/lib/queries/conditions.ts
  - app/web/src/app/(console)/agreements/[id]/page.tsx
key_decisions:
  - Used optional chaining for metadataUri link rendering to satisfy ESLint prefer-optional-chain rule
  - metadata_uri field uses snake_case in IDL (matching Anchor convention) while TypeScript uses camelCase metadataUri
patterns_established:
  - Optional string fields from Anchor accounts use `?? ""` fallback in both mutation and query hook
observability_surfaces:
  - Agreement detail page renders Metadata URI row; HTTP URIs become clickable links, empty shows "—"
  - Console logs during payment creation include metadataUri in mutation input
duration: ~6 minutes
verification_result: passed
completed_at: 2026-03-23
blocker_discovered: false
---

# T02: Wire metadata_uri through frontend IDL, mutation, wizard, and detail page

**Threaded metadataUri field through IDL JSON, create-payment mutation, wizard UI input, query hook, and agreement detail page with clean build**

## What Happened

Updated 5 frontend files to thread the `metadata_uri` field added in T01 through the entire frontend stack:

1. **IDL JSON** — Added `metadata_uri` (type `string`) to: PaymentAgreement type fields, `create_payment` instruction args, `create_milestone_payment` instruction args, and `PaymentCreated` event fields (4 additions total).

2. **Mutation** (`create-payment.ts`) — Added `metadataUri?: string` to `CreatePaymentInput`. Both simple and milestone flows now pass `input.metadataUri ?? ""` as the last argument to their respective instruction builders.

3. **Wizard** (`create-payment-wizard.tsx`) — Added `metadataUri` state with reset in `handleOpenChange`. Added a "Travel Rule Metadata URI" input field in step 1 between Total Amount and milestone fields, with placeholder and helper text. Both simple/milestone `mutation.mutate()` calls include `metadataUri`. Step 3 review shows the URI if non-empty.

4. **Query hook** (`conditions.ts`) — Added `metadataUri: string` to `ParsedPaymentDetail` interface. The `usePaymentDetail` queryFn maps `data.metadataUri ?? ""`.

5. **Detail page** (`agreements/[id]/page.tsx`) — Added a "Metadata URI" row in the `<dl>` grid. HTTP URIs render as clickable links with `target="_blank"`. Empty values display "—".

## Verification

All 7 slice-level verification checks pass:
- `cargo check` succeeds (contract compiles)
- `grep -q 'metadata_uri' programs/gherkin-pay/src/state/payment.rs` — field exists
- `grep -q 'metadata_uri' app/web/src/idl/gherkin_pay.json` — field in IDL
- `grep -q 'metadataUri' app/web/src/lib/mutations/create-payment.ts` — mutation has field
- `grep -q 'metadataUri' app/web/src/components/create-payment-wizard.tsx` — wizard has field
- `grep -q 'metadataUri' app/web/src/app/(console)/agreements/[id]/page.tsx` — detail page renders
- `bun run build` exits 0 (clean compilation + lint + type check)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd programs/gherkin-pay && cargo check 2>&1 \| tail -1` | 0 | ✅ pass | ~0.4s |
| 2 | `grep -q 'metadata_uri' programs/gherkin-pay/src/state/payment.rs` | 0 | ✅ pass | <1s |
| 3 | `grep -q 'metadata_uri' app/web/src/idl/gherkin_pay.json` | 0 | ✅ pass | <1s |
| 4 | `grep -q 'metadataUri' app/web/src/lib/mutations/create-payment.ts` | 0 | ✅ pass | <1s |
| 5 | `grep -q 'metadataUri' app/web/src/components/create-payment-wizard.tsx` | 0 | ✅ pass | <1s |
| 6 | `grep -q 'metadataUri' app/web/src/app/(console)/agreements/[id]/page.tsx` | 0 | ✅ pass | <1s |
| 7 | `cd app/web && bun run build 2>&1 \| tail -5` | 0 | ✅ pass | ~14s |

## Diagnostics

- **IDL field count**: `grep -c metadata_uri app/web/src/idl/gherkin_pay.json` should return 4.
- **UI inspection**: Visit `/agreements/[id]` to see the Metadata URI row in the agreement detail card.
- **Wizard inspection**: Open the Create Payment wizard and verify "Travel Rule Metadata URI" input appears in step 1 between Total Amount and milestone fields.
- **Build gate**: `cd app/web && bun run build` confirms type-safety across the full chain.

## Deviations

- Initial build failed with ESLint `prefer-optional-chain` error on `payment.metadataUri && payment.metadataUri.startsWith("http")` — fixed by using `payment.metadataUri?.startsWith("http")`.
- `bun install` was required in the worktree since `node_modules` was not present.

## Known Issues

None.

## Files Created/Modified

- `app/web/src/idl/gherkin_pay.json` — Added `metadata_uri` string field to PaymentAgreement type, both create instruction args, and PaymentCreated event
- `app/web/src/lib/mutations/create-payment.ts` — Added `metadataUri?: string` to CreatePaymentInput; pass it to both instruction builders
- `app/web/src/components/create-payment-wizard.tsx` — Added metadataUri state, input field in step 1, reset, review display, and mutation threading
- `app/web/src/lib/queries/conditions.ts` — Added `metadataUri: string` to ParsedPaymentDetail; mapped from account data
- `app/web/src/app/(console)/agreements/[id]/page.tsx` — Added Metadata URI row with clickable link for HTTP URIs
