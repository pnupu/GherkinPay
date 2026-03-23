# S01: Travel Rule Contract Extension — Research

**Date:** 2026-03-23
**Depth:** Targeted

## Summary

This slice adds a `metadata_uri` string field to the on-chain `PaymentAgreement` struct, threads it through both `create_payment` and `create_milestone_payment` instructions, exposes it in the frontend create wizard and detail page, and redeploys the program to devnet. The work is straightforward — it's adding a field to an existing struct, adding a parameter to two existing instructions, regenerating the IDL, and wiring two UI components. The main risk is the account layout change forcing a redeploy that invalidates all existing test payments.

The `PaymentAgreement` struct currently has 15 fields using `#[derive(InitSpace)]`. Adding a `String` field requires `#[max_len(N)]` annotation for Anchor's `InitSpace` derivation. The `space` calculation in both `create_payment.rs` and `create_milestone_payment.rs` uses `8 + PaymentAgreement::INIT_SPACE` which will automatically pick up the new field — no manual byte counting needed.

## Recommendation

Add `metadata_uri: String` with `#[max_len(200)]` to `PaymentAgreement`. 200 bytes is sufficient for a URI (typical IPFS CIDv1 URIs are ~60 chars, HTTPS URLs rarely exceed 150). Thread it as a new parameter in both create instructions, emit it in the `PaymentCreated` event, regenerate the IDL, update the frontend mutation/wizard/detail-page, and redeploy to devnet.

## Implementation Landscape

### Key Files

**Contract (Rust):**
- `programs/gherkin-pay/src/state/payment.rs` — `PaymentAgreement` struct: add `#[max_len(200)] pub metadata_uri: String` field
- `programs/gherkin-pay/src/instructions/create_payment.rs` — `handle_create_payment()`: add `metadata_uri: String` parameter, set on payment account
- `programs/gherkin-pay/src/instructions/create_milestone_payment.rs` — `handle_create_milestone_payment()`: add `metadata_uri: String` parameter, set on payment account
- `programs/gherkin-pay/src/lib.rs` — Both `create_payment()` and `create_milestone_payment()` dispatchers: thread `metadata_uri` parameter
- `programs/gherkin-pay/src/events.rs` — `PaymentCreated` event: add `metadata_uri: String` field

**IDL & Frontend:**
- `app/web/src/idl/gherkin_pay.json` — Regenerated from `anchor build`; `PaymentAgreement` type and both instruction args gain `metadata_uri`
- `app/web/src/lib/mutations/create-payment.ts` — `CreatePaymentInput` interface: add `metadataUri: string`; mutation function: pass to both instruction builders
- `app/web/src/components/create-payment-wizard.tsx` — Add "Sender Identity URI" and "Receiver Identity URI" input fields; combine into single `metadata_uri` (e.g., JSON or `sender|receiver` format)
- `app/web/src/lib/queries/conditions.ts` — `ParsedPaymentDetail` interface and `usePaymentDetail()` fetch: add `metadataUri` field
- `app/web/src/app/(console)/agreements/[id]/page.tsx` — Detail page: render `metadataUri` in the info card

**Deploy:**
- `Anchor.toml` — Currently set to `localnet`; deploy will target devnet via CLI flag

### Build Order

1. **Contract changes first** — modify `PaymentAgreement` struct, both create instructions, event, and lib.rs dispatchers. Run `anchor build` to validate compilation and generate new IDL.
2. **Copy IDL to frontend** — replace `app/web/src/idl/gherkin_pay.json` with the freshly built IDL from `target/idl/`.
3. **Frontend mutation + types** — update `CreatePaymentInput`, `ParsedPaymentDetail`, mutation function, and query hook.
4. **Frontend UI** — add metadata fields to wizard, display in detail page.
5. **Deploy to devnet** — `anchor deploy --provider.cluster devnet`; update program address in IDL/Anchor.toml if it changes.
6. **Verify roundtrip** — create a payment with metadata_uri via the wizard, confirm it appears in the detail view.

### Verification Approach

- `anchor build` succeeds (contract compiles with new field)
- IDL JSON contains `metadata_uri` in `PaymentAgreement` type and in both `create_payment`/`create_milestone_payment` instruction args
- `cd app/web && bun run build` passes clean (frontend compiles with updated types)
- Manual E2E: create payment with metadata URI via wizard → detail page shows the URI value

## Constraints

- **Anchor 0.31.1** is the program dependency (per Cargo.toml); `#[max_len(N)]` attribute is supported in 0.30+
- **Account layout change** means all existing `PaymentAgreement` accounts on devnet become unreadable (discriminator matches but deserialization fails on the longer struct). This is expected and acceptable for devnet.
- `PaymentAgreement` uses `#[derive(InitSpace)]` — String fields require `#[max_len(N)]` annotation or build fails
- `Anchor.toml` cluster is `localnet`; deploy must use `--provider.cluster devnet` or temporarily change config
- The `space` expression `8 + PaymentAgreement::INIT_SPACE` in both create instruction `#[account(init)]` already auto-computes from `InitSpace` — no manual update needed after adding the field

## Common Pitfalls

- **Forgetting `#[max_len(200)]` on the String field** — Anchor's `InitSpace` derive fails at compile time without it. Easy to catch but would block the build.
- **Not updating both create instructions** — `create_payment` and `create_milestone_payment` are separate handlers with separate Accounts structs. Both must gain the `metadata_uri` parameter.
- **IDL copy mismatch** — After `anchor build`, the IDL at `target/idl/gherkin_pay.json` must be copied to `app/web/src/idl/gherkin_pay.json`. Forgetting this means frontend deserialization breaks.
- **Instruction argument ordering** — Anchor serializes args positionally. The new `metadata_uri` param should be added **last** in both instruction signatures to minimize confusion during review, and the frontend `program.methods.createPayment(...)` call must match the new arity.

## Open Risks

- **Anchor toolchain availability** — `anchor build` and `anchor deploy` must be installed and functional in the dev environment. If not present, the contract changes can't be verified.
- **Devnet deploy keypair** — deploying requires a funded keypair with ~2-3 SOL for program deployment rent. If the existing keypair lacks funds, an airdrop is needed first.
- **Program address may change** — if deploying as a new program (vs. upgrading), the `declare_id!()` and IDL `address` field change, requiring updates across the codebase.
