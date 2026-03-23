---
estimated_steps: 5
estimated_files: 5
skills_used: []
---

# T01: Add metadata_uri field to contract and rebuild

**Slice:** S01 — Travel Rule Contract Extension
**Milestone:** M004

## Description

Add a `metadata_uri: String` field to the on-chain `PaymentAgreement` struct and thread it through both `create_payment` and `create_milestone_payment` instructions. Update the `PaymentCreated` event to include the new field. This is the foundational contract change that enables Travel Rule metadata storage.

The `PaymentAgreement` struct uses `#[derive(InitSpace)]`, so String fields require `#[max_len(N)]` annotation. The `space` calculation (`8 + PaymentAgreement::INIT_SPACE`) in both create instruction `#[account(init)]` macros auto-computes from InitSpace — no manual byte counting needed.

## Steps

1. In `programs/gherkin-pay/src/state/payment.rs`, add `#[max_len(200)] pub metadata_uri: String` as the last field in `PaymentAgreement` (before the existing `bump` and `escrow_bump` fields is fine, but after all Pubkey/u64 fields to keep layout clean — actually, add it as the **last** field after `escrow_bump` to minimize disruption).

2. In `programs/gherkin-pay/src/events.rs`, add `pub metadata_uri: String` to the `PaymentCreated` event struct.

3. In `programs/gherkin-pay/src/instructions/create_payment.rs`:
   - Add `metadata_uri: String` to the `#[instruction()]` attribute on `CreatePayment` accounts struct (append after `operator`): `#[instruction(payment_id: u64, total_amount: u64, operator: ConditionOperator, metadata_uri: String)]`
   - Add `metadata_uri: String` parameter to `handle_create_payment()` (as the last parameter)
   - Set `payment.metadata_uri = metadata_uri.clone();` (clone needed since it's used in the event too)
   - Add `metadata_uri` field to the `emit!(PaymentCreated { ... })` call

4. In `programs/gherkin-pay/src/instructions/create_milestone_payment.rs`:
   - Add `metadata_uri: String` to the `#[instruction()]` attribute: `#[instruction(payment_id: u64, total_amount: u64, milestone_count: u8, metadata_uri: String)]`
   - Add `metadata_uri: String` parameter to `handle_create_milestone_payment()` (as the last parameter)
   - Set `payment.metadata_uri = metadata_uri.clone();`
   - Add `metadata_uri` field to the `emit!(PaymentCreated { ... })` call

5. In `programs/gherkin-pay/src/lib.rs`, update both dispatcher functions to thread the new parameter:
   - `create_payment(ctx, payment_id, total_amount, operator, metadata_uri: String)` — pass `metadata_uri` to handler
   - `create_milestone_payment(ctx, payment_id, total_amount, milestone_count, metadata_uri: String)` — pass `metadata_uri` to handler

6. Run `cargo check` (or `anchor build` if available) from the `programs/gherkin-pay` directory to verify compilation.

## Must-Haves

- [ ] `PaymentAgreement` has `#[max_len(200)] pub metadata_uri: String` field
- [ ] Both `create_payment` and `create_milestone_payment` accept `metadata_uri: String` as the last parameter
- [ ] Both handlers set `payment.metadata_uri` from the parameter
- [ ] `PaymentCreated` event includes `metadata_uri: String`
- [ ] Both `emit!()` calls include `metadata_uri`
- [ ] `cargo check` succeeds (contract compiles)

## Verification

- `cd programs/gherkin-pay && cargo check 2>&1 | tail -3` — shows "Finished" with no errors
- `grep -q 'metadata_uri' src/state/payment.rs` — field exists
- `grep -c 'metadata_uri' src/instructions/create_payment.rs` returns >= 3 (instruction attr, param, assignment)
- `grep -c 'metadata_uri' src/instructions/create_milestone_payment.rs` returns >= 3

## Inputs

- `programs/gherkin-pay/src/state/payment.rs` — current PaymentAgreement struct to extend
- `programs/gherkin-pay/src/instructions/create_payment.rs` — create_payment handler to add parameter
- `programs/gherkin-pay/src/instructions/create_milestone_payment.rs` — create_milestone_payment handler to add parameter
- `programs/gherkin-pay/src/events.rs` — PaymentCreated event to extend
- `programs/gherkin-pay/src/lib.rs` — dispatcher functions to thread new parameter

## Expected Output

- `programs/gherkin-pay/src/state/payment.rs` — PaymentAgreement with metadata_uri field
- `programs/gherkin-pay/src/instructions/create_payment.rs` — handler accepts and stores metadata_uri
- `programs/gherkin-pay/src/instructions/create_milestone_payment.rs` — handler accepts and stores metadata_uri
- `programs/gherkin-pay/src/events.rs` — PaymentCreated includes metadata_uri
- `programs/gherkin-pay/src/lib.rs` — dispatchers thread metadata_uri to handlers
