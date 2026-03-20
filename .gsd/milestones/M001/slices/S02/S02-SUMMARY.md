---
id: S02
parent: M001
milestone: M001
provides:
  - WalletContextProvider client component wrapping the entire app for wallet connectivity
  - useAnchorProgram() hook returning typed Program<GherkinPay> and Program<GherkinPayHook> (or null when disconnected)
  - WalletMultiButton rendered in console sidebar replacing placeholder
  - IDL JSON and TypeScript types for both on-chain programs in app/web/src/
  - Program ID constants and RPC endpoint env var with T3 schema validation
  - Webpack externals for Solana transitive Node.js deps
requires:
  - slice: S01
    provides: shadcn Button component, globals.css with merged theme, (console)/layout.tsx with placeholder Button
affects:
  - S03
  - S04
  - S05
  - S06
key_files:
  - app/web/src/components/wallet-provider.tsx
  - app/web/src/lib/anchor.ts
  - app/web/src/components/wallet-button.tsx
  - app/web/src/app/layout.tsx
  - app/web/src/app/(console)/layout.tsx
  - app/web/next.config.js
  - app/web/src/idl/gherkin_pay.json
  - app/web/src/idl/gherkin_pay_hook.json
  - app/web/src/types/gherkin_pay.ts
  - app/web/src/types/gherkin_pay_hook.ts
  - app/web/src/lib/constants.ts
  - app/web/src/env.js
key_decisions:
  - Anchor v0.30+ reads program address from IDL JSON — no need to pass PROGRAM_ID to Program constructor
  - Wallet Standard auto-detection with wallets=[] — no explicit Phantom/Solflare adapter imports needed
  - Added .next to .prettierignore to prevent root lint glob from matching build artifacts
patterns_established:
  - IDL files live in app/web/src/idl/, TypeScript types in app/web/src/types/
  - Constants use ~/env import for T3 env schema integration
  - Wallet providers wrap entire app in root layout.tsx as outermost client boundary
  - useAnchorProgram() returns null programs when wallet disconnected — consumers must null-check
observability_surfaces:
  - useAnchorProgram() returns { program: null, hookProgram: null } when disconnected — clear signal for downstream hooks
  - useWallet() exposes connected/publicKey for UI state inspection
  - T3 env validation — missing/malformed NEXT_PUBLIC_SOLANA_RPC_URL causes Zod error at startup
  - Build failures from missing webpack externals surface as "Module not found" in bun run build
drill_down_paths:
  - .gsd/milestones/M001/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S02/tasks/T02-SUMMARY.md
duration: 30m
verification_result: passed
completed_at: 2026-03-19
---

# S02: Wallet Connect and Anchor Client

**Wallet adapter and Anchor program client wired into App Router — Phantom/Solflare connect from the sidebar, typed Program instances available via hook for all downstream slices**

## What Happened

T01 ran `anchor build` to generate IDL JSON and TypeScript types for both `gherkin_pay` and `gherkin_pay_hook` programs, copied them into `app/web/src/idl/` and `app/web/src/types/`. Installed `@solana/web3.js@1.98.4`, all wallet adapter packages, and `@coral-xyz/anchor@0.32.1`. Created `lib/constants.ts` with program IDs and RPC endpoint, and added `NEXT_PUBLIC_SOLANA_RPC_URL` to the T3 env schema with a devnet default.

T02 created three client components: `wallet-provider.tsx` (ConnectionProvider → WalletProvider → WalletModalProvider with Wallet Standard auto-detect), `anchor.ts` (`useAnchorProgram()` hook returning typed `Program<GherkinPay>` and `Program<GherkinPayHook>` or null when disconnected), and `wallet-button.tsx` (thin `WalletMultiButton` wrapper). Wired `WalletContextProvider` as the outermost provider in root `layout.tsx`, replaced the placeholder Connect Wallet button in the console sidebar with the real `WalletButton`, and added webpack externals/fallbacks for Solana's Node.js transitive deps.

## Verification

- `anchor build` exits 0 — both IDL JSON files generated
- Both IDL JSON files exist in `app/web/src/idl/`
- Both TypeScript type files exist in `app/web/src/types/`
- `@solana/web3.js@1.98.4` installed (v1.x confirmed)
- `NEXT_PUBLIC_SOLANA_RPC_URL` present in env.js client schema
- `WalletContextProvider` wired in root `layout.tsx`
- `WalletButton` rendered in `(console)/layout.tsx` sidebar
- `useAnchorProgram` exported from `lib/anchor.ts`
- No `@/` imports in any new file
- `bun run build` exits 0 — clean compilation, all pages generate
- `bun run typecheck` exits 0 — no type errors

