---
estimated_steps: 8
estimated_files: 12
---

# T01: Install Solana dependencies and scaffold Anchor program client infrastructure

**Slice:** S01 — Permissionless Cranks
**Milestone:** M003

## Description

The M003 worktree has only the original T3 scaffold — no wallet adapter, no Anchor client, no IDL, no PDA helpers, no shadcn components. All M001/M002 infrastructure must be recreated before any S01 feature work. This follows the exact same pattern documented in M002/S03-SUMMARY (which also had to recreate 14 prerequisite files).

Key patterns from prior milestones:
- shadcn canary (Tailwind v4 path) with manual components.json, not interactive init (D008)
- GherkinPay CSS tokens prefixed gp- when colliding with shadcn tokens (D007)
- Wallet Standard auto-detection with wallets=[] (D006)
- IDL files in src/idl/, TypeScript types in src/types/ — Anchor v0.32 requires Program<GherkinPay> cast
- useAnchorProgram() returns null programs when disconnected
- T3 env schema for NEXT_PUBLIC_SOLANA_RPC_URL
- Webpack externals for Solana Node.js polyfills

**Relevant skills:** react-best-practices

## Steps

1. Install Solana/Anchor/wallet dependencies: `@solana/web3.js`, `@coral-xyz/anchor`, `@solana/wallet-adapter-react`, `@solana/wallet-adapter-base`, `@solana/wallet-adapter-wallets`, `@solana/wallet-adapter-react-ui`. Also install `@solana/spl-token` for token gate ATA derivation (used in T03).

2. Generate IDL JSON from the on-chain program. The Anchor program is at `programs/gherkin-pay/src/lib.rs` with program ID `2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV`. Create `app/web/src/idl/gherkin_pay.json` matching the Anchor IDL format (accounts, instructions, types). Also create `app/web/src/idl/gherkin_pay_hook.json` for the hook program at `3pG9tTyExGA3C7sdvw5AcUvfmwydtRCLV22KPb6SfYRc`. Create corresponding TypeScript type files in `app/web/src/types/`.

3. Set up shadcn canary: create `app/web/components.json` manually (not interactive init, per D008). Install shadcn components: Button, Table, Badge, Card, Skeleton, Dialog. Create `app/web/src/lib/utils.ts` with cn() utility. Merge shadcn oklch CSS variables into `app/web/src/styles/globals.css`, keeping existing gp- prefixed tokens.

4. Create `app/web/src/lib/constants.ts` with GHERKIN_PAY_PROGRAM_ID and GHERKIN_PAY_HOOK_PROGRAM_ID. Create `app/web/src/env.js` with T3 env schema including NEXT_PUBLIC_SOLANA_RPC_URL (default: devnet RPC).

5. Create `app/web/src/lib/anchor.ts` with useAnchorProgram() hook returning `{ program: Program<GherkinPay> | null, hookProgram: Program<GherkinPayHook> | null, connection }`. Uses useConnection() and useWallet() from wallet adapter. Returns null programs when wallet disconnected.

6. Create `app/web/src/lib/pda.ts` with PDA derivation helpers: getPaymentPDA(paymentId), getEscrowPDA(paymentPubkey), getConditionPDA(paymentPubkey, milestoneIndex). Seeds must match Anchor program seeds.

7. Create `app/web/src/lib/token.ts` with USDC_MINT constant (devnet Token-2022 mint) and getUsdcAta(owner) helper using getAssociatedTokenAddressSync with TOKEN_2022_PROGRAM_ID.

8. Create `app/web/src/components/wallet-provider.tsx` (WalletContextProvider wrapping ConnectionProvider + WalletProvider with wallets=[]), `app/web/src/components/wallet-button.tsx` (thin wrapper around WalletMultiButton). Wire WalletContextProvider into `app/web/src/app/layout.tsx` as outermost client boundary. Add `app/web/next.config.js` with webpack externals for pino-pretty, lokijs, encoding.

## Must-Haves

- [ ] bun install succeeds with all Solana/Anchor/wallet/shadcn dependencies
- [ ] IDL JSON files exist and match program structure (accounts: PaymentAgreement, ConditionAccount; instructions: all 13)
- [ ] useAnchorProgram() hook returns typed Program instances (or null when disconnected)
- [ ] PDA helpers produce correct addresses matching Anchor program seed layout
- [ ] WalletMultiButton renders in console sidebar
- [ ] shadcn Button, Table, Badge, Card, Skeleton, Dialog components available
- [ ] `bun run build` exits 0

## Verification

- `cd app/web && bun run build` exits 0
- `test -f app/web/src/idl/gherkin_pay.json` — IDL exists
- `test -f app/web/src/lib/anchor.ts` — Anchor hook exists
- `test -f app/web/src/lib/pda.ts` — PDA helpers exist
- `test -f app/web/src/components/wallet-provider.tsx` — Wallet provider exists
- `grep -q "useAnchorProgram" app/web/src/lib/anchor.ts` — Hook exported

## Inputs

- `programs/gherkin-pay/src/lib.rs` — program instructions and program ID
- `programs/gherkin-pay/src/state/condition.rs` — ConditionAccount layout and Condition enum
- `programs/gherkin-pay/src/state/payment.rs` — PaymentAgreement layout
- `programs/gherkin-pay/src/error.rs` — error codes
- `programs/gherkin-pay/src/events.rs` — event definitions
- `programs/gherkin-pay-hook/src/lib.rs` — hook program ID and ComplianceEntry structure
- `app/web/package.json` — existing dependencies
- `app/web/src/styles/globals.css` — existing CSS tokens
- `app/web/src/app/layout.tsx` — root layout to wrap with WalletProvider
- `app/web/src/app/(console)/layout.tsx` — console layout for wallet button placement
- `Anchor.toml` — program IDs for both programs

## Expected Output

- `app/web/package.json` — updated with Solana/Anchor/wallet/shadcn dependencies
- `app/web/components.json` — shadcn configuration
- `app/web/next.config.js` — webpack externals for Node.js polyfills
- `app/web/src/env.js` — T3 env schema with NEXT_PUBLIC_SOLANA_RPC_URL
- `app/web/src/idl/gherkin_pay.json` — Anchor IDL for gherkin_pay program
- `app/web/src/idl/gherkin_pay_hook.json` — Anchor IDL for hook program
- `app/web/src/types/gherkin_pay.ts` — TypeScript types for gherkin_pay
- `app/web/src/types/gherkin_pay_hook.ts` — TypeScript types for hook program
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
- `app/web/src/app/layout.tsx` — updated with WalletContextProvider wrapper
- `app/web/src/app/(console)/layout.tsx` — updated with WalletMultiButton in sidebar
- `app/web/src/styles/globals.css` — merged shadcn oklch tokens with existing gp- tokens
