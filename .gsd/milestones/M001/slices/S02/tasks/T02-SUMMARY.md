---
id: T02
parent: S02
milestone: M001
provides:
  - WalletContextProvider wrapping the app for wallet connectivity
  - useAnchorProgram() hook returning typed Program instances
  - WalletMultiButton in console sidebar replacing placeholder
  - Webpack externals for Solana transitive Node.js deps
key_files:
  - app/web/src/components/wallet-provider.tsx
  - app/web/src/lib/anchor.ts
  - app/web/src/components/wallet-button.tsx
  - app/web/src/app/layout.tsx
  - app/web/src/app/(console)/layout.tsx
  - app/web/next.config.js
key_decisions:
  - Removed PROGRAM_ID/HOOK_PROGRAM_ID imports from anchor.ts — Anchor v0.30+ reads address from IDL JSON directly
  - Added .next to .prettierignore — root lint glob was matching build artifacts
patterns_established:
  - Wallet Standard auto-detection with wallets=[] — no explicit adapter imports needed
observability_surfaces:
  - useAnchorProgram() returns null programs when wallet disconnected
  - useWallet() exposes connected/publicKey for downstream inspection
  - Build failures from webpack externals surface as Module not found in bun run build
duration: 15m
verification_result: passed
completed_at: 2026-03-19
blocker_discovered: false
---

# T02: Wire wallet provider, Anchor hook, and wallet button into layouts

**Wired WalletContextProvider into root layout, created useAnchorProgram() hook with typed Program instances, replaced placeholder Connect Wallet button with WalletMultiButton, added webpack externals for Solana deps**

## What Happened

Created three new client components: `wallet-provider.tsx` (ConnectionProvider → WalletProvider → WalletModalProvider with auto-detect), `anchor.ts` (useAnchorProgram hook returning typed Program<GherkinPay> and Program<GherkinPayHook> or null), and `wallet-button.tsx` (thin WalletMultiButton wrapper).

Wired WalletContextProvider as outermost client provider in root layout.tsx, wrapping TRPCReactProvider. Replaced the placeholder `<Button>Connect Wallet</Button>` in the console sidebar with the real WalletButton component.

Added webpack resolve fallbacks (fs/net/tls: false) and externals (pino-pretty, lokijs, encoding) to next.config.js to handle Solana packages' Node.js transitive deps.

Fixed root-level lint failure: the prettier glob `*/**/*{.js,.ts}` was matching `.next` build artifacts. Added `.next` to `.prettierignore`.

Removed unused PROGRAM_ID/HOOK_PROGRAM_ID imports from anchor.ts — Anchor v0.30+ reads the program address directly from the IDL JSON, so explicit program IDs aren't needed in the Program constructor.

## Verification

- `npm run lint` exits 0 (after adding .next to .prettierignore and running lint:fix)
- `bun run build` exits 0 — compiled successfully, no warnings except unused-vars (removed)
- `bun run typecheck` exits 0 — clean
- All three new files have `"use client"` directive
- WalletContextProvider wired in root layout.tsx
- WalletButton rendered in console sidebar layout
- Webpack externals configured in next.config.js
- No `@/` imports in any new file

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run lint` | 0 | ✅ pass | 9.8s |
| 2 | `cd app/web && bun run build` | 0 | ✅ pass | 9.8s |
| 3 | `cd app/web && bun run typecheck` | 0 | ✅ pass | 3.1s |
| 4 | `grep "use client" wallet-provider.tsx anchor.ts wallet-button.tsx` | 0 | ✅ pass | <1s |
| 5 | `grep "WalletContextProvider" layout.tsx` | 0 | ✅ pass | <1s |
| 6 | `grep "WalletButton" (console)/layout.tsx` | 0 | ✅ pass | <1s |
| 7 | `grep "pino-pretty" next.config.js` | 0 | ✅ pass | <1s |
| 8 | `grep -r "from '@/" ...` (no @/ imports) | 1 (no match) | ✅ pass | <1s |

## Diagnostics

- **Wallet state:** Call `useWallet()` from any client component under the provider tree to check `connected`, `publicKey`
- **Anchor programs:** `useAnchorProgram()` returns `{ program: null, hookProgram: null }` when disconnected, typed instances when connected
- **Build diagnostics:** If Solana deps add new Node.js modules, add them to webpack externals or resolve.fallback in next.config.js

## Deviations

- Removed `PROGRAM_ID` and `HOOK_PROGRAM_ID` imports from anchor.ts (plan included them) — Anchor v0.30+ reads address from IDL, making explicit IDs unnecessary for Program constructor
- Added `.next` to `.prettierignore` — not in original plan but required to fix the lint verification gate failure
- Ran `npm run lint:fix` to auto-format files that prettier flagged

## Known Issues

None.

## Files Created/Modified

- `app/web/src/components/wallet-provider.tsx` — new: "use client" component wrapping wallet adapter providers
- `app/web/src/lib/anchor.ts` — new: useAnchorProgram() hook with typed Program instances
- `app/web/src/components/wallet-button.tsx` — new: thin WalletMultiButton wrapper
- `app/web/src/app/layout.tsx` — updated: WalletContextProvider wrapping TRPCReactProvider
- `app/web/src/app/(console)/layout.tsx` — updated: WalletButton replacing placeholder Button
- `app/web/next.config.js` — updated: webpack externals and resolve fallbacks
- `.prettierignore` — updated: added .next to prevent lint failures on build artifacts
