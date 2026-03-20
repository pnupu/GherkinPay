---
estimated_steps: 4
estimated_files: 2
---

# T01: Wire compliance query hook and rewrite compliance page with live data

**Slice:** S05 — Compliance and Relayers — Live Reads
**Milestone:** M001

## Description

Create the `useComplianceEntries()` React Query hook that fetches all `ComplianceEntry` accounts from the `gherkin_pay_hook` program on devnet, then rewrite the compliance page to consume it with shadcn components. This follows the exact pattern established by `agreements.ts` and `milestones.ts` — the only difference is using `hookProgram` instead of `program` from `useAnchorProgram()`, and casting to `Program<GherkinPayHook>`.

The `ComplianceEntry` account has two fields: `isAllowed: bool` and `bump: u8`. PDA seeds are `["compliance", mint, wallet]` but the account data doesn't store the mint/wallet — only the account pubkey encodes them. Use `.all()` to fetch all entries and display account pubkey + `isAllowed` status.

**Relevant skills:** react-best-practices

## Steps

1. Create `app/web/src/lib/queries/compliance.ts` with `useComplianceEntries()` hook:
   - Import `useAnchorProgram` from `~/lib/anchor`, `useQuery` from `@tanstack/react-query`, `type Program` from `@coral-xyz/anchor`, `type GherkinPayHook` from `~/types/gherkin_pay_hook`
   - Extract `hookProgram` from `useAnchorProgram()`, cast to `Program<GherkinPayHook> | null`
   - Call `hookProgram!.account.complianceEntry.all()` in the queryFn
   - queryKey: `["compliance"]`, enabled: `!!hookProgram`
   - Return standard React Query state

2. Rewrite `app/web/src/app/(console)/compliance/page.tsx`:
   - Add `"use client"` directive
   - Import `useComplianceEntries` from `~/lib/queries/compliance`
   - Import shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` from `~/components/ui/table`
   - Import `Badge` from `~/components/ui/badge`, `Skeleton` from `~/components/ui/skeleton`
   - Import `useWallet` from `@solana/wallet-adapter-react`
   - Add `truncatePubkey()` helper (same as in agreements page)
   - Handle states: not connected → prompt message, loading → Skeleton rows, error → error message, empty → empty state, data → Table with rows showing account pubkey and `isAllowed` as Badge (Allowed=default, Blocked=destructive)

3. Remove the hardcoded `complianceEntries` array entirely

4. Verify build and types pass: `cd app/web && bun run build && bun run typecheck`

## Must-Haves

- [ ] `useComplianceEntries()` uses `hookProgram` (not `program`) cast to `Program<GherkinPayHook>`
- [ ] Compliance page is a `"use client"` component consuming the live hook
- [ ] Page handles loading, empty, error, and disconnected states with shadcn components
- [ ] Zero hardcoded mock arrays in the compliance page
- [ ] All imports use `~/` alias (no `@/`)
- [ ] `bun run build` and `bun run typecheck` pass

## Verification

- `cd app/web && bun run build` exits 0
- `cd app/web && bun run typecheck` exits 0
- `grep -q "hookProgram" app/web/src/lib/queries/compliance.ts`
- `grep -q "use client" app/web/src/app/\(console\)/compliance/page.tsx`
- `grep -q "useComplianceEntries" app/web/src/app/\(console\)/compliance/page.tsx`
- `! grep -q "complianceEntries =" app/web/src/app/\(console\)/compliance/page.tsx`

## Inputs

- `app/web/src/lib/queries/agreements.ts` — pattern to follow for query hook structure
- `app/web/src/app/(console)/agreements/page.tsx` — pattern to follow for page structure with shadcn components
- `app/web/src/lib/anchor.ts` — provides `useAnchorProgram()` returning `{ program, hookProgram }`
- `app/web/src/types/gherkin_pay_hook.ts` — TypeScript IDL types; account name is `complianceEntry` with fields `isAllowed: bool`, `bump: u8`
- `app/web/src/app/(console)/compliance/page.tsx` — existing page to rewrite (has hardcoded mock array)

## Expected Output

- `app/web/src/lib/queries/compliance.ts` — new React Query hook for ComplianceEntry accounts
- `app/web/src/app/(console)/compliance/page.tsx` — rewritten with live data and shadcn components
