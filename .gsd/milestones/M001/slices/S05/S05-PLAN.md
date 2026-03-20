# S05: Compliance and Relayers — Live Reads

**Goal:** Compliance page shows real ComplianceEntry accounts from the hook program; Relayers page is statically clean with no hardcoded mock arrays.
**Demo:** Compliance page fetches live data from devnet via `useComplianceEntries()` with loading/empty/error states; Relayers page shows an informational placeholder instead of fake data.

## Must-Haves

- `useComplianceEntries()` React Query hook using `hookProgram` cast to `Program<GherkinPayHook>`
- Compliance page rewritten as `"use client"` with shadcn Table/Badge/Skeleton and live data
- Relayers page cleared of hardcoded mock array, replaced with shadcn-styled empty state
- Zero hardcoded mock arrays remain in either page
- All imports use `~/` alias (no `@/`)
- `bun run build` passes clean

## Verification

- `cd app/web && bun run build` exits 0
- `cd app/web && bun run typecheck` exits 0
- `rg "complianceEntries =|relayers =" app/web/src/app/\(console\)/compliance/ app/web/src/app/\(console\)/relayers/` returns no matches (no hardcoded arrays)
- `grep -q "hookProgram" app/web/src/lib/queries/compliance.ts` — uses hook program, not main program
- `grep -q "use client" app/web/src/app/\(console\)/compliance/page.tsx` — client component
- `grep -q "useComplianceEntries" app/web/src/app/\(console\)/compliance/page.tsx` — consumes live hook
- `! grep -q "@/" app/web/src/lib/queries/compliance.ts app/web/src/app/\(console\)/compliance/page.tsx app/web/src/app/\(console\)/relayers/page.tsx` — no @/ imports

## Tasks

- [ ] **T01: Wire compliance query hook and rewrite compliance page with live data** `est:25m`
  - Why: R004 requires the compliance page to show real ComplianceEntry accounts from the hook program. This creates the query hook and rewrites the page using the same pattern as agreements/milestones.
  - Files: `app/web/src/lib/queries/compliance.ts`, `app/web/src/app/(console)/compliance/page.tsx`
  - Do: Create `useComplianceEntries()` following the `agreements.ts` pattern but using `hookProgram` cast to `Program<GherkinPayHook>`. Fetch all entries with `.all()`. Rewrite compliance page as `"use client"` component consuming the hook, with shadcn Table/Badge/Skeleton, loading/empty/error states, and `truncatePubkey()` for account addresses.
  - Verify: `cd app/web && bun run build && bun run typecheck` both exit 0; `grep -q "hookProgram" src/lib/queries/compliance.ts`
  - Done when: Compliance page fetches live ComplianceEntry data from devnet, renders with shadcn components, and zero hardcoded arrays remain.

- [ ] **T02: Clean up relayers page — remove mock data, add static placeholder** `est:10m`
  - Why: Relayers page has a hardcoded mock array that must be removed. Real relayer registration is M003 scope, so this page gets an informational empty state with shadcn components.
  - Files: `app/web/src/app/(console)/relayers/page.tsx`
  - Do: Remove the hardcoded `relayers` array. Replace table with a shadcn-styled empty state message explaining relayer registration is coming soon. Keep existing header structure. Use shadcn Card or simple styled div.
  - Verify: `cd app/web && bun run build` exits 0; `! grep -q "relayers =" src/app/\(console\)/relayers/page.tsx`
  - Done when: Relayers page renders with no mock data and a clean placeholder message.

## Files Likely Touched

- `app/web/src/lib/queries/compliance.ts`
- `app/web/src/app/(console)/compliance/page.tsx`
- `app/web/src/app/(console)/relayers/page.tsx`
