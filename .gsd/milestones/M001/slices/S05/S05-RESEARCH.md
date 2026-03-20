# S05: Compliance and Relayers — Live Reads — Research

**Date:** 2026-03-20
**Depth:** Light — identical pattern to S03/S04, just targeting the hook program

## Summary

S05 wires the Compliance page to read real `ComplianceEntry` accounts from the `gherkin_pay_hook` program on devnet, and cleans up the Relayers page by removing its hardcoded mock array and replacing it with a static placeholder (real relayer registration is M003 scope).

The work is mechanically identical to S03 (agreements) and S04 (milestones): create a React Query hook in `lib/queries/`, convert the page to a `"use client"` component consuming that hook, and render with shadcn Table/Badge/Skeleton. The only difference is using `hookProgram` instead of `program` from `useAnchorProgram()`, and casting to `Program<GherkinPayHook>` instead of `Program<GherkinPay>`.

The `ComplianceEntry` account is minimal — just `isAllowed: bool` and `bump: u8`. PDA seeds are `["compliance", mint, wallet]`, meaning each entry is per-mint-per-wallet. The `.all()` fetch returns all entries globally; no wallet-specific filtering is needed for the compliance admin view.

## Recommendation

Follow the exact pattern established in S03/S04: one query hook file, one page rewrite, shadcn components. Split into two tasks — T01 for the compliance query hook + page rewrite, T02 for the relayers page cleanup. Both are independent.

## Implementation Landscape

### Key Files

- `app/web/src/lib/queries/compliance.ts` — **CREATE**: `useComplianceEntries()` hook, follows `agreements.ts` pattern but uses `hookProgram` cast to `Program<GherkinPayHook>`
- `app/web/src/app/(console)/compliance/page.tsx` — **REWRITE**: replace hardcoded `complianceEntries` array with live data from `useComplianceEntries()`, add `"use client"`, use shadcn Table/Badge/Skeleton
- `app/web/src/app/(console)/relayers/page.tsx` — **REWRITE**: remove hardcoded `relayers` array, replace with static empty-state message indicating relayer registration comes in a future milestone

### Existing Patterns to Follow

1. **Query hook pattern** (`app/web/src/lib/queries/agreements.ts`):
   - Import `useAnchorProgram`, cast program to concrete IDL type
   - `useQuery` with `enabled: !!program`, queryKey includes wallet pubkey
   - Return standard React Query state

2. **Page pattern** (`app/web/src/app/(console)/agreements/page.tsx`):
   - `"use client"` directive
   - Consume query hook, handle loading (Skeleton) / empty / error / data states
   - shadcn Table for data display, Badge for status indicators
   - `truncatePubkey()` helper for wallet addresses

### ComplianceEntry Account Shape

From the IDL types section:
```
ComplianceEntry {
  isAllowed: bool   // whether the wallet is on the allowlist
  bump: u8          // PDA bump seed
}
```

PDA seeds: `["compliance", mint.key(), wallet.key()]` — each entry is scoped to a specific mint and wallet. The account's pubkey implicitly encodes which mint/wallet it belongs to, but the account data itself doesn't store them. The query hook should use `.all()` to fetch all entries and the page should display the pubkey (which encodes the wallet) alongside the `isAllowed` status.

### Build Order

1. **T01: Compliance query hook + page** — create `lib/queries/compliance.ts`, rewrite compliance page with shadcn components and live data
2. **T02: Relayers page cleanup** — remove mock array, add static placeholder with shadcn components

T01 and T02 are fully independent — can run in parallel.

### Verification Approach

- `bun run build` exits 0 — catches all type/import errors
- `bun run typecheck` exits 0 — no type errors in new files
- No hardcoded mock arrays remain in either page (`rg "complianceEntries\|relayers =" app/web/src/app/(console)/compliance/ app/web/src/app/(console)/relayers/` returns nothing)
- No `@/` imports in new files
- Compliance page imports from `~/lib/queries/compliance`
- Both pages use shadcn Table/Badge/Skeleton components
- `useComplianceEntries()` uses `hookProgram` (not `program`)

## Constraints

- `ComplianceEntry` has no stored wallet/mint fields — the account address itself (PDA) encodes the wallet and mint. Display can show the account pubkey; extracting the original wallet address from the PDA is not possible without additional context. The `.all()` response includes `publicKey` for each account.
- Must cast `hookProgram` to `Program<GherkinPayHook>` at the query hook level — same Anchor 0.32 generic inference issue documented in D008.
- Relayers page stays static — no on-chain relayer registry exists yet (M003 scope). Remove mock data, show an informational empty state.
