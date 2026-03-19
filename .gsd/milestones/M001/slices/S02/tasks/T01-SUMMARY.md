---
id: T01
parent: S02
milestone: M001
provides:
  - IDL JSON and TypeScript types for both on-chain programs in app/web/src/
  - Solana/wallet/Anchor npm dependencies installed
  - Program ID constants and RPC endpoint env var
key_files:
  - app/web/src/idl/gherkin_pay.json
  - app/web/src/idl/gherkin_pay_hook.json
  - app/web/src/types/gherkin_pay.ts
  - app/web/src/types/gherkin_pay_hook.ts
  - app/web/src/lib/constants.ts
  - app/web/src/env.js
  - app/web/package.json
key_decisions:
  - Used anchor build output directly (no hand-crafted IDL needed — toolchain available)
  - Installed @coral-xyz/anchor@0.32.1 (latest v0.32) which is compatible with Anchor.toml 0.31.1 programs
patterns_established:
  - IDL files live in app/web/src/idl/, TypeScript types in app/web/src/types/
  - Constants use ~/env import for T3 env schema integration
observability_surfaces:
  - T3 env validation: missing/malformed NEXT_PUBLIC_SOLANA_RPC_URL causes Zod error at startup
  - IDL presence: ls app/web/src/idl/*.json verifies artifacts exist
  - Dependency version: bun pm ls @solana/web3.js confirms v1.x
duration: 15m
verification_result: passed
completed_at: 2026-03-19
blocker_discovered: false
---

# T01: Generate IDL, install Solana deps, and create constants

**Ran anchor build, copied IDL+types to frontend, installed Solana/wallet/Anchor deps, created constants module, added RPC URL to T3 env schema**

## What Happened

`anchor build` compiled both `gherkin_pay` and `gherkin_pay_hook` programs successfully (one deprecation warning each for `AccountInfo::realloc` — cosmetic only). Generated IDL JSON and TypeScript type files were copied into `app/web/src/idl/` and `app/web/src/types/`. Installed `@solana/web3.js@1.98.4`, `@solana/wallet-adapter-base@0.9.27`, `@solana/wallet-adapter-react@0.15.39`, `@solana/wallet-adapter-react-ui@0.9.39`, and `@coral-xyz/anchor@0.32.1`. Created `constants.ts` exporting `PROGRAM_ID`, `HOOK_PROGRAM_ID`, and `DEVNET_RPC_ENDPOINT`. Added `NEXT_PUBLIC_SOLANA_RPC_URL` to T3 env schema with devnet default.

## Verification

All task-level must-haves verified:
- Both IDL JSON files exist in `app/web/src/idl/`
- Both TypeScript type files exist in `app/web/src/types/`
- `@solana/web3.js@1.98.4` installed (v1.x confirmed)
- All Solana deps installed
- `NEXT_PUBLIC_SOLANA_RPC_URL` present in env.js client schema and runtimeEnv
- constants.ts exports all three constants
- No `@/` imports in any new file

Slice-level checks (partial — T01 is intermediate):
- ✅ `anchor build` exits 0 and IDL exists
- ✅ IDL files in app/web/src/idl/
- ✅ Type files in app/web/src/types/
- ⏳ `bun run build` — deferred to T02 (wallet provider not wired yet)
- ⏳ `bun run typecheck` — deferred to T02
- ⏳ WalletMultiButton in layout — T02
- ⏳ WalletContextProvider in layout — T02
- ⏳ useAnchorProgram hook — T02

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `anchor build` | 0 | ✅ pass | 109s |
| 2 | `ls app/web/src/idl/gherkin_pay.json app/web/src/idl/gherkin_pay_hook.json` | 0 | ✅ pass | <1s |
| 3 | `ls app/web/src/types/gherkin_pay.ts app/web/src/types/gherkin_pay_hook.ts` | 0 | ✅ pass | <1s |
| 4 | `bun pm ls \| grep web3.js` → `@solana/web3.js@1.98.4` | 0 | ✅ pass | <1s |
| 5 | `grep NEXT_PUBLIC_SOLANA_RPC_URL app/web/src/env.js` | 0 | ✅ pass | <1s |
| 6 | `grep "PROGRAM_ID\|HOOK_PROGRAM_ID\|DEVNET_RPC_ENDPOINT" app/web/src/lib/constants.ts` | 0 | ✅ pass | <1s |
| 7 | `grep -r "from ['\"]@/" app/web/src/lib/constants.ts` | 1 (no match) | ✅ pass | <1s |

## Diagnostics

- **IDL files:** `cat app/web/src/idl/gherkin_pay.json | jq .address` → program address
- **Dependency version:** `cd app/web && bun pm ls @solana/web3.js` — must show 1.x
- **Env validation:** Start dev server; missing/malformed RPC URL triggers Zod error with clear message
- **Anchor build:** Re-run `anchor build` in worktree root to regenerate IDL if programs change

## Deviations

None.

## Known Issues

- Anchor CLI 0.31.1 installed, but `@coral-xyz/anchor@0.32.1` npm package installed (latest available). These are compatible — 0.32 is backward-compatible with 0.31 IDL format.
- Two deprecation warnings from `AccountInfo::realloc` in both programs — cosmetic, no impact on IDL generation.

## Files Created/Modified

- `app/web/src/idl/gherkin_pay.json` — IDL JSON for main program (copied from anchor build output)
- `app/web/src/idl/gherkin_pay_hook.json` — IDL JSON for hook program (copied from anchor build output)
- `app/web/src/types/gherkin_pay.ts` — TypeScript type definitions for main program
- `app/web/src/types/gherkin_pay_hook.ts` — TypeScript type definitions for hook program
- `app/web/src/lib/constants.ts` — Program IDs and RPC endpoint constants
- `app/web/src/env.js` — Added NEXT_PUBLIC_SOLANA_RPC_URL to T3 env schema
- `app/web/package.json` — Added Solana/wallet/Anchor dependencies
