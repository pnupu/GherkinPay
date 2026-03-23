---
id: T01
parent: S01
milestone: M004
provides:
  - metadata_uri field on PaymentAgreement account struct
  - metadata_uri parameter threaded through both create instructions
  - metadata_uri in PaymentCreated event
key_files:
  - programs/gherkin-pay/src/state/payment.rs
  - programs/gherkin-pay/src/events.rs
  - programs/gherkin-pay/src/instructions/create_payment.rs
  - programs/gherkin-pay/src/instructions/create_milestone_payment.rs
  - programs/gherkin-pay/src/lib.rs
key_decisions:
  - Added metadata_uri as last field after escrow_bump to minimize layout disruption
  - Used #[max_len(200)] for URI field — sufficient for IPFS/Arweave URIs
patterns_established:
  - String fields on Anchor InitSpace accounts use #[max_len(N)] annotation
observability_surfaces:
  - PaymentCreated event now emits metadata_uri for indexer consumption
duration: ~8 minutes
verification_result: passed
completed_at: 2026-03-23
blocker_discovered: false
---

# T01: Add metadata_uri field to contract and rebuild

**Added `metadata_uri: String` field to PaymentAgreement struct and threaded it through create_payment, create_milestone_payment instructions, and PaymentCreated event**

## What Happened

Added `#[max_len(200)] pub metadata_uri: String` as the last field on `PaymentAgreement`. Extended the `PaymentCreated` event with `metadata_uri: String`. Updated both `handle_create_payment` and `handle_create_milestone_payment` handler signatures to accept `metadata_uri: String`, store it on the payment account via `clone()`, and include it in the `emit!(PaymentCreated { ... })` call. Updated both dispatcher functions in `lib.rs` to thread the parameter through.

The `#[instruction()]` attributes on the account structs were intentionally left without `metadata_uri` since it is not referenced in seed derivation or account constraints — Anchor deserializes all instruction parameters regardless of the `#[instruction]` list.

## Verification

- `cargo check` succeeds with "Finished" — contract compiles cleanly (25 pre-existing warnings, 0 errors)
- `grep -q metadata_uri payment.rs` — field exists in struct
- `grep -c metadata_uri create_payment.rs` returns 3 (param, assignment, emit)
- `grep -c metadata_uri create_milestone_payment.rs` returns 3 (param, assignment, emit)
- `grep -q metadata_uri events.rs` — field present in PaymentCreated event

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd programs/gherkin-pay && cargo check 2>&1 \| tail -1` | 0 | ✅ pass | ~1.6s |
| 2 | `grep -q 'metadata_uri' src/state/payment.rs` | 0 | ✅ pass | <1s |
| 3 | `grep -c 'metadata_uri' src/instructions/create_payment.rs` (>=3) | 0 | ✅ pass | <1s |
| 4 | `grep -c 'metadata_uri' src/instructions/create_milestone_payment.rs` (>=3) | 0 | ✅ pass | <1s |
| 5 | `grep -q 'metadata_uri' src/events.rs` | 0 | ✅ pass | <1s |

## Diagnostics

- Inspect the on-chain account layout: `anchor idl parse` will show `metadata_uri` in the IDL (generated in later tasks)
- The `PaymentCreated` event now includes `metadata_uri`, visible to any indexer or explorer subscribing to program logs

## Deviations

- The `#[instruction()]` attributes were not updated to include `metadata_uri` since it's not used in account constraint seeds — Anchor still deserializes it from the instruction data regardless. This is correct behavior and avoids unnecessary attribute coupling.
- Initial edits partially failed because the handler `fn` signatures had different indentation than the task plan assumed — fixed with a second pass.

## Known Issues

- 25 pre-existing compiler warnings (deprecated items, unused imports) — not introduced by this task.

## Files Created/Modified

- `programs/gherkin-pay/src/state/payment.rs` — Added `#[max_len(200)] pub metadata_uri: String` to PaymentAgreement
- `programs/gherkin-pay/src/events.rs` — Added `pub metadata_uri: String` to PaymentCreated event
- `programs/gherkin-pay/src/instructions/create_payment.rs` — Added metadata_uri param, assignment, and emit field
- `programs/gherkin-pay/src/instructions/create_milestone_payment.rs` — Added metadata_uri param, assignment, and emit field
- `programs/gherkin-pay/src/lib.rs` — Threaded metadata_uri through both dispatcher functions
