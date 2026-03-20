# S02: Wallet Connect and Anchor Client

**Goal:** Phantom/Solflare wallet connects from the console header; connected pubkey visible in UI; Anchor program client initialised for both programs pointing at devnet.
**Demo:** User clicks "Select Wallet" in the sidebar → Phantom/Solflare modal appears → wallet connects → connected address visible in the sidebar. Anchor `Program` instances are available via hook for downstream slices.

## Must-Haves

- IDL JSON + TypeScript types for both `gherkin_pay` and `gherkin_pay_hook` programs available in `app/web/src/`
- `@solana/web3.js` (v1.x), `@solana/wallet-adapter-*`, and `@coral-xyz/anchor` installed
- `WalletContextProvider` client component wrapping `ConnectionProvider` → `WalletProvider` → `WalletModalProvider`
- `useAnchorProgram()` hook returning typed `Program<GherkinPay>` and `Program<GherkinPayHook>` (or null when disconnected)
- Constants: `PROGRAM_ID`, `HOOK_PROGRAM_ID`, `DEVNET_RPC_ENDPOINT`
- `NEXT_PUBLIC_SOLANA_RPC_URL` env var in T3 env schema with devnet default
- `WalletMultiButton` rendered in console sidebar (replacing placeholder Button)
- Provider wired into root `layout.tsx`
- `bun run build` passes clean
- `bun run typecheck` passes clean

## Proof Level

- This slice proves: integration (wallet adapter + Anchor client wired into App Router)
- Real runtime required: yes (wallet connect is browser-only; build pass is the automated proof)
- Human/UAT required: yes (connecting a real wallet requires a browser extension)

## Verification

- `anchor build` exits 0 and `target/idl/gherkin_pay.json` exists
- `ls app/web/src/idl/gherkin_pay.json app/web/src/idl/gherkin_pay_hook.json` — both exist
- `ls app/web/src/types/gherkin_pay.ts app/web/src/types/gherkin_pay_hook.ts` — both exist
- `cd app/web && bun run build` exits 0
- `cd app/web && bun run typecheck` exits 0
- `grep "WalletMultiButton\|WalletButton" app/web/src/app/\(console\)/layout.tsx` — wallet button is referenced
- `grep "WalletContextProvider\|WalletProvider" app/web/src/app/layout.tsx` — provider is wired
- `grep "useAnchorProgram" app/web/src/lib/anchor.ts` — hook exists and exports
- No `@/` imports in any new file: `grep -r "from ['\"]@/" app/web/src/lib/constants.ts app/web/src/lib/anchor.ts app/web/src/components/wallet-provider.tsx` returns empty

## Observability / Diagnostics

- Runtime signals: wallet connect/disconnect state visible via `useWallet()` hook; Anchor program instantiation logged to console in dev mode on failure
- Inspection surfaces: `useAnchorProgram()` returns `{ program, hookProgram } | { program: null, hookProgram: null }` — null means wallet disconnected or provider unavailable
- Failure visibility: webpack build errors surface as `bun run build` exit code; missing IDL files cause TypeScript import errors; missing env var causes T3 env validation error at startup
- Redaction constraints: RPC endpoint URL is public (devnet); no secrets in this slice

## Integration Closure

- Upstream surfaces consumed: S01 `~/components/ui/button.tsx`, `~/lib/utils.ts`, `globals.css` with shadcn theme, `(console)/layout.tsx` with placeholder Button
- New wiring introduced: `WalletContextProvider` wraps app in `layout.tsx`; `useAnchorProgram()` hook available for S03–S06; wallet button in console sidebar
- What remains before the milestone is truly usable end-to-end: S03–S06 must consume `useAnchorProgram()` to fetch and display on-chain data

## Tasks

