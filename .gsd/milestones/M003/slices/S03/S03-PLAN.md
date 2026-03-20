# S03: Admin Flows

**Goal:** Replace mock-data Compliance and Relayers pages with live on-chain writes and localStorage-based registry, completing admin functionality for devnet.
**Demo:** Admin connects wallet → enters a wallet address on Compliance page → clicks Allow → transaction confirms on devnet and ComplianceEntry PDA shows `isAllowed: true`. On Relayers page, operator enters pubkey + label → entry appears in table → persists across page refresh.

## Must-Haves

- `useSetCompliance()` mutation hook calling `hookProgram.methods.setCompliance(isAllowed)` with correct PDA derivation (`["compliance", mint, wallet]`)
- `useComplianceEntry(wallet)` query hook fetching ComplianceEntry by PDA from hookProgram
- Compliance page is a client component with wallet connection, lookup form, set-compliance form, and TransactionStatus feedback
- Wallet address input validates as a valid Solana base58 pubkey before submission
- Relayer localStorage registry with `getRelayers()`, `addRelayer()`, `removeRelayer()` — key `"gherkinpay:relayers"`
- Relayers page is a client component with registration form (pubkey + label), table of entries, delete action per row
- `npm run build` passes with zero type errors

## Verification

- `cd app/web && npx tsc --noEmit` — zero type errors
- `cd app/web && npm run build` — production build succeeds
- `grep -q "use client" app/web/src/app/\(console\)/compliance/page.tsx` — compliance page is a client component
- `grep -q "use client" app/web/src/app/\(console\)/relayers/page.tsx` — relayers page is a client component
- `grep -q "hookProgram" app/web/src/lib/mutations/set-compliance.ts` — mutation uses hookProgram
- `grep -q "gherkinpay:relayers" app/web/src/lib/relayer-registry.ts` — localStorage key is correct

## Observability / Diagnostics

- **Console signals:** `[GherkinPay] setCompliance wallet=… isAllowed=…` and `[GherkinPay] setCompliance tx: …` on successful mutation; `[GherkinPay] setCompliance failed: …` on error; `[GherkinPay] ComplianceEntry not found for …` when lookup returns null.
- **Inspection surfaces:** React Query devtools → `["compliance-entry", walletAddress]` cache key shows fetched ComplianceEntry or null. Relayer data stored at `localStorage.getItem("gherkinpay:relayers")`.
- **Failure visibility:** TransactionStatus component renders inline error with decoded Anchor error message. Invalid wallet addresses show inline validation error before any on-chain call.
- **Redaction:** No private keys or sensitive data in console logs — only wallet public keys and transaction signatures.

## Integration Closure

- Upstream surfaces consumed: `app/web/src/lib/anchor.ts` (useAnchorProgram/hookProgram), `app/web/src/lib/constants.ts` (GHERKIN_PAY_HOOK_PROGRAM_ID), `app/web/src/lib/token.ts` (USDC_MINT), `app/web/src/lib/errors.ts` (decodeAnchorError), `app/web/src/components/transaction-status.tsx`, `app/web/src/types/gherkin_pay_hook.ts`
- New wiring introduced in this slice: ComplianceEntry PDA derivation, hookProgram mutation pattern, localStorage relayer registry
- What remains before the milestone is truly usable end-to-end: S01 and S02 completion (agreement detail view, cranks, permissioned actions)

## Tasks

- [x] **T01: Wire compliance query, mutation, and page with on-chain writes** `est:1h`
  - Why: Delivers R016 — admin compliance allowlist management with real devnet transactions via the hookProgram
  - Files: `app/web/src/lib/mutations/set-compliance.ts`, `app/web/src/lib/queries/compliance.ts`, `app/web/src/app/(console)/compliance/page.tsx`
  - Do: Create `useSetCompliance()` mutation hook following `crank-time.ts` pattern but using `hookProgram`. Create `useComplianceEntry(wallet)` query hook fetching ComplianceEntry by PDA. Rewrite compliance page as client component with: (a) lookup section — enter wallet address, see current status, (b) set-compliance form — wallet address + Allow/Block toggle + submit, (c) TransactionStatus feedback. Validate wallet input with try/catch around `new PublicKey()`. PDA seeds: `["compliance", USDC_MINT.toBuffer(), wallet.toBuffer()]` with `GHERKIN_PAY_HOOK_PROGRAM_ID`.
  - Verify: `cd app/web && npx tsc --noEmit && npm run build`
  - Done when: Compliance page builds, uses hookProgram for on-chain writes, validates wallet input, shows TransactionStatus

- [ ] **T02: Wire relayer localStorage registry and page** `est:45m`
  - Why: Delivers R017 — relayer registration with localStorage persistence per D009
  - Files: `app/web/src/lib/relayer-registry.ts`, `app/web/src/app/(console)/relayers/page.tsx`
  - Do: Create `relayer-registry.ts` with typed CRUD helpers: `getRelayers(): RelayerEntry[]`, `addRelayer(entry: {pubkey: string, label: string})`, `removeRelayer(pubkey: string)`. Store under `"gherkinpay:relayers"` key as JSON array with `createdAt` timestamp. Rewrite relayers page as client component with: (a) registration form — pubkey + label inputs + submit, (b) table showing all registered relayers with delete button per row, (c) validate pubkey as base58 before adding. Use `useState` with initial load from localStorage; no React Query needed since there's no async fetch.
  - Verify: `cd app/web && npx tsc --noEmit && npm run build`
  - Done when: Relayers page builds, reads/writes localStorage, validates pubkey input, shows registered relayers in table with delete

## Files Likely Touched

- `app/web/src/lib/mutations/set-compliance.ts` (new)
- `app/web/src/lib/queries/compliance.ts` (new)
- `app/web/src/lib/relayer-registry.ts` (new)
- `app/web/src/app/(console)/compliance/page.tsx` (rewrite)
- `app/web/src/app/(console)/relayers/page.tsx` (rewrite)
