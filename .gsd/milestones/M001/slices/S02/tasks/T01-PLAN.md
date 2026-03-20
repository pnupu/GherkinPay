---
estimated_steps: 6
estimated_files: 9
---

# T01: Generate IDL, install Solana deps, and create constants

**Slice:** S02 — Wallet Connect and Anchor Client
**Milestone:** M001

## Description

Run `anchor build` to produce IDL JSON and TypeScript types for both on-chain programs (`gherkin_pay` and `gherkin_pay_hook`). Copy these artifacts into the frontend app. Install all Solana/wallet/Anchor npm packages. Create the constants module and add the RPC endpoint env var to the T3 env schema.

This task unblocks everything else in S02 — without IDL files, the Anchor client can't instantiate typed programs, and without the Solana packages, wallet adapter components aren't available.

## Steps

1. Run `anchor build` in the project root. This compiles both Rust programs and generates `target/idl/gherkin_pay.json`, `target/idl/gherkin_pay_hook.json`, `target/types/gherkin_pay.ts`, `target/types/gherkin_pay_hook.ts`. If the build fails due to missing BPF/SBF toolchain, see fallback in "Must-Haves" below.

2. Create `app/web/src/idl/` directory. Copy `target/idl/gherkin_pay.json` and `target/idl/gherkin_pay_hook.json` into it.

3. Create `app/web/src/types/` directory. Copy `target/types/gherkin_pay.ts` and `target/types/gherkin_pay_hook.ts` into it. These are Anchor-generated TypeScript type definitions used by the `Program` generic.

4. Install Solana dependencies in `app/web`:
   ```bash
   cd app/web && bun add @solana/web3.js@^1.98 @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @coral-xyz/anchor
   ```
   **Critical:** `@solana/web3.js` must be v1.x (not v2). Both wallet adapter and Anchor peer-depend on v1.

5. Create `app/web/src/lib/constants.ts`:
   ```typescript
   import { PublicKey } from "@solana/web3.js";
   import { env } from "~/env";

   export const PROGRAM_ID = new PublicKey("2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV");
   export const HOOK_PROGRAM_ID = new PublicKey("3pG9tTyExGA3C7sdvw5AcUvfmwydtRCLV22KPb6SfYRc");
   export const DEVNET_RPC_ENDPOINT = env.NEXT_PUBLIC_SOLANA_RPC_URL;
   ```
   Program IDs come from `Anchor.toml`. All imports must use `~/` prefix, never `@/`.

6. Update `app/web/src/env.js` to add `NEXT_PUBLIC_SOLANA_RPC_URL`:
   - In the `client` object, add: `NEXT_PUBLIC_SOLANA_RPC_URL: z.string().url().default("https://api.devnet.solana.com")`
   - In the `runtimeEnv` object, add: `NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL`

## Must-Haves

- [ ] `anchor build` exits 0 (or IDL files manually created from Rust source if toolchain issues prevent build)
- [ ] `app/web/src/idl/gherkin_pay.json` and `app/web/src/idl/gherkin_pay_hook.json` exist and contain valid JSON with program addresses
- [ ] `app/web/src/types/gherkin_pay.ts` and `app/web/src/types/gherkin_pay_hook.ts` exist
- [ ] `@solana/web3.js` installed at v1.x (verify with `bun pm ls @solana/web3.js`)
- [ ] `@coral-xyz/anchor`, `@solana/wallet-adapter-base`, `@solana/wallet-adapter-react`, `@solana/wallet-adapter-react-ui` installed
- [ ] `app/web/src/lib/constants.ts` exports `PROGRAM_ID`, `HOOK_PROGRAM_ID`, `DEVNET_RPC_ENDPOINT`
- [ ] `NEXT_PUBLIC_SOLANA_RPC_URL` in env.js client schema with devnet default
- [ ] All new files use `~/` imports, never `@/`

## Verification

- `ls app/web/src/idl/gherkin_pay.json app/web/src/idl/gherkin_pay_hook.json` — both exist
- `ls app/web/src/types/gherkin_pay.ts app/web/src/types/gherkin_pay_hook.ts` — both exist
- `cd app/web && bun pm ls @solana/web3.js 2>/dev/null | grep "1\."` — confirms v1.x
- `grep NEXT_PUBLIC_SOLANA_RPC_URL app/web/src/env.js` — env var is registered
- `grep "PROGRAM_ID\|HOOK_PROGRAM_ID\|DEVNET_RPC_ENDPOINT" app/web/src/lib/constants.ts` — all three constants present
- `grep -r "from ['\"]@/" app/web/src/lib/constants.ts` — empty (no @/ imports)

## Observability Impact

- **Build signal:** `anchor build` exit code — confirms on-chain programs compile and IDL generation succeeds. If toolchain is missing, IDL must be hand-crafted from Rust source.
- **Env validation:** T3 env schema (`env.js`) validates `NEXT_PUBLIC_SOLANA_RPC_URL` at startup. Missing or malformed value causes immediate build/dev failure with a clear Zod error.
- **Dependency resolution:** `bun pm ls @solana/web3.js` confirms v1.x — v2 would silently break wallet adapter and Anchor at runtime.
- **Future agent inspection:** Check `app/web/src/idl/*.json` for valid IDL, `app/web/src/lib/constants.ts` for program IDs, `app/web/src/env.js` for RPC URL schema.
- **Failure visibility:** Missing IDL files → TypeScript import errors in downstream tasks. Wrong web3.js version → peer dependency warnings and runtime `Program` constructor failures.

## Inputs

- `Anchor.toml` — program IDs: `gherkin_pay = 2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV`, `gherkin_pay_hook = 3pG9tTyExGA3C7sdvw5AcUvfmwydtRCLV22KPb6SfYRc`
- `programs/gherkin-pay/` and `programs/gherkin-pay-hook/` — Rust source for IDL generation
- `app/web/src/env.js` — T3 env schema to extend
- `app/web/package.json` — deps to install into
- `app/web/tsconfig.json` — uses `~/` path alias (`"~/*": ["./src/*"]`), `verbatimModuleSyntax: true`, `resolveJsonModule: true`

## Expected Output

- `app/web/src/idl/gherkin_pay.json` — IDL JSON for the main program
- `app/web/src/idl/gherkin_pay_hook.json` — IDL JSON for the hook program
- `app/web/src/types/gherkin_pay.ts` — TypeScript type for `Program<GherkinPay>`
- `app/web/src/types/gherkin_pay_hook.ts` — TypeScript type for `Program<GherkinPayHook>`
- `app/web/src/lib/constants.ts` — program IDs and RPC endpoint constants
- `app/web/src/env.js` — updated with `NEXT_PUBLIC_SOLANA_RPC_URL`
- `app/web/package.json` — updated with Solana dependencies
