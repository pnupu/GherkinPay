---
estimated_steps: 7
estimated_files: 6
---

# T02: Wire wallet provider, Anchor hook, and wallet button into layouts

**Slice:** S02 — Wallet Connect and Anchor Client
**Milestone:** M001

## Description

Create the wallet provider client component, the `useAnchorProgram()` hook, and a wallet button component. Wire the provider into the root App Router layout and replace the placeholder "Connect Wallet" button in the console sidebar. Add webpack externals to `next.config.js` for Node.js-only modules that Solana packages pull in transitively. Verify with `bun run build` and `bun run typecheck`.

This is the integration task — after this, the wallet connect flow works end-to-end in the browser and the Anchor program client is available for all downstream slices (S03–S06).

## Steps

1. Create `app/web/src/components/wallet-provider.tsx`:
   - Must be a `"use client"` component
   - Import and re-export `ConnectionProvider`, `WalletProvider`, `WalletModalProvider`
   - Use `wallets` memo returning `[]` — Wallet Standard auto-detects Phantom/Solflare without explicit adapters
   - Import `@solana/wallet-adapter-react-ui/styles.css` (must be in this client component, not in a server component or globals.css)
   - Get RPC endpoint from `~/lib/constants` (`DEVNET_RPC_ENDPOINT`)
   - Wrap children: `ConnectionProvider` → `WalletProvider` → `WalletModalProvider`

2. Create `app/web/src/lib/anchor.ts`:
   - `"use client"` directive (uses React hooks)
   - Import `useConnection` from `@solana/wallet-adapter-react`, `useAnchorWallet` from `@solana/wallet-adapter-react`
   - Import `AnchorProvider`, `Program` from `@coral-xyz/anchor`
   - Import IDL JSON files: `import gherkinPayIdl from "~/idl/gherkin_pay.json"` and hook IDL similarly
   - Import TypeScript types from `~/types/gherkin_pay` and `~/types/gherkin_pay_hook`
   - Import `PROGRAM_ID`, `HOOK_PROGRAM_ID` from `~/lib/constants`
   - Export `useAnchorProgram()` hook that:
     - Gets `connection` from `useConnection()` and `wallet` from `useAnchorWallet()`
     - If wallet is null/undefined, returns `{ program: null, hookProgram: null }`
     - Otherwise creates `AnchorProvider` with `{ commitment: "confirmed" }` opts
     - Creates `Program<GherkinPay>` and `Program<GherkinPayHook>` instances
     - Memoizes with `useMemo` on `[connection, wallet]`
     - Returns `{ program, hookProgram }`
   - **Important:** `verbatimModuleSyntax` is enabled in tsconfig. Use `import type` for type-only imports. The IDL JSON import needs to work with `resolveJsonModule: true` — import the JSON directly, then cast as needed for the `Program` constructor.

3. Create `app/web/src/components/wallet-button.tsx`:
   - `"use client"` component (required because `(console)/layout.tsx` is a server component)
   - Import `WalletMultiButton` from `@solana/wallet-adapter-react-ui`
   - Export a `WalletButton` component that renders `<WalletMultiButton />` with appropriate styling to fit the sidebar (e.g., `className="!bg-transparent"` or similar override to blend with GherkinPay theme)

4. Update `app/web/src/app/layout.tsx`:
   - Import `WalletContextProvider` from `~/components/wallet-provider`
   - Wrap inside the `<body>` tag: `<WalletContextProvider>` around `<TRPCReactProvider>{children}</TRPCReactProvider>` (wallet provider should be the outermost client provider since Anchor needs the connection)

5. Update `app/web/src/app/(console)/layout.tsx`:
   - Remove the `import { Button } from "~/components/ui/button"` (only if Button is no longer used elsewhere in this file)
   - Import `WalletButton` from `~/components/wallet-button`
   - Replace `<Button variant="outline" size="sm">Connect Wallet</Button>` with `<WalletButton />`

6. Update `app/web/next.config.js` to add webpack externals:
   ```js
   const config = {
     webpack: (config, { isServer }) => {
       if (!isServer) {
         config.resolve.fallback = {
           ...config.resolve.fallback,
           fs: false,
           net: false,
           tls: false,
         };
       }
       config.externals.push("pino-pretty", "lokijs", "encoding");
       return config;
     },
   };
   ```
   These externals prevent webpack from trying to bundle Node.js-only modules that `@solana/web3.js` and its transitive deps reference.

