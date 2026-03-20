# S02: Wallet Connect and Anchor Client — UAT

**Milestone:** M001
**Written:** 2026-03-19

## UAT Type

- UAT mode: human-experience
- Why this mode is sufficient: Wallet connect requires a real browser extension (Phantom or Solflare) to verify the end-to-end flow. Build/typecheck are already automated — the remaining proof is runtime interaction.

## Preconditions

1. Dev server running: `cd app/web && bun run dev`
2. Browser with Phantom or Solflare extension installed
3. Wallet configured for Solana devnet (Settings → Developer Settings → Change Network → Devnet)
4. App accessible at `http://localhost:3000`

## Smoke Test

Navigate to `http://localhost:3000/agreements`. A "Select Wallet" button should be visible in the left sidebar. Clicking it should open a wallet selection modal.

## Test Cases

### 1. Wallet modal opens from sidebar button

1. Navigate to `http://localhost:3000/agreements`
2. Locate the wallet button in the left sidebar (should say "Select Wallet" or similar)
3. Click the wallet button
4. **Expected:** A modal appears listing available wallets (Phantom, Solflare, or any Wallet Standard-compatible extension installed)

### 2. Wallet connects successfully

1. Open the wallet modal (Test Case 1)
2. Select Phantom (or Solflare)
3. Approve the connection in the wallet extension popup
4. **Expected:** The sidebar button now shows a truncated wallet address (e.g., `AbCd...xYz1`). The modal closes.

### 3. Connected address persists across page navigation

1. Connect wallet (Test Case 2)
2. Navigate to `/milestones` using the sidebar
3. Navigate to `/compliance`
4. Navigate back to `/agreements`
5. **Expected:** The wallet button continues to show the connected address on every page — no re-connection required.

### 4. Wallet disconnects cleanly

1. Connect wallet (Test Case 2)
2. Click the wallet button showing the address
3. Select "Disconnect" from the dropdown
4. **Expected:** The button reverts to "Select Wallet". No console errors.

### 5. Wallet button is visible on all console pages

1. Connect or stay disconnected
2. Visit each page: `/agreements`, `/milestones`, `/compliance`, `/relayers`, `/activity`
3. **Expected:** The wallet button is visible in the sidebar on every page.

### 6. No console errors on page load

1. Open browser developer tools (Console tab)
2. Navigate to `http://localhost:3000/agreements`
3. **Expected:** No JavaScript errors in the console related to wallet adapter, Anchor, or missing modules. Warnings about "pino-pretty" or similar are acceptable (they're webpack externals).

## Edge Cases

### No wallet extension installed

1. Open the app in a browser without any Solana wallet extension
2. Click the wallet button
3. **Expected:** The modal opens but shows no wallets, or shows a "No wallets found" message. No crash.

### Wallet on wrong network

1. Set wallet to mainnet-beta instead of devnet
2. Connect wallet
3. **Expected:** Wallet connects (network mismatch doesn't prevent connection). The app targets devnet via RPC endpoint — transactions would fail but the connection itself should work.

### Rapid connect/disconnect

1. Connect wallet
2. Immediately disconnect
3. Immediately reconnect
4. **Expected:** Each state transition is clean — button text updates correctly, no stale state.

## Failure Signals

- Wallet button missing from sidebar → `WalletButton` not rendered in `(console)/layout.tsx`
- Modal doesn't open → `WalletContextProvider` not wrapping the app in root `layout.tsx`
- "Module not found" error in console → missing webpack external in `next.config.js`
- `useAnchorProgram()` always returns null even when connected → provider ordering issue in `layout.tsx`
- TypeScript errors on dev server start → IDL types or imports broken

## Requirements Proved By This UAT

- R001 — Wallet connects, address visible in UI, persists across navigation, disconnects cleanly

## Not Proven By This UAT

- R001 runtime proof is not automatable — requires human with wallet extension
- Anchor program client functionality (useAnchorProgram returning real Program instances) is proven by build/typecheck but not exercised at runtime until S03+ fetches on-chain data
- R006 shadcn adoption in S02 is minimal (wallet button wrapper only) — not a meaningful proof point

## Notes for Tester

- The wallet modal styling comes from `@solana/wallet-adapter-react-ui` — it may look slightly different from the GherkinPay dark theme. This is expected and can be themed later.
- If Phantom shows a "suspicious site" warning for localhost, click through it — this is normal for local development.
- The devnet RPC endpoint defaults to `https://api.devnet.solana.com` if `NEXT_PUBLIC_SOLANA_RPC_URL` is not set in `.env`.
