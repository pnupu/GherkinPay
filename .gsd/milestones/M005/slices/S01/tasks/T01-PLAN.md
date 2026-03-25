---
estimated_steps: 3
estimated_files: 3
skills_used: []
---

# T01: Build contract and verify IDL generation

**Slice:** S01 — Contract Rebuild & Test Fixup
**Milestone:** M005

## Description

No build artifacts exist in this worktree (`target/types/` and `target/idl/` are missing). Run `anchor build` to compile both programs (`gherkin-pay` and `gherkin-pay-hook`) and generate the IDL and TypeScript types that the test suite imports. This retires the "Anchor build compatibility" risk from the roadmap.

The worktree also lacks `node_modules` — run `bun install` first (KNOWLEDGE.md: "Worktrees need bun install").

## Steps

1. Run `bun install` at the repo root to install dependencies (worktrees don't share node_modules)
2. Run `anchor build` — this compiles both programs and generates `target/types/gherkin_pay.ts` and `target/idl/gherkin_pay.json`
3. If `anchor build` fails, read the error output carefully. Common issues: missing Rust toolchain components, version mismatches. Debug and retry.
4. Verify the generated IDL contains `metadata_uri` in the expected 4 locations: PaymentAgreement type definition, create_payment instruction args, create_milestone_payment instruction args, and PaymentCreated event fields. Run `grep -c metadata_uri target/idl/gherkin_pay.json` — it should return 4.
5. Verify `target/types/gherkin_pay.ts` exists and contains metadata_uri: `grep -c metadata_uri target/types/gherkin_pay.ts` should return ≥ 1.

## Must-Haves

- [ ] `anchor build` exits 0
- [ ] `target/idl/gherkin_pay.json` exists and contains metadata_uri (4 occurrences)
- [ ] `target/types/gherkin_pay.ts` exists and contains metadata_uri

## Verification

- `anchor build` exits 0
- `grep -c metadata_uri target/idl/gherkin_pay.json` returns 4
- `test -f target/types/gherkin_pay.ts && grep -q metadata_uri target/types/gherkin_pay.ts`

## Observability Impact

- **New artifact:** `target/idl/gherkin_pay.json` becomes the canonical IDL — future agents inspect it via `jq` to verify instruction signatures and type definitions.
- **New artifact:** `target/types/gherkin_pay.ts` — TypeScript type bindings imported by tests; existence confirms successful codegen.
- **Failure visibility:** Build failure produces Rust compiler diagnostics on stderr with file:line references. A future agent can re-run `anchor build 2>&1 | tail -50` to see the last errors.
- **Inspection surface:** `grep metadata_uri target/idl/gherkin_pay.json` confirms the field propagated through the IDL generator.

## Inputs

- `programs/gherkin-pay/src/lib.rs` — contract source with metadata_uri parameter
- `programs/gherkin-pay/src/state/payment.rs` — PaymentAgreement struct with metadata_uri field
- `programs/gherkin-pay-hook/` — second program in workspace, must also compile
- `Anchor.toml` — workspace config defining both programs
- `package.json` — root dependencies for bun install

## Expected Output

- `target/idl/gherkin_pay.json` — generated IDL with metadata_uri in 4 locations
- `target/types/gherkin_pay.ts` — generated TypeScript types with metadata_uri
- `target/deploy/gherkin_pay.so` — compiled program binary
