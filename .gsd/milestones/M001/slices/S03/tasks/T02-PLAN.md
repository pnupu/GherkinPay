---
estimated_steps: 5
estimated_files: 3
---

# T02: Rewrite agreements page with live data and shadcn components

**Slice:** S03 — Agreements — Live Reads
**Milestone:** M001

## Description

Replace the hardcoded mock agreements page with a client component that consumes the `useAgreements()` hook from T01 and renders live on-chain data using shadcn Table, Badge, and Skeleton components. The page must handle four states: wallet disconnected (connect prompt), loading (skeleton rows), empty results (informational message), and populated results (full table). All tRPC scaffolding and mock data are removed entirely.

**Skill:** Load `~/.gsd/agent/skills/frontend-design/SKILL.md` — this task involves UI component composition and page design.

## Steps

1. Add the shadcn Skeleton component:
   ```bash
   cd app/web && bunx --bun shadcn@canary add skeleton
   ```
   Verify the file appears at `app/web/src/components/ui/skeleton.tsx` and imports use `~/` alias.

2. Rewrite `app/web/src/app/(console)/agreements/page.tsx`:
   - Remove ALL tRPC imports (`api`, `HydrateClient` from `~/trpc/server`), the `agreements` mock array, and the `api.post.hello()` call
   - Make the page a `"use client"` component (or keep a thin server component shell with a client sub-component — either is acceptable, but `"use client"` on the page itself is simpler)
   - Import and use:
     - `useAgreements` from `~/lib/queries/agreements`
     - `useWallet` from `@solana/wallet-adapter-react`
     - `Table, TableHeader, TableBody, TableRow, TableHead, TableCell` from `~/components/ui/table`
     - `Badge` from `~/components/ui/badge`
     - `Skeleton` from `~/components/ui/skeleton`
     - `PublicKey` from `@solana/web3.js` (for type, if needed)

3. Implement state handling:
   - **Disconnected state:** When `!connected` (from `useWallet()`), show a message prompting the user to connect their wallet. Keep the page header visible.
   - **Loading state:** When `isLoading` from `useAgreements()`, show 3-5 Skeleton rows in the table layout (Skeleton elements filling each cell).
   - **Empty state:** When data is loaded but array is empty, show an informational message like "No agreements found" within the table section.
   - **Populated state:** Render the full table with data.

4. Implement table columns and data formatting:
   - **Agreement ID:** `paymentId` field — `BN.toNumber()`, display as `#1`, `#2`, etc.
   - **Counterparty:** Show the *other* party. If connected wallet equals `payer`, show `payee`; otherwise show `payer`. Truncate pubkey: first 4 chars + `...` + last 4 chars (e.g., `Ab3x...7fQz`).
   - **Type:** `isMilestone ? \`Milestone (${milestoneCount} phases)\` : "Simple"`
   - **Amount:** `totalAmount` BN → divide by 10^6 (USDC decimals) → format as currency string. For milestone payments, also show `releasedAmount / totalAmount` as progress.
   - **Status:** Use shadcn Badge with variant mapping:
     - Extract variant name: `Object.keys(account.status)[0]` (Anchor deserializes Rust enums as `{ variantName: {} }`)
     - `created` → `outline` variant, display "Created"
     - `active` → `default` variant, display "Active"
     - `completed` → `secondary` variant, display "Completed"
     - `cancelled` → `destructive` variant, display "Cancelled"
   - **Created:** `createdAt` BN → `.toNumber() * 1000` → `new Date()` → `toLocaleDateString()`

5. Add a helper function for pubkey truncation (can be inline or a small utility at the top of the file):
   ```ts
   function truncatePubkey(pubkey: PublicKey): string {
     const str = pubkey.toBase58();
     return `${str.slice(0, 4)}...${str.slice(-4)}`;
   }
   ```

6. Preserve the page header structure (title "Agreements", subtitle). The action buttons ("Add condition", "Create payment") can remain as disabled placeholders — they're M002 scope.

7. Verify:
   ```bash
   cd app/web && bun run build
   cd app/web && bun run typecheck
   grep -r "tRPC\|trpc\|HydrateClient" src/app/\(console\)/agreements/
   grep -r "Northline\|Boreal\|Ridge Finance\|PAY-40" src/app/\(console\)/agreements/
   ```

## Must-Haves

- [ ] Zero tRPC imports in agreements page
- [ ] Zero hardcoded mock data arrays
- [ ] `"use client"` directive present (page or sub-component)
- [ ] Uses `useAgreements()` from `~/lib/queries/agreements`
- [ ] Uses shadcn Table, Badge, and Skeleton components
- [ ] Handles disconnected, loading, empty, and populated states
- [ ] BN fields converted correctly (amounts / 10^6, timestamps * 1000)
- [ ] Status enum extracted via `Object.keys(status)[0]` pattern
- [ ] Pubkeys truncated for display
- [ ] All imports use `~/` alias, not `@/`
- [ ] `bun run build` passes
- [ ] `bun run typecheck` passes (after build)

## Verification

- `bun run build` exits 0
- `bun run typecheck` exits 0
- `grep -r "tRPC\|trpc\|HydrateClient" app/web/src/app/\(console\)/agreements/` returns no matches
- `grep -r "Northline\|Boreal\|Ridge Finance\|PAY-40" app/web/src/app/\(console\)/agreements/` returns no matches
- `grep -r "@/" app/web/src/app/\(console\)/agreements/page.tsx` returns no matches
- `grep "use client" app/web/src/app/\(console\)/agreements/page.tsx` returns a match
- `grep "useAgreements" app/web/src/app/\(console\)/agreements/page.tsx` returns a match
- File `app/web/src/components/ui/skeleton.tsx` exists

## Inputs

- `app/web/src/lib/queries/agreements.ts` — `useAgreements()` hook from T01, returns `{ data, isLoading, isError, error }` where data is array of `{ publicKey, account }` with typed paymentAgreement fields
- `app/web/src/components/ui/table.tsx` — shadcn Table components
- `app/web/src/components/ui/badge.tsx` — shadcn Badge with variants: default, secondary, destructive, outline
- `app/web/src/app/(console)/agreements/page.tsx` — current page to rewrite (has hardcoded mock array, tRPC imports)
- Account fields available: `paymentId` (BN), `authority` (PublicKey), `payer` (PublicKey), `payee` (PublicKey), `totalAmount` (BN), `releasedAmount` (BN), `status` (object like `{ active: {} }`), `isMilestone` (boolean), `milestoneCount` (number), `currentMilestone` (number), `createdAt` (BN — unix seconds)

## Expected Output

- `app/web/src/components/ui/skeleton.tsx` — shadcn Skeleton component (added via CLI)
- `app/web/src/app/(console)/agreements/page.tsx` — fully rewritten page with live data, shadcn components, four UI states, zero mocks, zero tRPC
