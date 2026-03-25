---
estimated_steps: 4
estimated_files: 3
skills_used: []
---

# T01: Deploy to devnet and sync frontend types

**Slice:** S03 — Devnet Deploy & Smoke Test
**Milestone:** M005

## Description

Deploy the built gherkin_pay program to devnet (upgrading the existing program at `2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV`), then replace the stale frontend TypeScript types file with the generated version that includes metadataUri fields. Finally, install dependencies and run the frontend build to confirm everything compiles cleanly.

The IDL JSON (`app/web/src/idl/gherkin_pay.json`) is already in sync with the generated IDL — zero diff. Only the TypeScript types file at `app/web/src/types/gherkin_pay.ts` is stale: it's missing all 4 `metadataUri` fields and uses the old name `"triggerPay"` instead of `"gherkinPay"`.

## Steps

1. Deploy to devnet: `anchor deploy --provider.cluster devnet -p gherkin_pay`. The program binary is at `target/deploy/gherkin_pay.so` (413K). The existing on-chain program has the local keypair (`~/.config/solana/id.json`) as upgrade authority with ~8 SOL balance. This is a program upgrade, not a fresh deploy.
2. Verify deployment: `solana program show 2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV --url devnet` — confirm it shows the program data and a recent deploy slot.
3. Sync types: `cp target/types/gherkin_pay.ts app/web/src/types/gherkin_pay.ts`. Verify with `diff target/types/gherkin_pay.ts app/web/src/types/gherkin_pay.ts` (should be empty) and `grep -c metadataUri app/web/src/types/gherkin_pay.ts` (should return 4).
4. Install and build frontend: `cd app/web && bun install && bun run build`. The worktree has no `node_modules` — `bun install` is required first. Build must exit 0 confirming synced types don't break any imports.

## Must-Haves

- [ ] `anchor deploy --provider.cluster devnet -p gherkin_pay` exits 0
- [ ] `solana program show 2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV --url devnet` shows program data
- [ ] `diff target/types/gherkin_pay.ts app/web/src/types/gherkin_pay.ts` returns empty
- [ ] `grep -c metadataUri app/web/src/types/gherkin_pay.ts` returns 4
- [ ] `cd app/web && bun run build` exits 0

## Verification

- `solana program show 2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV --url devnet` exits 0
- `diff target/types/gherkin_pay.ts app/web/src/types/gherkin_pay.ts` exits 0 (no diff)
- `grep -c metadataUri app/web/src/types/gherkin_pay.ts` returns 4
- `cd app/web && bun run build` exits 0

## Observability Impact

- **Signals changed:** On-chain program binary updated — `solana program show` will report a new deploy slot and data length reflecting the metadataUri account layout. Frontend types file gains 4 `metadataUri` fields, making TypeScript compilation a signal that types are in sync.
- **How to inspect:** `solana program show 2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV --url devnet` shows deploy slot, data length, and authority. `grep -c metadataUri app/web/src/types/gherkin_pay.ts` confirms type sync. `bun run build` in `app/web/` acts as a compilation health check.
- **Failure visibility:** Deploy failures surface in anchor CLI stderr (insufficient SOL, authority mismatch, binary too large). Type sync failures show as TypeScript compilation errors in `bun run build` output. Missing metadataUri fields cause grep count mismatch.

## Inputs

- `target/deploy/gherkin_pay.so` — built program binary from S01
- `target/deploy/gherkin_pay-keypair.json` — program keypair matching devnet address
- `target/types/gherkin_pay.ts` — generated TypeScript types with metadataUri (4 occurrences)
- `target/idl/gherkin_pay.json` — generated IDL (already synced to frontend, no action needed)
- `app/web/src/types/gherkin_pay.ts` — stale types file to be replaced
- `Anchor.toml` — config file (localnet default, override with --provider.cluster devnet)

## Expected Output

- `app/web/src/types/gherkin_pay.ts` — replaced with generated types containing 4 metadataUri fields and name "gherkinPay"
- `app/web/.next/` — successful build output confirming types compile
