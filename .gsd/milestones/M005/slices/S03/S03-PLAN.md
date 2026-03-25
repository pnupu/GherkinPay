# S03: Devnet Deploy & Smoke Test

**Goal:** Contract redeployed to devnet with updated account layout, frontend types synced, frontend builds clean, and crank bot connects to devnet.
**Demo:** `solana program show 2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV` shows fresh deploy slot; `diff target/types/gherkin_pay.ts app/web/src/types/gherkin_pay.ts` returns empty; `cd app/web && bun run build` exits 0; crank bot `--dry-run` connects and scans accounts on devnet.

## Must-Haves

- Program deployed to devnet at `2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV` with metadata_uri account layout
- `app/web/src/types/gherkin_pay.ts` replaced with generated types (4 metadataUri fields, name "gherkinPay")
- `bun run build` in `app/web/` exits 0
- Crank bot runs `--dry-run` against devnet without crashing

## Proof Level

- This slice proves: integration + operational
- Real runtime required: yes (devnet)
- Human/UAT required: yes (UI roundtrip payment creation — documented as manual verification step)

## Verification

- `solana program show 2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV --url devnet` exits 0 and shows program data
- `diff target/types/gherkin_pay.ts app/web/src/types/gherkin_pay.ts` returns empty (exit 0)
- `grep -c metadataUri app/web/src/types/gherkin_pay.ts` returns 4
- `cd app/web && bun run build` exits 0
- `timeout 15 bun run scripts/crank-bot.ts --dry-run 2>&1 | grep -q "Scanning\|accounts\|Connected\|Program"` exits 0 (bot starts and scans)
- `solana program show 2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV --url devnet 2>&1 | grep -q "Data Length"` exits 0 (confirms program data is inspectable and deploy metadata is accessible for diagnostics)

## Observability / Diagnostics

- Runtime signals: `solana program show` output (deploy slot, data length, authority), crank bot stdout logs
- Inspection surfaces: `solana program show <address> --url devnet`, `bun run scripts/crank-bot.ts --dry-run`
- Failure visibility: deploy errors in anchor CLI output, build errors in Next.js compiler output, crank bot connection/deserialization errors in stderr
- Redaction constraints: keypair paths logged but private key values never exposed

## Integration Closure

- Upstream surfaces consumed: `target/deploy/gherkin_pay.so` (S01 build artifact), `target/types/gherkin_pay.ts` (S01 generated types), `target/idl/gherkin_pay.json` (S01 generated IDL, already synced to frontend)
- New wiring introduced in this slice: synced types file enables frontend type-safety for metadataUri across all components
- What remains before the milestone is truly usable end-to-end: manual UI roundtrip — create payment with metadata_uri via wizard, verify it appears in detail page (documented as UAT step)

## Tasks

- [x] **T01: Deploy to devnet and sync frontend types** `est:20m`
  - Why: The program binary needs to be on devnet with the metadata_uri account layout (R025), and the stale TypeScript types file must be replaced so the frontend compiles with full type coverage
  - Files: `app/web/src/types/gherkin_pay.ts`, `target/deploy/gherkin_pay.so`, `target/types/gherkin_pay.ts`
  - Do: (1) Run `anchor deploy --provider.cluster devnet -p gherkin_pay` to upgrade the on-chain program. (2) Copy `target/types/gherkin_pay.ts` → `app/web/src/types/gherkin_pay.ts`. (3) Run `bun install` in `app/web/` (worktree has no node_modules). (4) Run `bun run build` in `app/web/` to confirm types compile cleanly.
  - Verify: `solana program show 2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV --url devnet` exits 0; `diff target/types/gherkin_pay.ts app/web/src/types/gherkin_pay.ts` returns empty; `grep -c metadataUri app/web/src/types/gherkin_pay.ts` returns 4; `cd app/web && bun run build` exits 0
  - Done when: program deployed to devnet, types synced with 4 metadataUri fields, frontend builds clean

- [x] **T02: Smoke-test crank bot against devnet and document UI roundtrip** `est:15m`
  - Why: Proves the crank bot can connect to devnet, deserialize accounts using the synced IDL (operational readiness), and documents the manual UI verification steps for R026
  - Files: `scripts/crank-bot.ts`, `scripts/verify-s03-smoke.sh`
  - Do: (1) Run `bun install` at repo root if needed (crank bot imports from app/web). (2) Run `timeout 15 bun run scripts/crank-bot.ts --dry-run` and verify it starts, connects to devnet RPC, and attempts account scanning without crashing. (3) Write `scripts/verify-s03-smoke.sh` — a verification script that checks: program deployed, types synced, frontend builds, and crank bot starts. (4) Add a `## Manual UAT: UI Roundtrip` section to the slice summary documenting the steps: start `bun run dev` in app/web, connect wallet, create payment with metadata_uri via wizard, navigate to agreement detail page, confirm metadataUri displays.
  - Verify: `bash scripts/verify-s03-smoke.sh` exits 0
  - Done when: crank bot connects to devnet in dry-run mode without errors; verification script passes; UI roundtrip steps documented

## Files Likely Touched

- `app/web/src/types/gherkin_pay.ts` — replaced with generated types
- `scripts/verify-s03-smoke.sh` — new verification script
