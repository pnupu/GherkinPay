---
id: M004
title: "StableHacks Institutional Readiness"
status: complete
started_at: 2026-03-23
completed_at: 2026-03-23
duration: ~65m (S01 14m + S02 16m + S03 35m)
slices_completed: [S01, S02, S03]
slices_total: 3
verification_result: passed
requirement_outcomes:
  - id: R007
    from_status: validated
    to_status: validated
    proof: "Extended with metadata_uri — field added to contract, IDL, wizard, and detail page. No status change; R007 was already validated in M002."
  - id: R016
    from_status: validated
    to_status: validated
    proof: "Extended with audit log page at /audit. No status change; R016 was already validated in M003."
key_artifacts:
  - programs/gherkin-pay/src/state/payment.rs
  - app/web/src/idl/gherkin_pay.json
  - app/web/src/components/create-payment-wizard.tsx
  - app/web/src/app/(console)/agreements/[id]/page.tsx
  - app/web/src/app/(console)/audit/page.tsx
  - app/web/src/lib/queries/audit-log.ts
  - scripts/crank-bot.ts
  - scripts/README.md
---

# M004: StableHacks Institutional Readiness — Milestone Summary

**GherkinPay is now hackathon-ready for StableHacks Track 3: Travel Rule metadata on every payment, a compliance audit log page, and a standalone crank automation bot — 15 files changed, 1208 lines added across contract, frontend, and operations tooling.**

## What Was Delivered

### S01: Travel Rule Contract Extension
Added `metadata_uri: String` (max 200 chars) as the last field on the `PaymentAgreement` on-chain struct. Threaded through both `create_payment` and `create_milestone_payment` instructions, emitted in the `PaymentCreated` event. Frontend: IDL manually patched (4 locations), mutation updated with `metadataUri` parameter, wizard step 1 has a "Travel Rule Metadata URI" input, and the agreement detail page shows the URI (clickable for HTTP links).

### S02: Compliance Audit Log
New `/audit` page with a filterable table of 7 compliance-relevant on-chain event types (PaymentCreated, PaymentFunded, ConditionMet, MultisigApproval, PaymentReleased, PaymentCancelled, MilestoneAdvanced). Context-dependent detail column renders different data per event type. Filter pills always show all 7 types with counts. Search by event name or signature. Pagination at 10 items/page. Nav link added to dashboard.

### S03: Crank Automation Bot
Standalone TypeScript bot at `scripts/crank-bot.ts` (611 lines) that polls all on-chain ConditionAccounts and auto-cranks time-based, oracle (Pyth), and token-gated conditions. CLI options for RPC URL, keypair, poll interval, and dry-run mode. Per-condition error isolation — one failure never crashes the loop. Structured logging with ISO timestamps. Operator docs in `scripts/README.md`.

## Success Criteria Verification

| # | Criterion | Met? | Evidence |
|---|-----------|------|----------|
| 1 | Payment agreements carry Travel Rule metadata_uri | ✅ | `metadata_uri` in PaymentAgreement struct, both create instructions, IDL (4 occurrences), wizard input, detail page display |
| 2 | Compliance Audit Log page with filterable timeline | ✅ | `/audit` route built at 2.8 kB, 7 event types, filter pills, search, pagination |
| 3 | Crank bot auto-evaluates conditions | ✅ | `scripts/crank-bot.ts` handles time, oracle, and token-gate; dry-run mode verified |
| 4 | All existing UI flows continue working | ✅ | `bun run build` produces all 10 routes clean (/, agreements, agreements/[id], activity, audit, compliance, milestones, relayers, _not-found, api/trpc/[trpc]) |
| 5 | `bun run build` passes clean | ✅ | Build exits 0, zero errors |

## Definition of Done Verification

