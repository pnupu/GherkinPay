---
id: T02
parent: S03
milestone: M003
provides:
  - localStorage-based relayer registry with typed CRUD helpers (getRelayers, addRelayer, removeRelayer)
  - Relayers page rewritten as client component with registration form, table, and delete actions
key_files:
  - app/web/src/lib/relayer-registry.ts
  - app/web/src/app/(console)/relayers/page.tsx
key_decisions:
  - Used Record<string, unknown> cast in type guard to satisfy @typescript-eslint/no-unsafe-member-access rule
patterns_established:
  - localStorage registry pattern with SSR-safe guards, shape validation on parse, and duplicate prevention
observability_surfaces:
  - localStorage key "gherkinpay:relayers" inspectable via browser devtools Application tab
  - Inline validation errors for invalid pubkey or duplicate entries
duration: 12m
verification_result: passed
completed_at: 2026-03-20T19:42:00+02:00
blocker_discovered: false
---

# T02: Wire relayer localStorage registry and page

**Add localStorage-based relayer registry with typed CRUD helpers and rewrite Relayers page as client component with registration form, pubkey validation, and delete actions**

## What Happened

Created `relayer-registry.ts` with three exported functions (`getRelayers`, `addRelayer`, `removeRelayer`) and the `RelayerEntry` type. All localStorage access is SSR-safe with `typeof window` guards. The parse function validates shape using a `Record<string, unknown>` cast to satisfy the strict `no-unsafe-member-access` ESLint rule. Duplicate entries are prevented by pubkey.

Rewrote the Relayers page from a server component with hardcoded mock data to a `"use client"` component. The page loads entries from localStorage on mount via `useEffect`, provides a registration form with pubkey (validated as base58 via `new PublicKey()`) and label inputs, and renders a table of registered relayers with per-row Remove buttons. All state updates flow through the registry helpers and update local component state from the returned arrays.

## Verification

All slice-level verification checks pass:

- `npx tsc --noEmit` — zero type errors (exit 0)
- `npm run build` — production build succeeds, relayers page included in output
- `grep -q "use client"` on relayers page — confirmed
- `grep -q "gherkinpay:relayers"` on registry — confirmed
- `grep -q "RelayerEntry"` on registry — confirmed
- `grep -q "hookProgram"` on set-compliance mutation — confirmed (T01 artifact)

## Verification Evidence

| Check | Command | Exit | Verdict | Duration |
|-------|---------|------|---------|----------|
| Type check | `cd app/web && npx tsc --noEmit` | 0 | ✅ pass | 6.7s |
| Production build | `cd app/web && npm run build` | 0 | ✅ pass | 9.4s |
| use client directive | `grep -q "use client" app/web/src/app/(console)/relayers/page.tsx` | 0 | ✅ pass | <1s |
| Storage key | `grep -q "gherkinpay:relayers" app/web/src/lib/relayer-registry.ts` | 0 | ✅ pass | <1s |
| RelayerEntry type | `grep -q "RelayerEntry" app/web/src/lib/relayer-registry.ts` | 0 | ✅ pass | <1s |
| hookProgram usage | `grep -q "hookProgram" app/web/src/lib/mutations/set-compliance.ts` | 0 | ✅ pass | <1s |

## Observability Impact

- **Inspection surface:** Relayer data stored at `localStorage.getItem("gherkinpay:relayers")` — JSON array of `{pubkey, label, createdAt}` objects inspectable in browser devtools Application → Local Storage.
- **Failure visibility:** Invalid Solana public keys produce inline validation error before any write. Duplicate pubkeys show a specific error message. Corrupt localStorage data is silently discarded (returns empty array) rather than crashing the page.
- **No console logging:** Since this is pure client-side localStorage CRUD with no async operations, no console signals are emitted. This is intentional — there's nothing to trace.

## Diagnostics

- **Inspect stored data:** Open browser devtools → Application → Local Storage → look for `gherkinpay:relayers` key. Value is a JSON array of `{pubkey, label, createdAt}` objects.
- **Verify SSR safety:** The page should render without errors during SSR (no `window is not defined`). The `typeof window` guard in `relayer-registry.ts` ensures localStorage is only accessed client-side.
- **Test corrupt data:** Set `localStorage.setItem("gherkinpay:relayers", "invalid")` in console — the registry returns an empty array and the page renders cleanly.
- **Duplicate prevention:** Try adding the same pubkey twice — the second attempt shows an inline "already registered" error.
