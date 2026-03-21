---
id: T01
parent: S01
milestone: M003
provides:
  - Solana/Anchor/wallet-adapter dependencies installed
  - IDL JSON files for gherkin_pay and gherkin_pay_hook programs
  - useAnchorProgram() hook returning typed Program instances
  - PDA derivation helpers (payment, escrow, condition)
  - WalletContextProvider and WalletMultiButton wired into layouts
  - shadcn UI components (Button, Table, Badge, Card, Skeleton, Dialog)
  - USDC mint constant and ATA derivation helper
  - T3 env schema with NEXT_PUBLIC_SOLANA_RPC_URL
  - Webpack externals for Node.js polyfills
key_files:
  - app/web/src/lib/anchor.ts
  - app/web/src/lib/pda.ts
  - app/web/src/lib/token.ts
  - app/web/src/lib/constants.ts
  - app/web/src/lib/utils.ts
  - app/web/src/idl/gherkin_pay.json
  - app/web/src/idl/gherkin_pay_hook.json
  - app/web/src/types/gherkin_pay.ts
  - app/web/src/types/gherkin_pay_hook.ts
  - app/web/src/components/wallet-provider.tsx
  - app/web/src/components/wallet-button.tsx
  - app/web/src/components/ui/button.tsx
  - app/web/src/components/ui/table.tsx
  - app/web/src/components/ui/badge.tsx
  - app/web/src/components/ui/card.tsx
  - app/web/src/components/ui/skeleton.tsx
  - app/web/src/components/ui/dialog.tsx
  - app/web/src/app/layout.tsx
  - app/web/src/app/(console)/layout.tsx
  - app/web/next.config.js
  - app/web/src/env.js
  - app/web/components.json
key_decisions:
  - Cast IDL JSON as Anchor Idl type (not generic Program<T>) to avoid TypeScript structural mismatch with Anchor 0.32 IdlSeed types
patterns_established:
  - useAnchorProgram() returns { program, hookProgram, connection, provider } — null programs when wallet disconnected
  - PDA helpers in src/lib/pda.ts with getPaymentPDA, getEscrowPDA, getConditionPDA
  - shadcn canary with manual components.json (D008), Wallet Standard auto-detection with wallets=[] (D006)
observability_surfaces:
  - none (infrastructure-only task; runtime observability added in T02/T03)
duration: 12m
verification_result: passed
completed_at: 2026-03-20
blocker_discovered: false
---

# T01: Install Solana dependencies and scaffold Anchor program client infrastructure

**Installed Solana/Anchor/wallet-adapter stack with IDL files, PDA helpers, useAnchorProgram hook, shadcn UI components, and wallet provider wired into Next.js layouts — build passes clean.**

## What Happened

Recreated the full Solana client infrastructure in the M003 worktree following prior milestone patterns. Installed 13 packages (@solana/web3.js, @coral-xyz/anchor, wallet-adapter suite, @solana/spl-token, shadcn utility deps, Radix primitives). Generated Anchor IDL JSON files for both gherkin_pay (13 instructions, 2 accounts, 7 types, 9 events) and gherkin_pay_hook (3 instructions, 1 account) by deriving structure from program source. Created TypeScript type files with all enums, account interfaces, and error codes matching on-chain layout. Built PDA derivation helpers matching Anchor seed layout. Set up WalletContextProvider with Wallet Standard auto-detection (wallets=[]) and WalletMultiButton dynamically imported to avoid SSR issues. Created 6 shadcn UI components (Button, Table, Badge, Card, Skeleton, Dialog). Updated root layout with WalletContextProvider wrapper and console layout with WalletButton in sidebar. Configured webpack externals for pino-pretty/lokijs/encoding and T3 env schema with optional NEXT_PUBLIC_SOLANA_RPC_URL.

Initial build failed on Anchor 0.32's strict IdlSeed typing — the JSON import's inferred `kind: string` wasn't assignable to the literal `"account" | "const" | "arg"` types. Fixed by casting IDL as `Idl` instead of using `Program<T>` generic, which is the pragmatic pattern for Anchor 0.32 with TypeScript strict mode.

## Verification