7. Run `cd app/web && bun run build` — must exit 0. If build fails:
   - Module not found errors → add more externals or resolve fallbacks
   - Type errors → fix imports, check `verbatimModuleSyntax` compliance
   - CSS errors → verify wallet adapter styles import location
   Then run `cd app/web && bun run typecheck` — must exit 0 (must run after build per project knowledge).

## Must-Haves

- [ ] `wallet-provider.tsx` is `"use client"`, imports wallet adapter styles, uses `wallets={[]}` for auto-detection
- [ ] `anchor.ts` exports `useAnchorProgram()` returning typed `Program` instances or null
- [ ] `wallet-button.tsx` is `"use client"`, wraps `WalletMultiButton`
- [ ] Root `layout.tsx` wraps children with `WalletContextProvider`
- [ ] Console `(console)/layout.tsx` uses `WalletButton` instead of placeholder
- [ ] `next.config.js` has webpack externals for `pino-pretty`, `lokijs`, `encoding`
- [ ] `bun run build` exits 0
- [ ] `bun run typecheck` exits 0
- [ ] All new files use `~/` imports, never `@/`

## Observability Impact

- **Wallet state:** `useWallet()` hook exposes `connected`, `publicKey`, `disconnect` — any downstream component can inspect connection status
- **Anchor availability:** `useAnchorProgram()` returns `{ program: null, hookProgram: null }` when wallet disconnected, non-null typed `Program` instances when connected — null check is the inspection surface
- **Build failures:** Webpack externals misconfiguration surfaces as `Module not found` errors in `bun run build` output; missing IDL files surface as TypeScript import errors
- **Env validation:** Missing or malformed `NEXT_PUBLIC_SOLANA_RPC_URL` triggers T3 Zod validation error at app startup with clear error message

## Verification

- `cd app/web && bun run build` exits 0
- `cd app/web && bun run typecheck` exits 0 (run after build)
- `grep "use client" app/web/src/components/wallet-provider.tsx` — present
- `grep "use client" app/web/src/lib/anchor.ts` — present
- `grep "use client" app/web/src/components/wallet-button.tsx` — present
- `grep "WalletContextProvider" app/web/src/app/layout.tsx` — wired in
- `grep "WalletButton\|WalletMultiButton" app/web/src/app/\(console\)/layout.tsx` — wallet button in sidebar
- `grep "pino-pretty" app/web/next.config.js` — externals configured
- `grep -r "from ['\"]@/" app/web/src/lib/anchor.ts app/web/src/components/wallet-provider.tsx app/web/src/components/wallet-button.tsx` — empty (no @/ imports)

## Inputs

- `app/web/src/idl/gherkin_pay.json` — IDL JSON from T01
- `app/web/src/idl/gherkin_pay_hook.json` — hook IDL JSON from T01
- `app/web/src/types/gherkin_pay.ts` — TypeScript types from T01
- `app/web/src/types/gherkin_pay_hook.ts` — hook types from T01
- `app/web/src/lib/constants.ts` — `PROGRAM_ID`, `HOOK_PROGRAM_ID`, `DEVNET_RPC_ENDPOINT` from T01
- `app/web/src/env.js` — env schema with `NEXT_PUBLIC_SOLANA_RPC_URL` from T01
- `app/web/src/app/layout.tsx` — root layout, currently wraps with `TRPCReactProvider`
- `app/web/src/app/(console)/layout.tsx` — console layout with placeholder `<Button>Connect Wallet</Button>` from S01
- `app/web/next.config.js` — bare config, needs webpack externals added

## Expected Output

- `app/web/src/components/wallet-provider.tsx` — client component providing wallet context to entire app
- `app/web/src/lib/anchor.ts` — `useAnchorProgram()` hook for typed program access
- `app/web/src/components/wallet-button.tsx` — thin client wrapper for `WalletMultiButton`
- `app/web/src/app/layout.tsx` — updated with `WalletContextProvider` wrapping
- `app/web/src/app/(console)/layout.tsx` — updated with real wallet button
- `app/web/next.config.js` — updated with webpack externals
- Clean `bun run build` and `bun run typecheck`
