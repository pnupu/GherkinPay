---
estimated_steps: 5
estimated_files: 3
---

# T01: Wire compliance query, mutation, and page with on-chain writes

**Slice:** S03 — Admin Flows
**Milestone:** M003

## Description

Create the compliance data layer (query hook + mutation hook) and rewrite the Compliance page from a server component with hardcoded data to a client component with live on-chain reads/writes via `hookProgram`. This delivers R016 (compliance allowlist management).

The mutation calls `hookProgram.methods.setCompliance(isAllowed)` with accounts: authority (connected wallet), mint (USDC_MINT), wallet (target), compliance_entry (PDA), system_program. The PDA is derived from seeds `["compliance", mint, wallet]` using `GHERKIN_PAY_HOOK_PROGRAM_ID`.

**Key patterns to follow:**
- Mutation hook: follow `app/web/src/lib/mutations/crank-time.ts` pattern — `useMutation` wrapping `(hookProgram.methods as any).setCompliance(isAllowed).accounts({...}).rpc()`, invalidate queries on success, decode errors on failure
- Query hook: use `(hookProgram.account as any).complianceEntry.fetch(pda)` — handle account-not-found returning null (per KNOWLEDGE.md, wrong account names return empty silently)
- All hookProgram access uses `as any` casts with eslint-disable header (per KNOWLEDGE.md Anchor 0.32 pattern)
- Wallet input: wrap `new PublicKey(userInput)` in try/catch — invalid base58 throws

**Relevant skills:** react-best-practices (React Query hooks, component patterns)

## Steps

1. Create `app/web/src/lib/queries/compliance.ts`:
   - Export `useComplianceEntry(walletAddress: string | null)` using `useQuery`
   - Derive PDA using `PublicKey.findProgramAddressSync([Buffer.from("compliance"), USDC_MINT.toBuffer(), new PublicKey(walletAddress).toBuffer()], GHERKIN_PAY_HOOK_PROGRAM_ID)`
   - Fetch via `(hookProgram.account as any).complianceEntry.fetch(pda)`
   - Return `ComplianceEntry | null`; catch account-not-found and return null
   - Query key: `["compliance-entry", walletAddress]`
   - Only enabled when `hookProgram` and `walletAddress` are truthy

2. Create `app/web/src/lib/mutations/set-compliance.ts`:
   - Export `useSetCompliance()` following `crank-time.ts` pattern
   - Params: `{ walletAddress: string, isAllowed: boolean }`
   - Derive ComplianceEntry PDA (same as query)
   - Call `(hookProgram.methods as any).setCompliance(isAllowed).accounts({ authority: provider.wallet.publicKey, mint: USDC_MINT, wallet: new PublicKey(walletAddress), complianceEntry: pda, systemProgram: SystemProgram.programId }).rpc()`
   - On success: invalidate `["compliance-entry", walletAddress]`
   - On error: decode via `decodeAnchorError()`

3. Rewrite `app/web/src/app/(console)/compliance/page.tsx`:
   - Add `"use client"` directive
   - Add wallet connection check (show "Connect wallet" message if not connected)
   - Lookup section: text input for wallet address + "Check Status" button → shows current ComplianceEntry status (allowed/blocked/not registered)
   - Set compliance section: wallet address input + Allow/Block radio or toggle + "Submit" button
   - Validate wallet address with try/catch on `new PublicKey()` before submitting — show inline error for invalid addresses
   - Show `TransactionStatus` component for mutation feedback
   - Use existing CSS classes (panel, table-wrap, topbar, page-title etc.) to match existing page structure

4. Ensure all imports resolve and types are correct. Add eslint-disable comments for `as any` casts on hookProgram access.

5. Run `npx tsc --noEmit` and `npm run build` in `app/web/` to verify.

## Must-Haves

- [ ] `useComplianceEntry(wallet)` query hook fetches ComplianceEntry by PDA and handles not-found
- [ ] `useSetCompliance()` mutation hook sends on-chain transaction via hookProgram
- [ ] PDA derivation uses correct seeds: `["compliance", USDC_MINT, wallet]` with `GHERKIN_PAY_HOOK_PROGRAM_ID`
- [ ] Compliance page is `"use client"` with wallet connection gating
- [ ] Wallet address input validates base58 before submission
- [ ] TransactionStatus shows mutation feedback
- [ ] Build passes with zero type errors

## Verification

- `cd app/web && npx tsc --noEmit` — zero type errors
- `cd app/web && npm run build` — production build succeeds
- `grep -q "use client" app/web/src/app/\(console\)/compliance/page.tsx`
- `grep -q "hookProgram" app/web/src/lib/mutations/set-compliance.ts`
- `grep -q "complianceEntry" app/web/src/lib/queries/compliance.ts`

## Inputs

- `app/web/src/lib/mutations/crank-time.ts` — mutation hook pattern to follow
- `app/web/src/lib/anchor.ts` — `useAnchorProgram()` providing `hookProgram`
- `app/web/src/lib/constants.ts` — `GHERKIN_PAY_HOOK_PROGRAM_ID`
- `app/web/src/lib/token.ts` — `USDC_MINT`
- `app/web/src/lib/errors.ts` — `decodeAnchorError()`
- `app/web/src/components/transaction-status.tsx` — `TransactionStatus` component
- `app/web/src/types/gherkin_pay_hook.ts` — `ComplianceEntry` interface
- `app/web/src/app/(console)/compliance/page.tsx` — existing mock page to rewrite

## Observability Impact

- **New console signals:** `[GherkinPay] setCompliance wallet=… isAllowed=…` logs intent before RPC; `[GherkinPay] setCompliance tx: {sig}` confirms success; `[GherkinPay] setCompliance failed: {decoded}` on error; `[GherkinPay] ComplianceEntry not found for {wallet}` on query miss.
- **React Query cache:** `["compliance-entry", walletAddress]` key is observable in devtools — shows fetched ComplianceEntry data or null.
- **Failure visibility:** TransactionStatus component renders decoded Anchor errors inline. Invalid wallet addresses produce validation error before any network call.
- **Inspection:** To check compliance status for a wallet, call `useComplianceEntry(address)` or inspect the `["compliance-entry", address]` React Query cache key.

## Expected Output

- `app/web/src/lib/queries/compliance.ts` — new query hook for ComplianceEntry lookup
- `app/web/src/lib/mutations/set-compliance.ts` — new mutation hook for setCompliance instruction
- `app/web/src/app/(console)/compliance/page.tsx` — rewritten as client component with live on-chain reads/writes
