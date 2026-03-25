# S03: Devnet Deploy & Smoke Test — Research

**Date:** 2026-03-23
**Depth:** Light — straightforward deployment and sync using established tooling

## Summary

This slice deploys the already-built program to devnet, syncs the frontend types file, and smoke-tests the full stack. The heavy lifting (build, tests) is done in S01/S02. The generated IDL JSON (`target/idl/gherkin_pay.json`) already matches the frontend IDL (`app/web/src/idl/gherkin_pay.json`) — zero diff. However, the TypeScript types file at `app/web/src/types/gherkin_pay.ts` is stale: it's missing all 4 `metadataUri` fields and uses the old name `"triggerPay"` instead of `"gherkinPay"`. The program is already deployed to devnet at `2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV` with the local keypair (`nnAH8phxSRgVSez4hFonzQh5ZC4LeWsTTz5koSsqv5U`) as upgrade authority and ~8 SOL balance — more than enough for redeployment of the 413K binary.

## Recommendation

Execute in three phases: (1) deploy to devnet with `anchor deploy --provider.cluster devnet`, (2) sync the stale types file by copying `target/types/gherkin_pay.ts` → `app/web/src/types/gherkin_pay.ts` and verify `bun run build` passes in `app/web/`, (3) smoke-test frontend payment creation with metadata_uri and crank bot startup against devnet. The IDL JSON needs no changes — it's already synced.

## Implementation Landscape

### Key Files

- `target/deploy/gherkin_pay.so` (413K) — built program binary, ready for devnet deploy
- `target/deploy/gherkin_pay-keypair.json` — program keypair matching `2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV`
- `target/idl/gherkin_pay.json` — generated IDL with metadata_uri (4 occurrences) — already matches frontend copy
- `app/web/src/idl/gherkin_pay.json` — frontend IDL copy — already in sync, no changes needed
- `target/types/gherkin_pay.ts` — generated TS types with `metadataUri` (4 occurrences), name `"gherkinPay"`
- `app/web/src/types/gherkin_pay.ts` — **STALE** — missing `metadataUri` (0 occurrences), uses name `"triggerPay"` — must be replaced with generated version
- `Anchor.toml` — localnet config; deploy needs `--provider.cluster devnet` override
- `scripts/crank-bot.ts` — imports IDL from `app/web/src/idl/gherkin_pay.json` (already synced)
- `app/web/src/components/create-payment-wizard.tsx` — already wires `metadataUri` field into create flow
- `app/web/src/app/(console)/agreements/[id]/page.tsx` — already renders `metadataUri` in detail view
- `app/web/src/lib/mutations/create-payment.ts` — passes `metadataUri` as 4th arg to both `createPayment` and `createMilestonePayment`

### Build Order

1. **Deploy to devnet** — `anchor deploy --provider.cluster devnet -p gherkin_pay`. This is the gating step; everything else depends on the live program. The existing program at the same address has upgrade authority matching the local keypair, so this is a program upgrade (not fresh deploy). ~8 SOL available, program is 413K — well within limits.

2. **Sync types file** — Copy `target/types/gherkin_pay.ts` to `app/web/src/types/gherkin_pay.ts`. The diff shows:
   - Name change: `"triggerPay"` → `"gherkinPay"` (line 10)
   - 4 missing `metadataUri` fields in createPayment args, createMilestonePayment args, PaymentAgreement type, and PaymentCreated event
   - Straight file copy is safe since the generated types are the source of truth

3. **Verify frontend build** — `cd app/web && bun run build`. This confirms the synced types don't break any imports or type references. The frontend already uses `metadataUri` throughout (wizard, detail page, mutations, queries).

4. **Smoke test: frontend payment creation** — Start dev server (`cd app/web && bun run dev`), create a payment with a metadata_uri value through the wizard, verify it appears in the agreement detail page. This proves R026.

5. **Smoke test: crank bot** — `bun run scripts/crank-bot.ts --dry-run` against devnet. The bot imports the already-synced IDL and should connect, deserialize accounts, and log structured output. This proves operational readiness.

### Verification Approach

- `anchor deploy --provider.cluster devnet` exits 0 → R025 proven
- `solana program show 2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV` shows updated slot → confirms new binary deployed
- `diff target/types/gherkin_pay.ts app/web/src/types/gherkin_pay.ts` returns empty → types synced
- `grep -c metadataUri app/web/src/types/gherkin_pay.ts` returns 4 → all metadata_uri fields present in types
- `cd app/web && bun run build` exits 0 → frontend compiles with synced types/IDL
- Payment created via UI with metadata_uri visible in detail page → R026 proven
- `bun run scripts/crank-bot.ts --dry-run` connects and logs account scan → operational readiness

## Constraints

- Anchor.toml is configured for localnet — deploy must use `--provider.cluster devnet` flag
- Deploy authority is the local keypair at `~/.config/solana/id.json` — same key that owns the existing program
- Program binary is 413K; existing on-chain program data is 417K — upgrade will fit without extending
- `bun run build` must run from `app/web/`, not repo root (no root build script)
- Crank bot uses `import idl from "../app/web/src/idl/gherkin_pay.json"` — path is relative to repo root

## Common Pitfalls

- **Types file copy might have import issues** — the generated `target/types/gherkin_pay.ts` is a standalone type export. The frontend imports `GherkinPay` type from it. Verify the export name matches after copy (it exports `type GherkinPay`).
- **Devnet RPC rate limits** — if smoke tests hit 429s, wait and retry. The default devnet RPC is rate-limited.
- **Existing devnet payments will break** — the account layout changed (added metadata_uri). Old PaymentAgreement accounts won't deserialize. This is expected and noted in the roadmap.