- [x] **T01: Generate IDL, install Solana deps, and create constants** `est:45m`
  - Why: Everything in this slice depends on IDL types and Solana packages. `anchor build` must run first to produce IDL JSON and TypeScript types. Constants and env schema are needed by the wallet provider and Anchor hook.
  - Files: `target/idl/gherkin_pay.json`, `target/idl/gherkin_pay_hook.json`, `app/web/src/idl/gherkin_pay.json`, `app/web/src/idl/gherkin_pay_hook.json`, `app/web/src/types/gherkin_pay.ts`, `app/web/src/types/gherkin_pay_hook.ts`, `app/web/src/lib/constants.ts`, `app/web/src/env.js`, `app/web/package.json`
  - Do: (1) Run `anchor build` in project root to generate IDL + types. (2) Copy IDL JSON to `app/web/src/idl/`. (3) Copy TypeScript types to `app/web/src/types/`. (4) Install Solana deps: `@solana/web3.js@^1.98`, `@solana/wallet-adapter-base`, `@solana/wallet-adapter-react`, `@solana/wallet-adapter-react-ui`, `@coral-xyz/anchor`. (5) Create `lib/constants.ts` with program IDs, RPC endpoint from env. (6) Add `NEXT_PUBLIC_SOLANA_RPC_URL` to `env.js` T3 schema with devnet default.
  - Verify: `ls app/web/src/idl/*.json app/web/src/types/gherkin_pay*.ts` shows all 4 files; `cd app/web && bun install` exits 0; `grep NEXT_PUBLIC_SOLANA_RPC_URL app/web/src/env.js` matches
  - Done when: IDL files, types, constants, and deps are all in place; env schema updated

- [x] **T02: Wire wallet provider, Anchor hook, and wallet button into layouts** `est:45m`
  - Why: This is the core integration — wallet connectivity and Anchor program access wired into the App Router component tree.
  - Files: `app/web/src/components/wallet-provider.tsx`, `app/web/src/lib/anchor.ts`, `app/web/src/components/wallet-button.tsx`, `app/web/src/app/layout.tsx`, `app/web/src/app/(console)/layout.tsx`, `app/web/next.config.js`
  - Do: (1) Create `wallet-provider.tsx` as `"use client"` component wrapping ConnectionProvider → WalletProvider → WalletModalProvider with `wallets={[]}` for Wallet Standard auto-detection. Import `@solana/wallet-adapter-react-ui/styles.css`. (2) Create `lib/anchor.ts` with `useAnchorProgram()` hook using `useConnection()` + `useAnchorWallet()` → `AnchorProvider` → typed `Program` instances; return null when disconnected. (3) Create `wallet-button.tsx` as a thin `"use client"` wrapper around `WalletMultiButton`. (4) Wire `WalletContextProvider` into root `layout.tsx` wrapping `TRPCReactProvider`. (5) Replace placeholder `<Button>Connect Wallet</Button>` in `(console)/layout.tsx` with the wallet button component. (6) Add webpack externals for `pino-pretty`, `lokijs`, `encoding` to `next.config.js`. (7) Run `bun run build` and `bun run typecheck` — fix any errors.
  - Verify: `cd app/web && bun run build` exits 0; `cd app/web && bun run typecheck` exits 0; `grep -r "from ['\"]@/" app/web/src/lib/anchor.ts app/web/src/components/wallet-provider.tsx` returns empty (no `@/` imports)
  - Done when: Build and typecheck pass clean; wallet provider wired into root layout; wallet button in sidebar; Anchor hook exports typed programs

## Files Likely Touched

- `app/web/src/idl/gherkin_pay.json`
- `app/web/src/idl/gherkin_pay_hook.json`
- `app/web/src/types/gherkin_pay.ts`
- `app/web/src/types/gherkin_pay_hook.ts`
- `app/web/src/lib/constants.ts`
- `app/web/src/lib/anchor.ts`
- `app/web/src/components/wallet-provider.tsx`
- `app/web/src/components/wallet-button.tsx`
- `app/web/src/env.js`
- `app/web/src/app/layout.tsx`
- `app/web/src/app/(console)/layout.tsx`
- `app/web/next.config.js`
- `app/web/package.json`