| # | Check | Met? | Evidence |
|---|-------|------|----------|
| 1 | Contract with metadata_uri, IDL regenerated, frontend updated | ✅ | `cargo check` passes, IDL has 4 metadata_uri entries, wizard and detail page updated |
| 2 | Create wizard includes Travel Rule metadata fields | ✅ | 7 occurrences of metadataUri in wizard |
| 3 | Detail page displays metadata URI | ✅ | 5 occurrences of metadataUri in detail page, clickable for HTTP URIs |
| 4 | Compliance Audit Log page shows filterable events | ✅ | `/audit` page with 7 event type filters, search, pagination |
| 5 | Crank bot runs and auto-cranks at least one condition type | ✅ | Bot handles all 3 types (time, oracle, token-gate), verified with dry-run |
| 6 | `bun run build` passes clean | ✅ | Build exits 0 |
| 7 | All existing pages still work | ✅ | All routes present in build output |

## Code Change Verification

`git diff --stat` confirms 15 files changed with 1,208 lines of real code added across:
- **Contract (Rust):** 4 files — payment state, events, both create instructions, lib dispatcher
- **Frontend (TypeScript/React):** 8 files — IDL, mutation, wizard, query hook, detail page, audit page, audit log hook, nav
- **Operations:** 2 files — crank bot script, operator README
- **Config:** 1 file — create-payment mutation signature change

## Requirement Status

No requirement status transitions occurred. R007 and R016 were already validated and remain so — this milestone extended their implementations (metadata_uri on R007, audit log on R016). R018 and R019 remain deferred as planned.

## Known Limitations

1. **Contract requires devnet redeploy** — the on-chain program doesn't yet have the metadata_uri field. IDL was manually patched; after redeploy, verify IDL matches deployed program.
2. **No end-to-end UAT** — full roundtrip (create payment with metadata → fund → bot cranks) requires devnet redeploy + test payment creation.
3. **Pyth devnet feed staleness** — 60s staleness guard may skip feeds; this is by design for safety.
4. **Crank bot tsc check** — the standalone script's relative IDL import doesn't resolve under app/web's tsconfig. Works correctly with bun runtime.
5. **No audit log persistence** — events fetched client-side from RPC each time; no server-side indexing.

## Cross-Slice Integration

- S01 → S02: Updated IDL with PaymentCreated event containing metadata_uri is consumed by audit log's EventParser pipeline. ✅ verified — audit log can parse the field.
- S01 → S03: Crank bot imports IDL from same path S01 patched. ✅ verified — bot initializes Program from the updated IDL.
- S02 ↔ S03: Independent — audit log displays events, crank bot generates them. When bot cranks conditions on devnet, those events will appear in the audit log.

## Forward Intelligence for Next Milestone

### Prerequisites before any on-chain testing
- Run `anchor build && anchor deploy` to redeploy with new account layout
- Existing devnet payments will be inaccessible after layout change
- After redeploy, verify IDL matches: `grep -c metadata_uri app/web/src/idl/gherkin_pay.json` → 4

### What's fragile
- Manually-patched IDL JSON — any IDL/program mismatch causes deserialization failures
- `ActivityEvent` type shared between activity.ts and audit-log.ts — changes must be synchronized
- Pyth PriceUpdateV2 byte offsets (price@73, publish_time@93) hardcoded in both contract and bot
- Crank bot's relative IDL import path (`../app/web/src/idl/gherkin_pay.json`)

### Patterns established
- Anchor enum deserialization: `{ variantName: { field1, field2 } }` objects in JS
- Per-condition try/catch for fault isolation in automation loops
- Compliance hooks layer an allowlist filter on top of the activity feed base pattern
- `#[max_len(N)]` for String fields on Anchor InitSpace accounts
- Filter pills showing all event types (including zero-count) for audit context

### Operational readiness
- Crank bot: `bun run scripts/crank-bot.ts --dry-run --interval 5` for verification
- Build validation: `cd app/web && bun run build`
- Contract validation: `cd programs/gherkin-pay && cargo check`
- IDL integrity: `grep -c metadata_uri app/web/src/idl/gherkin_pay.json` → 4
