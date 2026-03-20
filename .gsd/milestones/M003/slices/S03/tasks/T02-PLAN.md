---
estimated_steps: 4
estimated_files: 2
---

# T02: Wire relayer localStorage registry and page

**Slice:** S03 — Admin Flows
**Milestone:** M003

## Description

Create a localStorage-based relayer registry helper and rewrite the Relayers page from a server component with hardcoded data to a client component with CRUD operations. This delivers R017 (relayer registration) using the localStorage approach chosen in D009.

No on-chain interaction — pure client-side state. The page lets relayer operators register their pubkey + label, see all registered relayers in a table, and delete entries. Data persists across page reloads via localStorage key `"gherkinpay:relayers"`.

**Relevant skills:** react-best-practices

## Steps

1. Create `app/web/src/lib/relayer-registry.ts`:
   - Define `RelayerEntry` type: `{ pubkey: string, label: string, createdAt: number }`
   - `STORAGE_KEY = "gherkinpay:relayers"`
   - `getRelayers(): RelayerEntry[]` — parse from localStorage, return `[]` if missing/invalid. Guard with `typeof window !== "undefined"` check for SSR safety.
   - `addRelayer(entry: { pubkey: string, label: string }): RelayerEntry[]` — append with `createdAt: Date.now()`, write back, return updated list. Prevent duplicates by pubkey.
   - `removeRelayer(pubkey: string): RelayerEntry[]` — filter out by pubkey, write back, return updated list.

2. Rewrite `app/web/src/app/(console)/relayers/page.tsx`:
   - Add `"use client"` directive
   - Use `useState<RelayerEntry[]>` initialized from `getRelayers()` on mount (via `useEffect` or lazy initializer)
   - Registration form: pubkey text input + label text input + "Register" button
   - Validate pubkey as valid Solana base58 (`new PublicKey(input)` in try/catch) before adding
   - Show inline error for invalid pubkey or duplicate pubkey
   - Table: show all registered relayers (pubkey, label, registered date) with "Remove" button per row
   - On add/remove: call registry helper, update local state from return value
   - Use existing CSS classes (panel, table-wrap, topbar, page-title etc.)

3. Ensure all imports resolve and types are correct.

4. Run `npx tsc --noEmit` and `npm run build` in `app/web/` to verify.

## Must-Haves

- [ ] `relayer-registry.ts` exports `getRelayers`, `addRelayer`, `removeRelayer` with `RelayerEntry` type
- [ ] localStorage key is `"gherkinpay:relayers"`
- [ ] SSR-safe — no bare `localStorage` access at module level
- [ ] Relayers page is `"use client"` with registration form and table
- [ ] Pubkey input validates as base58 before adding
- [ ] Duplicate pubkey prevention
- [ ] Remove button deletes entry and updates table
- [ ] Build passes with zero type errors

## Verification

- `cd app/web && npx tsc --noEmit` — zero type errors
- `cd app/web && npm run build` — production build succeeds
- `grep -q "use client" app/web/src/app/\(console\)/relayers/page.tsx`
- `grep -q "gherkinpay:relayers" app/web/src/lib/relayer-registry.ts`
- `grep -q "RelayerEntry" app/web/src/lib/relayer-registry.ts`

## Inputs

- `app/web/src/app/(console)/relayers/page.tsx` — existing mock page to rewrite
- `app/web/src/lib/mutations/set-compliance.ts` — not a dependency, but confirms the broader pattern context (T01 output)

## Expected Output

- `app/web/src/lib/relayer-registry.ts` — new localStorage CRUD helper for relayer entries
- `app/web/src/app/(console)/relayers/page.tsx` — rewritten as client component with registration form and live table
