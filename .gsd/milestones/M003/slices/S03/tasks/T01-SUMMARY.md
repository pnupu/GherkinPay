---
id: T01
parent: S03
milestone: M003
provides:
  - useComplianceEntry query hook for ComplianceEntry PDA lookup
  - useSetCompliance mutation hook for on-chain setCompliance instruction
  - Live compliance page with wallet gating, lookup, and set-compliance forms
key_files:
  - app/web/src/lib/queries/compliance.ts
  - app/web/src/lib/mutations/set-compliance.ts
  - app/web/src/app/(console)/compliance/page.tsx
key_decisions:
  - Exported deriveComplianceEntryPda as shared helper so mutation can import from query module
patterns_established:
  - hookProgram mutation pattern (same as program mutation but using hookProgram from useAnchorProgram)
  - ComplianceEntry PDA derivation shared between query and mutation via exported function
observability_surfaces:
  - "[GherkinPay] setCompliance wallet=… isAllowed=…" console log on mutation start
  - "[GherkinPay] setCompliance tx: {sig}" console log on mutation success
  - "[GherkinPay] setCompliance failed: {decoded}" console error on mutation failure
  - "[GherkinPay] ComplianceEntry not found for {wallet}" console log on query miss
  - React Query cache key ["compliance-entry", walletAddress]
duration: 12m
verification_result: passed
completed_at: 2026-03-20
blocker_discovered: false
---

# T01: Wire compliance query, mutation, and page with on-chain writes

**Add compliance query hook, setCompliance mutation hook, and rewrite compliance page as client component with live on-chain reads/writes via hookProgram**

## What Happened

Created three files following established Anchor 0.32 patterns from KNOWLEDGE.md:

1. **Query hook** (`compliance.ts`): `useComplianceEntry(walletAddress)` derives the ComplianceEntry PDA from seeds `["compliance", USDC_MINT, wallet]` and fetches via `hookProgram.account.complianceEntry.fetch(pda)`. Returns `ComplianceEntry | null`, catching account-not-found errors gracefully. The PDA derivation is exported as `deriveComplianceEntryPda()` so the mutation can share it.

2. **Mutation hook** (`set-compliance.ts`): `useSetCompliance()` follows the `crank-time.ts` pattern — wraps `hookProgram.methods.setCompliance(isAllowed)` with correct accounts (authority, mint, wallet, complianceEntry PDA, systemProgram). Invalidates the compliance-entry query on success, decodes Anchor errors on failure.

3. **Compliance page** rewritten as `"use client"` component with: wallet connection gating, lookup section (input + Check Status button → shows Allowed/Blocked/Not Registered), set-compliance section (input + Allow/Block radio + Submit button), inline base58 validation on both inputs, and TransactionStatus for mutation feedback.

## Verification

All five task-level checks pass. Four of six slice-level checks pass (remaining two are T02 scope).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd app/web && npx tsc --noEmit` | 0 | ✅ pass | 2.8s |
| 2 | `cd app/web && npm run build` | 0 | ✅ pass | 11.1s |
| 3 | `grep -q "use client" app/web/src/app/(console)/compliance/page.tsx` | 0 | ✅ pass | <0.1s |
| 4 | `grep -q "hookProgram" app/web/src/lib/mutations/set-compliance.ts` | 0 | ✅ pass | <0.1s |
| 5 | `grep -q "complianceEntry" app/web/src/lib/queries/compliance.ts` | 0 | ✅ pass | <0.1s |
| 6 | `grep -q "use client" app/web/src/app/(console)/relayers/page.tsx` | 1 | ⏳ skip (T02) | <0.1s |
| 7 | `grep -q "gherkinpay:relayers" app/web/src/lib/relayer-registry.ts` | 1 | ⏳ skip (T02) | <0.1s |

## Diagnostics

- **Console logs:** All compliance operations log to console with `[GherkinPay]` prefix — filter browser console for "setCompliance" or "ComplianceEntry".
- **React Query devtools:** Inspect `["compliance-entry", walletAddress]` cache key for fetched data.
- **TransactionStatus:** Renders inline with decoded Anchor error messages on failure; links to Solana Explorer on success.
- **Validation:** Invalid wallet addresses produce inline error before any RPC call — no wasted transactions.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `app/web/src/lib/queries/compliance.ts` — new query hook for ComplianceEntry lookup by PDA
- `app/web/src/lib/mutations/set-compliance.ts` — new mutation hook for setCompliance on-chain instruction
- `app/web/src/app/(console)/compliance/page.tsx` — rewritten from server component with mock data to client component with live on-chain reads/writes
- `.gsd/milestones/M003/slices/S03/S03-PLAN.md` — added Observability section, marked T01 done
- `.gsd/milestones/M003/slices/S03/tasks/T01-PLAN.md` — added Observability Impact section
