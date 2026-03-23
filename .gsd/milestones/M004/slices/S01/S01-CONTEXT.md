---
id: S01
milestone: M004
status: ready
---

# S01: Travel Rule Contract Extension — Context

<!-- Slice-scoped context. Milestone-only sections (acceptance criteria, completion class,
     milestone sequence) do not belong here — those live in the milestone context. -->

## Goal

Add a `metadata_uri` field to the on-chain `PaymentAgreement` struct, pipe it through the create instructions and frontend wizard, and display decoded Travel Rule identity data on the agreement detail page — with the contract redeployed to devnet.

## Why this Slice

This is the foundational contract change that every other M004 slice depends on. S02 (Compliance Audit Log) needs the updated IDL with any new event types. S03 (Crank Bot) needs the redeployed program address and IDL for account deserialization. The contract layout change also means existing devnet payments become inaccessible, so this must land first to establish the new baseline.

## Scope

### In Scope

- Add `metadata_uri: String` field to `PaymentAgreement` struct in `programs/gherkin-pay/src/state/payment.rs`
- Add `metadata_uri` parameter to `create_payment` and `create_milestone_payment` instructions
- Include `metadata_uri` in the `PaymentCreated` event
- Regenerate IDL after contract changes
- Redeploy both programs (gherkin-pay and gherkin-pay-hook) to devnet
- Update frontend `CreatePaymentInput` and create-payment mutation to pass `metadata_uri`
- Add a dedicated "Travel Rule / Compliance" step in the create payment wizard with sender name, sender institution, receiver name, receiver institution fields
- Frontend assembles the 4 identity fields into a JSON object, base64-encodes it as a `data:` URI, and stores that string on-chain as `metadata_uri`
- Add a "Travel Rule Compliance" card on the agreement detail page that decodes the `data:` URI and displays the sender/receiver identity fields in a readable layout
- `metadata_uri` is **required** on every new payment — the wizard enforces this, the contract validates non-empty
- Verify round-trip: create a payment with metadata via the wizard → see decoded fields on the detail page

### Out of Scope

- Actual KYC provider integration (Jumio, Sumsub, etc.)
- Encryption or signing of metadata content
- External hosting (Arweave, IPFS, API endpoint) — using inline `data:` URI only
- Extended identity fields beyond name + institution (no account reference, country, LEI, etc.)
- Compliance Audit Log page (S02)
- Crank bot (S03)
- Mainnet deployment
- Migration of existing devnet payments (they become inaccessible after redeploy)

## Constraints

- Anchor 0.30 program with Token-2022 — must stay compatible
- `metadata_uri` stored as a `String` on-chain — needs `#[max_len(...)]` or equivalent space allocation in `InitSpace` derive
- Account space increase means existing `PaymentAgreement` accounts are incompatible — redeploy with new program ID or accept layout breakage
- Hackathon deadline March 29, 2026 — this slice must complete quickly to unblock S02 and S03
- `bun run build` must pass clean after all changes
- All existing UI pages (agreements, milestones, compliance, relayers, activity) must still work after redeploy

## Integration Points

### Consumes

- `programs/gherkin-pay/src/state/payment.rs` — current `PaymentAgreement` struct (adding field)
- `programs/gherkin-pay/src/instructions/create_payment.rs` — current create instruction (adding param)
- `programs/gherkin-pay/src/instructions/create_milestone_payment.rs` — current milestone create instruction (adding param)
- `programs/gherkin-pay/src/events.rs` — current `PaymentCreated` event (adding field)
- `app/web/src/lib/mutations/create-payment.ts` — current create mutation (adding metadata_uri)
- `app/web/src/app/(console)/agreements/[id]/page.tsx` — current detail page (adding compliance card)

### Produces

- Updated `PaymentAgreement` struct with `metadata_uri: String`
- Updated `create_payment` and `create_milestone_payment` instructions accepting `metadata_uri`
- Updated `PaymentCreated` event with `metadata_uri`
- Regenerated IDL JSON for both programs
- Redeployed programs on devnet
- Updated frontend create-payment mutation and wizard step
- Travel Rule Compliance card on agreement detail page

## Open Questions

- Max length for `metadata_uri` string on-chain — a base64 `data:` URI with 4 short text fields will be ~200-300 bytes; need to pick a `max_len` that's generous enough without wasting rent. Current thinking: 512 bytes should be ample.
- Whether to emit a new compliance-specific event from the contract or just extend `PaymentCreated` with the `metadata_uri` field — current thinking: extending `PaymentCreated` is simpler and sufficient for S02's audit log parsing.
