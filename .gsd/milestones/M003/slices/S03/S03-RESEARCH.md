# S03: Admin Flows — Research

**Date:** 2026-03-20

## Summary

S03 replaces two mock-data pages (Compliance, Relayers) with live on-chain writes and a localStorage-based registry. The work is straightforward — it follows the exact mutation hook pattern used by every other M003 instruction and touches only two independent pages with no shared state. There are no unfamiliar APIs; `hookProgram` is already wired in `useAnchorProgram()`, PDA derivation for ComplianceEntry is a standard 3-seed `findProgramAddressSync`, and the relayer registry is explicitly localStorage per D009.

Requirements covered: **R016** (compliance allowlist management) and **R017** (relayer registration).

## Recommendation

Build compliance first (it's the on-chain write with real verification), then relayers (pure localStorage, lowest risk). Each page is fully independent — they could even be built in parallel. Both pages need to be converted from server components (no `"use client"` directive, hardcoded data) to client components with wallet connection, mutation hooks, and query hooks.

## Implementation Landscape

### Key Files

**Existing (modify):**
- `app/web/src/app/(console)/compliance/page.tsx` — currently a server component with hardcoded mock data (3 fake entries). Must become `"use client"`, add wallet connection, compliance query, and set-compliance form.
- `app/web/src/app/(console)/relayers/page.tsx` — currently a server component with hardcoded mock data (3 fake relayers with uptime/events). Must become `"use client"`, read/write localStorage registry, and add registration form.

**Existing (consume as-is):**
- `app/web/src/lib/anchor.ts` — `useAnchorProgram()` returns `{ program, hookProgram, connection, provider }`. The `hookProgram` is already instantiated from `gherkin_pay_hook.json` IDL.
- `app/web/src/lib/constants.ts` — `GHERKIN_PAY_HOOK_PROGRAM_ID` = `3pG9tTyExGA3C7sdvw5AcUvfmwydtRCLV22KPb6SfYRc`
- `app/web/src/lib/token.ts` — `USDC_MINT` pubkey (needed as seed for ComplianceEntry PDA)
- `app/web/src/lib/errors.ts` — `decodeAnchorError()` already handles hook errors (HookErrorCode 6000/6001 from types)
- `app/web/src/components/transaction-status.tsx` — `TransactionStatus` component for mutation feedback
- `app/web/src/types/gherkin_pay_hook.ts` — `ComplianceEntry` interface (`{ isAllowed: boolean, bump: number }`)

**New files to create:**
- `app/web/src/lib/mutations/set-compliance.ts` — `useSetCompliance()` mutation hook calling `hookProgram.methods.setCompliance(isAllowed)` with accounts: authority (wallet), mint (USDC_MINT), wallet (target), compliance_entry (PDA), system_program
- `app/web/src/lib/queries/compliance.ts` — `useComplianceEntry(wallet)` query hook fetching a single ComplianceEntry by PDA, and optionally `useComplianceEntries()` for bulk lookup
- `app/web/src/lib/relayer-registry.ts` — localStorage read/write for relayer entries: `{ pubkey: string, label: string, createdAt: number }[]`

### IDL Details for setCompliance

From `gherkin_pay_hook.json`:
- **Instruction:** `set_compliance`
- **Args:** `is_allowed: bool`
- **Accounts:** authority (signer, writable), mint, wallet, compliance_entry (PDA, writable), system_program
- **PDA seeds:** `["compliance", mint, wallet]` — uses `init_if_needed`, so first call creates the account (authority pays rent)
- **Account type:** `ComplianceEntry { is_allowed: bool, bump: u8 }`

### ComplianceEntry PDA Derivation

```typescript
PublicKey.findProgramAddressSync(
  [Buffer.from("compliance"), mint.toBuffer(), wallet.toBuffer()],
  GHERKIN_PAY_HOOK_PROGRAM_ID
)
```

Where `mint` = `USDC_MINT` from `lib/token.ts` and `wallet` = the target wallet being allowed/blocked.

### Build Order

1. **`set-compliance.ts` mutation hook** — follows the exact pattern from `crank-time.ts`: `useMutation` wrapping `(hookProgram.methods as any).setCompliance(isAllowed).accounts({...}).rpc()`, with `queryClient.invalidateQueries` on success. Uses `hookProgram` instead of `program`. This is the riskiest piece (on-chain write to a different program).

2. **`compliance.ts` query hook** — fetch ComplianceEntry by PDA. Use `(hookProgram.account as any).complianceEntry.fetch(pda)`. Handle account-not-found (returns null → "Not registered"). Per KNOWLEDGE.md, account accessor name must match IDL exactly (`complianceEntry`).

3. **Compliance page rewrite** — replace hardcoded data with: (a) a form to enter a wallet address and toggle allowed/blocked, (b) a lookup section showing current status for a given wallet, (c) TransactionStatus feedback. The page becomes a client component.

4. **`relayer-registry.ts` localStorage helper** — simple CRUD: `getRelayers(): RelayerEntry[]`, `addRelayer(entry)`, `removeRelayer(pubkey)`. Store under key `"gherkinpay:relayers"`.

5. **Relayers page rewrite** — replace hardcoded data with: (a) registration form (pubkey + label), (b) table of registered relayers from localStorage, (c) delete action per row.

### Verification Approach

- **Compliance (on-chain):** Connect wallet on devnet → enter a wallet address → click "Allow" → TransactionStatus shows success → re-query the ComplianceEntry PDA → `isAllowed === true` shown in UI. Toggle to "Block" → re-query → `isAllowed === false`. Verify on Solana Explorer that the ComplianceEntry account exists at the expected PDA.
- **Relayers (localStorage):** Register a relayer (pubkey + label) → appears in table → refresh page → still in table. Delete → gone.
- **Build:** `npm run build` passes with no type errors on both pages.

## Constraints

- `setCompliance` uses `init_if_needed` — the first call for a new wallet creates a PDA account and the authority (connected wallet) pays rent (~0.002 SOL). The UI should note this cost.
- The `mint` account for ComplianceEntry is always `USDC_MINT` (D003) — there is no mint selector needed.
- The `wallet` input in the compliance form is a base58 pubkey string. Must validate as a valid Solana pubkey before submitting.
- `hookProgram` uses `gherkin_pay_hook.json` IDL cast as `Idl` (same pattern as main program per KNOWLEDGE.md) — all account/method access is `(hookProgram.account as any)` / `(hookProgram.methods as any)`.
- Error codes for the hook program are different from the main program: `SenderNotCompliant = 6000`, `ReceiverNotCompliant = 6001`. The existing `decodeAnchorError()` won't decode these unless the hook error map is added. The hook errors are transfer-time errors, not setCompliance errors — setCompliance itself has no custom errors (it just does `init_if_needed` + set bool). Standard Anchor/Solana errors (insufficient funds, etc.) will surface via the fallback path in `decodeAnchorError`.

## Common Pitfalls

- **ComplianceEntry PDA account name** — must be `complianceEntry` (camelCase) in `hookProgram.account` accessor. Per KNOWLEDGE.md, wrong names return empty/null silently with no error.
- **Wallet input validation** — `new PublicKey(userInput)` throws on invalid base58. Wrap in try/catch and show a form error, don't let it crash the mutation.
- **localStorage SSR** — Next.js server-side rendering has no `localStorage`. The relayer registry helper must check `typeof window !== "undefined"` or the relayers page must be a client component loaded via dynamic import with `ssr: false`. Since the page will be `"use client"`, it only runs in the browser, but any module-level localStorage access in an imported utility would still break during SSR module evaluation.