## Requirements Advanced

- R001 — Wallet adapter infrastructure is fully wired (provider, button, Anchor hook). Awaits human UAT to validate (connecting a real wallet requires browser extension).
- R006 — S02 consumes shadcn Button (via WalletButton wrapper in sidebar). Supporting slice obligation partially fulfilled.

## Requirements Validated

- None — R001 requires human UAT (real wallet connect in browser) to validate.

## New Requirements Surfaced

- None

## Requirements Invalidated or Re-scoped

- None

## Deviations

- Removed `PROGRAM_ID`/`HOOK_PROGRAM_ID` imports from `anchor.ts` — Anchor v0.30+ reads the address from the IDL JSON's `address` field, making explicit program ID passing unnecessary for the `Program` constructor.
- Added `.next` to `.prettierignore` — root lint glob was matching build artifacts, causing lint failures. Not in the original plan but required for the lint verification gate.

## Known Limitations

- Wallet connect cannot be verified without a real browser extension (Phantom/Solflare). Build and typecheck pass, but runtime proof requires human UAT.
- `@coral-xyz/anchor@0.32.1` is one minor version ahead of the Anchor CLI (0.31.1) — backward compatible, but worth noting.

## Follow-ups

- None — all planned work completed cleanly.

## Files Created/Modified

- `app/web/src/idl/gherkin_pay.json` — IDL JSON for main program
- `app/web/src/idl/gherkin_pay_hook.json` — IDL JSON for hook program
- `app/web/src/types/gherkin_pay.ts` — TypeScript types for main program
- `app/web/src/types/gherkin_pay_hook.ts` — TypeScript types for hook program
- `app/web/src/lib/constants.ts` — PROGRAM_ID, HOOK_PROGRAM_ID, DEVNET_RPC_ENDPOINT
- `app/web/src/env.js` — Added NEXT_PUBLIC_SOLANA_RPC_URL to T3 env schema
- `app/web/src/components/wallet-provider.tsx` — WalletContextProvider client component
- `app/web/src/lib/anchor.ts` — useAnchorProgram() hook with typed Program instances
- `app/web/src/components/wallet-button.tsx` — WalletMultiButton wrapper
- `app/web/src/app/layout.tsx` — WalletContextProvider wrapping TRPCReactProvider
- `app/web/src/app/(console)/layout.tsx` — WalletButton replacing placeholder
- `app/web/next.config.js` — webpack externals and resolve fallbacks for Solana deps
- `app/web/package.json` — Solana/wallet/Anchor dependencies added
- `.prettierignore` — Added .next to prevent lint failures on build artifacts

## Forward Intelligence

### What the next slice should know
- `useAnchorProgram()` returns `{ program, hookProgram }` when wallet connected, `{ program: null, hookProgram: null }` when disconnected. Always null-check before calling program methods.
- Anchor v0.30+ reads the program address from the IDL's `address` field — no need to import PROGRAM_ID when constructing a Program. The constants in `lib/constants.ts` are still useful for PDA derivation and direct RPC calls.
- IDL types are importable from `~/types/gherkin_pay` and `~/types/gherkin_pay_hook` — these are the canonical TypeScript types for account structures.

### What's fragile
- Webpack externals list in `next.config.js` — if new Solana packages add Node.js-only transitive deps, they need to be added to the externals/fallback config or the build will fail with "Module not found".
- The `@solana/wallet-adapter-react-ui/styles.css` import in `wallet-provider.tsx` — if the package restructures its CSS exports, the wallet modal will render unstyled.

### Authoritative diagnostics
- `bun run build` — the single most reliable check; catches missing modules, type errors, and webpack resolution failures in one pass.
- `useAnchorProgram()` null return — if downstream hooks get null programs despite a connected wallet, check that the `WalletContextProvider` is the outermost provider in `layout.tsx`.

### What assumptions changed
- Original plan assumed explicit PROGRAM_ID passing to Program constructor — Anchor v0.30+ reads it from IDL, so constants.ts exports are for PDA derivation and direct RPC, not Program construction.
