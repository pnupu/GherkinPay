---
id: S02
milestone: M001
status: ready
---

# S02: Wallet Connect and Anchor Client — Context

## Goal

Wire `@solana/wallet-adapter-react` into the App Router with a client boundary, render a wallet connect button in the console header that shows a full address + disconnect dropdown when connected, and initialise typed Anchor program clients for both programs pointing at devnet.

## Why this Slice

S02 is the second prerequisite. S03–S06 all need `useAnchorProgram()` to fetch on-chain data. The wallet provider must be live and the Anchor client must instantiate correctly before any page can show real data. Without S02, every downstream slice is blocked.

## Scope

### In Scope

- Install wallet adapter packages: `@solana/wallet-adapter-react`, `@solana/wallet-adapter-wallets`, `@solana/web3.js`, `@coral-xyz/anchor`
- `WalletContextProvider` client component wrapping `ConnectionProvider` + `WalletProvider` + `WalletModalProvider` from `@solana/wallet-adapter-react-ui`
- Provider wired into `app/web/src/app/layout.tsx` (or the console layout) with a `"use client"` boundary
- Wallet connect button in the console layout header: shows shortened address (e.g. `9xKj...mR4P`) + a small dropdown with a disconnect option when connected; shows "Connect Wallet" when disconnected
- Use the adapter's built-in `WalletModal` for wallet selection (no custom dialog needed)
- `app/web/src/lib/constants.ts` — `PROGRAM_ID`, `HOOK_PROGRAM_ID`, `DEVNET_USDC_MINT`, `RPC_ENDPOINT` constants
- `app/web/src/lib/anchor.ts` — `useAnchorProgram()` hook returning typed `Program<GherkinPay>` and `Program<GherkinPayHook>`
- IDL consumed directly from `target/idl/gherkin_pay.json` and `target/idl/gherkin_pay_hook.json` (Anchor standard location in monorepo root)
- TypeScript types generated from IDL via `@coral-xyz/anchor`'s `Idl` inference (no separate type-gen step needed for M001)
- `NEXT_PUBLIC_RPC_ENDPOINT` env var defaulting to `https://api.devnet.solana.com`
- Remove the smoke-test "Connect Wallet" placeholder Button from the sidebar (added in S01) and replace with the real wallet connect UI in the header topbar

### Out of Scope

- Custom wallet selection dialog (using adapter's built-in `WalletModal`)
- Paid RPC providers — public devnet endpoint is sufficient for M001
- Any on-chain reads beyond confirming the Anchor client instantiates without error
- Mainnet config
- Any write transactions

## Constraints

- Next.js 15 App Router: wallet providers require `"use client"` boundary; the `WalletContextProvider` must be a client component; server components must remain server-side (D006)
- Path alias `~/` throughout — all new files use `~/lib/...` imports
- Package manager is `bun`
- The console layout's existing `app-shell` / `sidebar` / `content` CSS class structure must be preserved; only the header topbar area is modified
- shadcn `Button` from `~/components/ui/button` is the base for the wallet connect button (D006 rationale — S01 produced this)

## Integration Points

### Consumes

- `app/web/src/components/ui/button.tsx` — shadcn Button used for the wallet connect button
- `~/lib/utils` (`cn()`) — class composition in new components
- `target/idl/gherkin_pay.json` — IDL for PaymentAgreement + ConditionAccount program
- `target/idl/gherkin_pay_hook.json` — IDL for ComplianceEntry hook program
- `app/web/src/app/(console)/layout.tsx` — existing console shell; wallet button added to topbar area

### Produces

- `app/web/src/components/wallet-provider.tsx` — `WalletContextProvider` client component
- `app/web/src/components/wallet-button.tsx` — connect/disconnect button with address display and dropdown
- `app/web/src/lib/constants.ts` — `PROGRAM_ID`, `HOOK_PROGRAM_ID`, `DEVNET_USDC_MINT`, `RPC_ENDPOINT`
- `app/web/src/lib/anchor.ts` — `useAnchorProgram()` hook returning `{ gherkinPay: Program<GherkinPay>, gherkinPayHook: Program<GherkinPayHook> }`
- Updated `app/web/src/app/(console)/layout.tsx` — real wallet button wired in topbar; smoke-test Button removed
- Updated `app/web/src/app/layout.tsx` — `WalletContextProvider` wrapping the app

## Open Questions

- Exact IDL import path in TypeScript: `target/idl/` is outside `app/web/src/` — needs a relative import like `"../../../../target/idl/gherkin_pay.json"` or a tsconfig path alias. Current thinking: add a `~idl/*` alias in tsconfig pointing to `../../target/idl/` so imports read `~idl/gherkin_pay.json`. This avoids fragile relative paths.
- `DEVNET_USDC_MINT` for Token-2022: the standard devnet USDC is classic SPL (`4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`), but GherkinPay uses Token-2022. Need to confirm the correct Token-2022 devnet mint — research phase should resolve this before planning.
- Wallet button dropdown: whether to use a Radix/shadcn `DropdownMenu` component or a custom popover. Current thinking: add `shadcn dropdown-menu` component in this slice and use it for the disconnect option.
