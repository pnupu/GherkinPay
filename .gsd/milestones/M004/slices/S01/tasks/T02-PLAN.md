---
estimated_steps: 5
estimated_files: 5
skills_used: []
---

# T02: Wire metadata_uri through frontend IDL, mutation, wizard, and detail page

**Slice:** S01 — Travel Rule Contract Extension
**Milestone:** M004

## Description

Thread the new `metadata_uri` field through the entire frontend stack: update the IDL JSON, add the field to the create-payment mutation, add a UI input to the wizard, extend the query hook's parsed type, and display the value on the agreement detail page. The goal is that a user can enter a Travel Rule metadata URI when creating a payment, and see it displayed on the detail page.

## Steps

1. **Update IDL** — Copy `target/idl/gherkin_pay.json` to `app/web/src/idl/gherkin_pay.json` if anchor build produced it in T01. Otherwise, manually edit the IDL JSON:
   - In the `PaymentAgreement` type's `fields` array, add `{ "name": "metadataUri", "type": "string" }` (Anchor converts snake_case to camelCase in IDL)
   - In `createPayment` instruction's `args` array, add `{ "name": "metadataUri", "type": "string" }` as the last argument
   - In `createMilestonePayment` instruction's `args` array, add `{ "name": "metadataUri", "type": "string" }` as the last argument
   - In the `PaymentCreated` event's `fields` array, add `{ "name": "metadataUri", "type": "string" }`

2. **Update mutation** (`app/web/src/lib/mutations/create-payment.ts`):
   - Add `metadataUri?: string` to `CreatePaymentInput` interface
   - In the simple payment flow, change `.createPayment(paymentId, input.totalAmount, operatorArg(input.operator))` to `.createPayment(paymentId, input.totalAmount, operatorArg(input.operator), input.metadataUri ?? "")`
   - In the milestone payment flow, change `.createMilestonePayment(paymentId, input.totalAmount, milestones.length)` to `.createMilestonePayment(paymentId, input.totalAmount, milestones.length, input.metadataUri ?? "")`

3. **Update wizard** (`app/web/src/components/create-payment-wizard.tsx`):
   - Add state: `const [metadataUri, setMetadataUri] = useState("");`
   - Reset it in `handleOpenChange`
   - Add a "Travel Rule Metadata URI" input field in step 1, below the Token Mint display section. Use `<Label>` and `<Input>` with placeholder like `"https://example.com/.well-known/travel-rule.json"`. This is optional — no validation required.
   - In `handleSubmit`, pass `metadataUri` into the mutation call for both simple and milestone paths: add `metadataUri` to the object passed to `mutation.mutate()`
   - In step 3 (review), show the metadata URI if non-empty

4. **Update query hook** (`app/web/src/lib/queries/conditions.ts`):
   - Add `metadataUri: string` to the `ParsedPaymentDetail` interface
   - In `usePaymentDetail` queryFn's return object, add `metadataUri: data.metadataUri ?? ""`

5. **Update detail page** (`app/web/src/app/(console)/agreements/[id]/page.tsx`):
   - Add a row in the `<dl>` grid for Metadata URI:
     ```
     <div>
       <dt className="text-muted-foreground">Metadata URI</dt>
       <dd className="font-mono text-xs truncate">{payment.metadataUri || "—"}</dd>
     </div>
     ```
   - If the URI is non-empty and starts with `http`, make it a clickable link

6. Run `cd app/web && bun run build` to verify clean compilation.

## Must-Haves

- [ ] IDL JSON contains `metadataUri` in PaymentAgreement type, both create instruction args, and PaymentCreated event
- [ ] `CreatePaymentInput` has `metadataUri?: string` field
- [ ] Mutation passes `metadataUri` to both `.createPayment()` and `.createMilestonePayment()` calls
- [ ] Wizard has a "Travel Rule Metadata URI" input field on step 1
- [ ] `ParsedPaymentDetail` has `metadataUri: string` field
- [ ] Detail page renders the metadata URI value
- [ ] `bun run build` passes clean

## Verification

- `cd app/web && bun run build` exits 0
- `grep -q '"metadataUri"' src/idl/gherkin_pay.json` — field in IDL
- `grep -q 'metadataUri' src/lib/mutations/create-payment.ts` — mutation has field
- `grep -q 'metadataUri' src/components/create-payment-wizard.tsx` — wizard has field
- `grep -q 'metadataUri' src/lib/queries/conditions.ts` — query hook has field
- `grep -q 'Metadata URI' src/app/\(console\)/agreements/\[id\]/page.tsx` — detail page label

## Inputs

- `programs/gherkin-pay/src/state/payment.rs` — reference for field name/position (from T01)
- `programs/gherkin-pay/src/lib.rs` — reference for instruction parameter ordering (from T01)
- `app/web/src/idl/gherkin_pay.json` — existing IDL to update
- `app/web/src/lib/mutations/create-payment.ts` — existing mutation to extend
- `app/web/src/components/create-payment-wizard.tsx` — existing wizard to add input field
- `app/web/src/lib/queries/conditions.ts` — existing query hook to extend
- `app/web/src/app/(console)/agreements/[id]/page.tsx` — existing detail page to add display

## Expected Output

- `app/web/src/idl/gherkin_pay.json` — IDL with metadataUri in types, args, and events
- `app/web/src/lib/mutations/create-payment.ts` — mutation passing metadataUri to instructions
- `app/web/src/components/create-payment-wizard.tsx` — wizard with Travel Rule Metadata URI input
- `app/web/src/lib/queries/conditions.ts` — ParsedPaymentDetail with metadataUri field
- `app/web/src/app/(console)/agreements/[id]/page.tsx` — detail page displaying metadataUri

## Observability Impact

- **Console logs**: `[GherkinPay] Creating simple/milestone payment:` log lines now include metadataUri in the mutation input object — visible in browser DevTools Console during payment creation.
- **IDL change**: The IDL JSON now declares `metadata_uri` as a string field on `PaymentAgreement`, both create instructions, and the `PaymentCreated` event. Any Anchor client deserializing accounts will see the new field.
- **UI inspection**: The agreement detail page at `/agreements/[id]` renders a "Metadata URI" row. If the URI starts with `http`, it becomes a clickable link. An empty value displays "—".
- **Build verification**: `cd app/web && bun run build` confirms the frontend compiles with the new field threaded through IDL → mutation → wizard → query hook → detail page.