All 6 T01 verification checks pass. Slice-level checks for conditions.ts, crank mutations, and error decoder correctly fail (T02/T03 scope).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && bun run build` | 0 | ✅ pass | 10.5s |
| 2 | `test -f app/web/src/idl/gherkin_pay.json` | 0 | ✅ pass | <1s |
| 3 | `test -f app/web/src/lib/anchor.ts` | 0 | ✅ pass | <1s |
| 4 | `test -f app/web/src/lib/pda.ts` | 0 | ✅ pass | <1s |
| 5 | `test -f app/web/src/components/wallet-provider.tsx` | 0 | ✅ pass | <1s |
| 6 | `grep -q "useAnchorProgram" app/web/src/lib/anchor.ts` | 0 | ✅ pass | <1s |

### Slice-level checks (partial — expected for T01)

| # | Command | Exit Code | Verdict | Notes |
|---|---------|-----------|---------|-------|
| 7 | `cd app/web && bun run build` | 0 | ✅ pass | |
| 8 | `test -f app/web/src/lib/queries/conditions.ts` | 1 | ⏳ T02 | |
| 9 | `test -f app/web/src/lib/mutations/crank-time.ts` | 1 | ⏳ T02 | |
| 10 | `test -f app/web/src/lib/mutations/crank-oracle.ts` | 1 | ⏳ T03 | |
| 11 | `test -f app/web/src/lib/mutations/crank-token-gate.ts` | 1 | ⏳ T03 | |
| 12 | `test -f app/web/src/lib/errors.ts` | 1 | ⏳ T02 | |

## Diagnostics

No runtime diagnostics for this infrastructure task. To verify the scaffold:
- `bun run build` in app/web — confirms all types resolve
- Import `useAnchorProgram` in any client component — returns null programs until wallet connected
- PDA derivation can be tested by comparing output against `anchor keys list` addresses

## Deviations

- Used `as Idl` cast in anchor.ts instead of `Program<GherkinPay>` generic — Anchor 0.32's IdlSeed type literals don't match JSON import inference. The cast is safe because the IDL is hand-authored to match the program. Downstream consumers use the types from `src/types/gherkin_pay.ts` for account data, not the Program generic.

## Known Issues

- ESLint warnings for unused GHERKIN_PAY_PROGRAM_ID import were cleaned up, but constants.ts exports are consumed by pda.ts and will be consumed by T02/T03 mutation hooks.
- The devnet USDC mint in token.ts (`Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr`) is a commonly used devnet Token-2022 test mint — confirm this matches the project's deployed devnet mint.

## Files Created/Modified

- `app/web/package.json` — added 13 Solana/Anchor/wallet/shadcn dependencies
- `app/web/components.json` — shadcn canary configuration (manual, per D008)
- `app/web/next.config.js` — webpack externals for pino-pretty, lokijs, encoding
- `app/web/src/env.js` — added NEXT_PUBLIC_SOLANA_RPC_URL to T3 env schema
- `app/web/src/idl/gherkin_pay.json` — Anchor IDL for gherkin_pay program
- `app/web/src/idl/gherkin_pay_hook.json` — Anchor IDL for hook program
- `app/web/src/types/gherkin_pay.ts` — TS types, enums, error codes for gherkin_pay
- `app/web/src/types/gherkin_pay_hook.ts` — TS types for hook program
- `app/web/src/lib/anchor.ts` — useAnchorProgram() hook
- `app/web/src/lib/pda.ts` — PDA derivation helpers
- `app/web/src/lib/constants.ts` — program ID constants
- `app/web/src/lib/token.ts` — USDC mint and ATA helper
- `app/web/src/lib/utils.ts` — cn() utility
- `app/web/src/components/wallet-provider.tsx` — WalletContextProvider
- `app/web/src/components/wallet-button.tsx` — WalletMultiButton wrapper
- `app/web/src/components/ui/button.tsx` — shadcn Button
- `app/web/src/components/ui/table.tsx` — shadcn Table
- `app/web/src/components/ui/badge.tsx` — shadcn Badge
- `app/web/src/components/ui/card.tsx` — shadcn Card
- `app/web/src/components/ui/skeleton.tsx` — shadcn Skeleton
- `app/web/src/components/ui/dialog.tsx` — shadcn Dialog
- `app/web/src/app/layout.tsx` — wrapped with WalletContextProvider
- `app/web/src/app/(console)/layout.tsx` — added WalletButton to sidebar
