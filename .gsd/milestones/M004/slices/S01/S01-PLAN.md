# S01: Travel Rule Contract Extension

**Goal:** Payment agreements carry a `metadata_uri` field storing Travel Rule identity metadata, threaded from contract through the create wizard to the detail page.
**Demo:** A payment created via the wizard includes a Travel Rule metadata URI that is stored on-chain and displayed in the agreement detail view. Contract redeployed to devnet with the new account layout.

## Must-Haves

- `PaymentAgreement` struct has `metadata_uri: String` field with `#[max_len(200)]`
- Both `create_payment` and `create_milestone_payment` instructions accept and store `metadata_uri`
- `PaymentCreated` event includes `metadata_uri`
- `anchor build` succeeds with new field
- IDL regenerated and copied to frontend
- `CreatePaymentInput` includes `metadataUri` field, mutation passes it to both instruction builders
- Create wizard has a "Travel Rule Metadata URI" input field on step 1
- `ParsedPaymentDetail` includes `metadataUri`, detail page renders it
- `cd app/web && bun run build` passes clean

## Proof Level

- This slice proves: integration
- Real runtime required: yes (devnet deploy + wallet interaction for full proof)
- Human/UAT required: yes (wallet signing required for on-chain roundtrip)

## Verification

- `cd programs/gherkin-pay && cargo check 2>&1 | tail -1` — outputs "Finished" (contract compiles)
- `grep -q 'metadata_uri' programs/gherkin-pay/src/state/payment.rs` — field exists in struct
- `grep -q 'metadata_uri' app/web/src/idl/gherkin_pay.json` — field present in IDL
- `grep -q 'metadataUri' app/web/src/lib/mutations/create-payment.ts` — mutation accepts it
- `grep -q 'metadataUri' app/web/src/components/create-payment-wizard.tsx` — wizard has the field
- `grep -q 'metadataUri' app/web/src/app/\(console\)/agreements/\[id\]/page.tsx` — detail page renders it
- `cd app/web && bun run build 2>&1 | tail -5` — exits 0

## Integration Closure

- Upstream surfaces consumed: existing `PaymentAgreement` struct, `create_payment` / `create_milestone_payment` instructions, `PaymentCreated` event, IDL, frontend mutation/wizard/query/detail-page
- New wiring introduced in this slice: `metadata_uri` parameter threaded from wizard → mutation → on-chain instruction → stored account → query hook → detail page
- What remains before the milestone is truly usable end-to-end: S02 (audit log page), S03 (crank bot); existing flows unaffected

## Observability / Diagnostics

- **On-chain**: `PaymentCreated` event now emits `metadata_uri` — any indexer or explorer subscribing to program logs can capture the Travel Rule URI at creation time.
- **Frontend console**: `[GherkinPay] Creating simple/milestone payment:` logs fire during payment creation with the full mutation input including `metadataUri`.
- **Detail page**: The agreement detail view at `/agreements/[id]` renders the Metadata URI value; HTTP URIs are clickable links, empty values show "—".
- **IDL verification**: `grep -c metadata_uri app/web/src/idl/gherkin_pay.json` should return 4 (PaymentAgreement type + 2 instructions + PaymentCreated event).
- **Build gate**: `cd app/web && bun run build` must pass — this verifies type-safety across the entire IDL → mutation → wizard → query → detail-page chain.
- **Redaction**: No PII is stored in `metadata_uri` — it's a URI pointing to externally-hosted Travel Rule metadata, not the metadata itself.

## Tasks

