---
id: S03
parent: M003
milestone: M003
provides:
  - useSetCompliance mutation hook for on-chain compliance allowlist management via hookProgram
  - useComplianceEntry query hook for ComplianceEntry PDA lookup
  - deriveComplianceEntryPda shared PDA derivation helper
  - localStorage-based relayer registry with typed CRUD helpers (getRelayers, addRelayer, removeRelayer)
  - Live Compliance page with wallet gating, lookup, set-compliance forms, and TransactionStatus feedback
  - Live Relayers page with registration form, pubkey validation, table display, and delete actions
requires:
  - slice: M001/S01
    provides: useAnchorProgram (hookProgram variant), TransactionStatus component, design system tokens
  - slice: M001/S02
    provides: wallet adapter context
affects:
  - none (S03 operates on standalone admin pages with no downstream slice consumers)
key_files:
  - app/web/src/lib/queries/compliance.ts
  - app/web/src/lib/mutations/set-compliance.ts
  - app/web/src/app/(console)/compliance/page.tsx
  - app/web/src/lib/relayer-registry.ts
  - app/web/src/app/(console)/relayers/page.tsx
key_decisions:
  - D009: localStorage for relayer registry (adequate for devnet, no backend needed)
  - Record<string, unknown> cast in type guard for ESLint no-unsafe-member-access compliance
  - Exported deriveComplianceEntryPda as shared helper so mutation imports from query module
patterns_established:
  - hookProgram mutation pattern (same shape as program mutations but using hookProgram from useAnchorProgram)
  - ComplianceEntry PDA derivation shared between query and mutation via exported function
  - localStorage registry pattern with SSR-safe guards, shape validation on parse, and duplicate prevention
observability_surfaces:
  - "[GherkinPay] setCompliance wallet=… isAllowed=…" console log on mutation start
  - "[GherkinPay] setCompliance tx: {sig}" on success
  - "[GherkinPay] setCompliance failed: {decoded}" on failure
  - "[GherkinPay] ComplianceEntry not found for {wallet}" on query miss
  - React Query cache key ["compliance-entry", walletAddress]
  - localStorage key "gherkinpay:relayers" inspectable via browser devtools
drill_down_paths:
  - .gsd/milestones/M003/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M003/slices/S03/tasks/T02-SUMMARY.md
duration: 24m
verification_result: passed
completed_at: 2026-03-20
---

# S03: Admin Flows

**Live compliance allowlist management via hookProgram on-chain writes and localStorage-based relayer registration, replacing mock-data admin pages with functional devnet UI**

## What Happened

Two tasks replaced the mock-data Compliance and Relayers pages with working implementations:

**T01 — Compliance on-chain writes:** Created `useComplianceEntry(wallet)` query hook that derives the ComplianceEntry PDA from seeds `["compliance", USDC_MINT, wallet]` and fetches via `hookProgram.account.complianceEntry.fetch(pda)`. Created `useSetCompliance()` mutation hook wrapping `hookProgram.methods.setCompliance(isAllowed)` with correct account resolution (authority, mint, wallet, PDA, systemProgram). The PDA derivation is exported as `deriveComplianceEntryPda()` so both modules share it. Rewrote the Compliance page as a `"use client"` component with wallet connection gating, a lookup section (enter address → see Allowed/Blocked/Not Registered), a set-compliance form (address + Allow/Block radio + Submit), inline base58 validation, and TransactionStatus feedback. The mutation invalidates the compliance-entry query cache on success and decodes Anchor errors on failure.

**T02 — Relayer localStorage registry:** Created `relayer-registry.ts` with three CRUD functions (`getRelayers`, `addRelayer`, `removeRelayer`) and the `RelayerEntry` type. All localStorage access is SSR-safe with `typeof window` guards. Parse validates shape using a `Record<string, unknown>` cast for ESLint compliance. Duplicates are prevented by pubkey. Rewrote the Relayers page as a `"use client"` component with a registration form (pubkey validated as base58 via `new PublicKey()`, label input), a table of registered relayers with per-row Remove buttons, and state synced through the registry helpers.

## Verification

All six slice-level verification checks pass:

| # | Check | Command | Exit | Verdict |
|---|-------|---------|------|---------|
| 1 | Type check | `cd app/web && npx tsc --noEmit` | 0 | ✅ pass |
| 2 | Production build | `cd app/web && npm run build` | 0 | ✅ pass |
| 3 | Compliance client directive | `grep -q "use client" compliance/page.tsx` | 0 | ✅ pass |
| 4 | Relayers client directive | `grep -q "use client" relayers/page.tsx` | 0 | ✅ pass |
| 5 | hookProgram usage | `grep -q "hookProgram" set-compliance.ts` | 0 | ✅ pass |
| 6 | localStorage key | `grep -q "gherkinpay:relayers" relayer-registry.ts` | 0 | ✅ pass |

## New Requirements Surfaced

- none

## Deviations

None — both tasks executed as planned.

## Known Limitations

- Compliance page requires the connected wallet to be the hookProgram authority to successfully submit `setCompliance` — there is no UI-level authority check before sending the transaction (the on-chain program enforces it and the error is decoded).
- Relayer registry is localStorage-only (per D009) — data is browser-local, not shared across devices or users. Adequate for devnet but will need a backend for production multi-user discovery.
- No pagination on either page — acceptable for devnet volume.

## Follow-ups

- none

## Files Created/Modified

- `app/web/src/lib/queries/compliance.ts` — ComplianceEntry query hook with PDA derivation
- `app/web/src/lib/mutations/set-compliance.ts` — setCompliance mutation hook using hookProgram
- `app/web/src/app/(console)/compliance/page.tsx` — rewritten from mock data to live on-chain reads/writes
- `app/web/src/lib/relayer-registry.ts` — localStorage CRUD helpers for relayer registry
- `app/web/src/app/(console)/relayers/page.tsx` — rewritten from mock data to localStorage-backed registration

## Forward Intelligence

### What the next slice should know
- The hookProgram mutation pattern established here (T01) is identical to the main program mutation pattern but uses `hookProgram` from `useAnchorProgram()`. Any future hookProgram instructions can copy `set-compliance.ts` as a template.
- `deriveComplianceEntryPda()` is exported from `queries/compliance.ts` — import it rather than re-deriving.

### What's fragile
- The Compliance page has no authority pre-check — if a non-authority wallet submits, the transaction fails on-chain and the error is decoded into a message. This is fine for devnet but would need UX improvement for production.
- localStorage relayer data can be wiped by clearing browser data — there's no backup or sync mechanism.

### Authoritative diagnostics
- Filter browser console for `[GherkinPay] setCompliance` to trace compliance mutation lifecycle (start → success/failure).
- Check `localStorage.getItem("gherkinpay:relayers")` in devtools for relayer registry contents.
- React Query devtools → `["compliance-entry", walletAddress]` shows cached ComplianceEntry data.

### What assumptions changed
- No assumptions changed — D009 (localStorage for relayers) and the hookProgram pattern both worked as planned.
