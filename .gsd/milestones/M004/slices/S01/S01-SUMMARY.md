---
id: S01
parent: M004
milestone: M004
provides:
  - metadata_uri field on PaymentAgreement on-chain account struct (#[max_len(200)])
  - metadata_uri parameter threaded through create_payment and create_milestone_payment instructions
  - metadata_uri in PaymentCreated event for indexer consumption
  - metadataUri in frontend IDL JSON (4 locations: type, 2 instructions, event)
  - metadataUri threaded through create-payment mutation (simple + milestone flows)
  - Travel Rule Metadata URI input field in create-payment wizard step 1
  - metadataUri in ParsedPaymentDetail query hook
  - Metadata URI display row on agreement detail page (clickable link for HTTP URIs)
requires: []
affects:
  - S02
  - S03
key_files:
  - programs/gherkin-pay/src/state/payment.rs
  - programs/gherkin-pay/src/events.rs
  - programs/gherkin-pay/src/instructions/create_payment.rs
  - programs/gherkin-pay/src/instructions/create_milestone_payment.rs
  - programs/gherkin-pay/src/lib.rs
  - app/web/src/idl/gherkin_pay.json
  - app/web/src/lib/mutations/create-payment.ts
  - app/web/src/components/create-payment-wizard.tsx
  - app/web/src/lib/queries/conditions.ts
  - app/web/src/app/(console)/agreements/[id]/page.tsx
key_decisions:
  - Added metadata_uri as last field after escrow_bump to minimize account layout disruption
  - Used #[max_len(200)] — sufficient for IPFS/Arweave/HTTPS URIs without wasting space
  - metadata_uri not added to #[instruction()] attributes since it's not used in PDA seeds — Anchor deserializes it regardless
  - Optional chaining for metadataUri link rendering to satisfy ESLint prefer-optional-chain rule
patterns_established:
  - String fields on Anchor InitSpace accounts use #[max_len(N)] annotation
  - Optional string fields from Anchor accounts use `?? ""` fallback in both mutation and query hook
  - Snake_case in IDL/Rust, camelCase in TypeScript — standard Anchor convention
observability_surfaces:
  - PaymentCreated event emits metadata_uri for indexer/explorer consumption
  - Agreement detail page at /agreements/[id] renders Metadata URI row; HTTP URIs clickable, empty shows "—"
  - `grep -c metadata_uri app/web/src/idl/gherkin_pay.json` returns 4 as a quick IDL integrity check
  - `bun run build` in app/web validates type-safety across the full IDL → mutation → wizard → query → detail chain
drill_down_paths:
  - .gsd/milestones/M004/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M004/slices/S01/tasks/T02-SUMMARY.md
duration: ~14 minutes
verification_result: passed
completed_at: 2026-03-23
---

# S01: Travel Rule Contract Extension

**Payment agreements now carry a Travel Rule metadata URI field end-to-end: stored on-chain via both create instructions, emitted in events, and visible in the wizard and detail page**

## What Happened

T01 added `#[max_len(200)] pub metadata_uri: String` as the last field on the `PaymentAgreement` struct, extended both `handle_create_payment` and `handle_create_milestone_payment` to accept and store it, and added it to the `PaymentCreated` event. The field was placed after `escrow_bump` to minimize layout disruption. `cargo check` passed cleanly.

T02 wired the field through the entire frontend stack: manually added `metadata_uri` to 4 locations in the IDL JSON (PaymentAgreement type, both create instruction args, PaymentCreated event), added `metadataUri?: string` to `CreatePaymentInput` with `?? ""` fallback in both simple and milestone flows, added a "Travel Rule Metadata URI" input to wizard step 1 with review display in step 3, added the field to `ParsedPaymentDetail` in the query hook, and added a Metadata URI row to the agreement detail page with clickable links for HTTP URIs. `bun run build` passed clean.

## Verification

All 7 slice-level checks passed:

| # | Check | Result |
|---|-------|--------|
| 1 | `cargo check` — contract compiles | ✅ pass |
| 2 | `metadata_uri` in `payment.rs` | ✅ pass |
| 3 | `metadata_uri` in IDL JSON | ✅ pass (4 occurrences) |
| 4 | `metadataUri` in `create-payment.ts` mutation | ✅ pass |
| 5 | `metadataUri` in `create-payment-wizard.tsx` | ✅ pass |
| 6 | `metadataUri` in detail page | ✅ pass |
| 7 | `bun run build` exits 0 | ✅ pass |

## New Requirements Surfaced

- none

## Deviations

- The `#[instruction()]` attributes were not updated to include `metadata_uri` — correct since the field isn't used in PDA seed derivation and Anchor deserializes all instruction params regardless.
- IDL was manually edited rather than generated via `anchor build` — the Anchor CLI was not available in the worktree environment. The manual edits match what `anchor build` would produce.
- Initial build hit ESLint `prefer-optional-chain` error on the detail page link check — fixed with `payment.metadataUri?.startsWith("http")`.

## Known Limitations

- Contract requires devnet redeploy before metadata_uri is usable on-chain — existing deployed program doesn't have the field. Redeploy is a prerequisite for UAT/e2e testing.
- IDL was manually patched, not generated from `anchor build` — if other contract changes happen, a full `anchor build` should regenerate the IDL from source of truth.

## Follow-ups

- Devnet redeploy with new account layout (required before any on-chain roundtrip testing)
- Existing test payments will be inaccessible after redeploy due to layout change

## Files Created/Modified

- `programs/gherkin-pay/src/state/payment.rs` — Added `#[max_len(200)] pub metadata_uri: String` to PaymentAgreement
- `programs/gherkin-pay/src/events.rs` — Added `pub metadata_uri: String` to PaymentCreated event
- `programs/gherkin-pay/src/instructions/create_payment.rs` — Added metadata_uri param, assignment, and emit field
- `programs/gherkin-pay/src/instructions/create_milestone_payment.rs` — Added metadata_uri param, assignment, and emit field
- `programs/gherkin-pay/src/lib.rs` — Threaded metadata_uri through both dispatcher functions
- `app/web/src/idl/gherkin_pay.json` — Added metadata_uri to PaymentAgreement type, both create instructions, and PaymentCreated event
- `app/web/src/lib/mutations/create-payment.ts` — Added metadataUri to CreatePaymentInput; threaded to both instruction builders
- `app/web/src/components/create-payment-wizard.tsx` — Added metadataUri state, input field, reset, review display, mutation threading
- `app/web/src/lib/queries/conditions.ts` — Added metadataUri to ParsedPaymentDetail; mapped from account data
- `app/web/src/app/(console)/agreements/[id]/page.tsx` — Added Metadata URI row with clickable link for HTTP URIs

## Forward Intelligence

### What the next slice should know
- The IDL at `app/web/src/idl/gherkin_pay.json` was manually patched — if S02 or S03 needs event types not currently in the IDL, they should either manually add them or run `anchor build` to regenerate.
- The `PaymentCreated` event now includes `metadata_uri` — S02's audit log can parse this field from transaction logs via Anchor's `EventParser`.
- S03's crank bot needs the redeployed program with the new account layout — the IDL already reflects the new struct, but the on-chain program hasn't been redeployed yet.

### What's fragile
- The manually-patched IDL JSON — any mismatch between IDL and actual deployed program will cause deserialization failures at runtime. After redeploy, verify IDL matches.
- `bun install` was required in the worktree since `node_modules` wasn't present — future worktree tasks should expect this.

### Authoritative diagnostics
- `grep -c metadata_uri app/web/src/idl/gherkin_pay.json` → must return 4 — quick IDL integrity check
- `cd app/web && bun run build` → validates the entire type chain from IDL through UI
- `cd programs/gherkin-pay && cargo check` → confirms contract compiles with the new field

### What assumptions changed
- Plan assumed `anchor build` would be available to regenerate IDL — it wasn't, so IDL was manually patched (4 additions). The result is equivalent but the source of truth remains the Rust code.