- [x] **T01: Add metadata_uri field to contract and rebuild** `est:45m`
  - Why: The on-chain struct and both create instructions must accept and store the Travel Rule metadata URI before the frontend can use it. This is the foundational contract change for the entire slice.
  - Files: `programs/gherkin-pay/src/state/payment.rs`, `programs/gherkin-pay/src/instructions/create_payment.rs`, `programs/gherkin-pay/src/instructions/create_milestone_payment.rs`, `programs/gherkin-pay/src/events.rs`, `programs/gherkin-pay/src/lib.rs`
  - Do: Add `#[max_len(200)] pub metadata_uri: String` to `PaymentAgreement`. Add `metadata_uri: String` parameter to both `handle_create_payment` and `handle_create_milestone_payment` (and their dispatcher functions in `lib.rs`). Set `payment.metadata_uri = metadata_uri` in both handlers. Add `metadata_uri: String` to `PaymentCreated` event and include it in both `emit!()` calls. Add `metadata_uri` to the `#[instruction()]` attribute on both `CreatePayment` and `CreateMilestonePayment` structs. Run `anchor build` (or `cargo check` if anchor CLI unavailable) to verify compilation. If `anchor build` succeeds, the IDL at `target/idl/gherkin_pay.json` is ready for T02.
  - Verify: `cd programs/gherkin-pay && cargo check` succeeds; `grep -q 'metadata_uri' src/state/payment.rs`
  - Done when: Contract compiles with the new `metadata_uri` field on `PaymentAgreement`, both create instructions accept and store it, and the event includes it.

- [x] **T02: Wire metadata_uri through frontend IDL, mutation, wizard, and detail page** `est:1h`
  - Why: The frontend must thread the new field end-to-end: IDL types → mutation → wizard UI → query hook → detail display. Without this, the contract change is invisible to users.
  - Files: `app/web/src/idl/gherkin_pay.json`, `app/web/src/lib/mutations/create-payment.ts`, `app/web/src/components/create-payment-wizard.tsx`, `app/web/src/lib/queries/conditions.ts`, `app/web/src/app/(console)/agreements/[id]/page.tsx`
  - Do: (1) Copy the rebuilt IDL from `target/idl/gherkin_pay.json` to `app/web/src/idl/gherkin_pay.json`. If anchor build wasn't run in T01, manually add `metadata_uri` (type `string`) to the `PaymentAgreement` type definition and to both `createPayment` / `createMilestonePayment` instruction args in the IDL JSON. (2) In `create-payment.ts`: add `metadataUri?: string` to `CreatePaymentInput`; in the simple-payment flow, pass `input.metadataUri ?? ""` as the last argument to `.createPayment(paymentId, input.totalAmount, operatorArg(input.operator), input.metadataUri ?? "")`; in the milestone flow, pass it as last arg to `.createMilestonePayment(paymentId, input.totalAmount, milestones.length, input.metadataUri ?? "")`. (3) In `create-payment-wizard.tsx`: add a `metadataUri` state field; add a "Travel Rule Metadata URI" `<Input>` in step 1 (below the token mint display); pass `metadataUri` into the mutation call. (4) In `conditions.ts`: add `metadataUri: string` to `ParsedPaymentDetail`; in `usePaymentDetail` queryFn, set `metadataUri: data.metadataUri ?? ""`. (5) In the agreement detail page: render `metadataUri` in the info card grid (label "Metadata URI", value truncated with full value on hover or as a link). Run `cd app/web && bun run build` to verify clean compilation.
  - Verify: `cd app/web && bun run build` exits 0; `grep -q 'metadataUri' src/lib/mutations/create-payment.ts`; `grep -q 'Metadata URI' src/app/\(console\)/agreements/\[id\]/page.tsx`
  - Done when: Frontend builds clean with the new metadataUri field flowing from wizard input → mutation → on-chain → query → detail page display.

## Files Likely Touched

- `programs/gherkin-pay/src/state/payment.rs`
- `programs/gherkin-pay/src/instructions/create_payment.rs`
- `programs/gherkin-pay/src/instructions/create_milestone_payment.rs`
- `programs/gherkin-pay/src/events.rs`
- `programs/gherkin-pay/src/lib.rs`
- `app/web/src/idl/gherkin_pay.json`
- `app/web/src/lib/mutations/create-payment.ts`
- `app/web/src/components/create-payment-wizard.tsx`
- `app/web/src/lib/queries/conditions.ts`
- `app/web/src/app/(console)/agreements/[id]/page.tsx`
