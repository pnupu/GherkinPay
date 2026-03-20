# S03: Agreements — Live Reads — Research

**Date:** 2026-03-19

## Summary

This slice replaces the hardcoded mock array on the Agreements page with live on-chain reads of `paymentAgreement` accounts from devnet. The page is currently a server component with a tRPC call and static data — it needs to become (or wrap) a client component that uses `useAnchorProgram()` from S02, fetches all `paymentAgreement` accounts via Anchor's `program.account.paymentAgreement.all()`, and displays them with shadcn Table + Badge components. A React Query hook (`useAgreements`) wrapping the Anchor call provides caching/loading/error state. PDA helpers go in a shared `pda.ts` for reuse in S04.

The work is straightforward: one React Query hook, one PDA utility module, and a page rewrite using existing shadcn components. The on-chain account structure (`paymentAgreement` type) is well-defined in the IDL with clear fields for status, amounts, parties, and timestamps. No new libraries needed — React Query is already installed via the tRPC provider, and Anchor/web3.js are wired from S02.

## Recommendation

Build bottom-up: PDA helpers first (shared utility, no UI dependency), then the React Query hook wrapping `program.account.paymentAgreement.all()`, then the page rewrite. The page should use a client component pattern — either convert the page to `"use client"` or (better) keep a thin server component shell and extract the data-fetching table into a client component. The latter is cleaner since the page currently imports `HydrateClient` from tRPC server utils, though the tRPC call (`api.post.hello`) is just placeholder scaffolding and can be removed.

Filter accounts by connected wallet's authority pubkey using `memcmp` on the authority field (offset 8 bytes discriminator + 8 bytes payment_id = byte 16, 32 bytes long). This shows the user only their own agreements. When wallet is disconnected, show an empty state prompting connection.

## Implementation Landscape

### Key Files

- `app/web/src/app/(console)/agreements/page.tsx` — current page with hardcoded mock array; needs complete rewrite. Currently a server component importing `api` and `HydrateClient` from tRPC server utils. The tRPC `post.hello` call is placeholder — remove it.
- `app/web/src/lib/anchor.ts` — `useAnchorProgram()` hook from S02. Returns `{ program: Program<GherkinPay> | null, hookProgram: Program<GherkinPayHook> | null }`. Must null-check before using.
- `app/web/src/lib/constants.ts` — `PROGRAM_ID` needed for PDA derivation (separate from Program constructor which reads from IDL).
- `app/web/src/types/gherkin_pay.ts` — IDL type with `paymentAgreement` account structure and `paymentStatus` enum (`created | active | completed | cancelled`).
- `app/web/src/components/ui/table.tsx` — shadcn Table component (Table, TableHeader, TableBody, TableRow, TableHead, TableCell).
- `app/web/src/components/ui/badge.tsx` — shadcn Badge component with variants (default, secondary, destructive, outline).

### Files to Create

- `app/web/src/lib/pda.ts` — PDA derivation helpers: `getPaymentPDA(authority, paymentId)`, `getEscrowPDA(paymentPDA)`, `getConditionPDA(paymentPDA, milestoneIndex)`. Seeds from the Anchor program:
  - payment: `["payment", authority.toBuffer(), paymentId.toArrayLike(Buffer, "le", 8)]`
  - escrow: `["escrow", paymentPDA.toBuffer()]`
  - conditions: `["conditions", paymentPDA.toBuffer(), [milestoneIndex]]`
  - Program ID for PDA derivation comes from `PROGRAM_ID` in constants.ts (not from the IDL — PDA derivation is off-chain math, not a program method).
- `app/web/src/lib/queries/agreements.ts` — `useAgreements()` React Query hook. Uses `useAnchorProgram()` + `useWallet()`. Calls `program.account.paymentAgreement.all()` with optional memcmp filter on authority field. Returns typed array of `{ publicKey, account }` entries with loading/error state.
- `app/web/src/app/(console)/agreements/page.tsx` — rewritten page. Thin server component (or just `"use client"` directly) rendering an `<AgreementsTable>` client component.

### Account Field Mapping (paymentAgreement → Table Columns)

| On-chain field | Display | Notes |
|---|---|---|
| `paymentId` (u64) | Agreement ID (e.g. `#1`) | BN → number via `.toNumber()` |
| `payer` / `payee` (pubkey) | Counterparty | Show the *other* party (if connected wallet is authority/payer, show payee; else show payer). Truncate pubkey: `Ab3x...7fQz` |
| `status` (enum) | Status badge | Map `created`→outline, `active`→default/green, `completed`→secondary, `cancelled`→destructive |
| `totalAmount` (u64) | Amount | BN → number, divide by 10^decimals (6 for USDC), format as currency |
| `isMilestone` / `milestoneCount` | Condition type hint | Show "Milestone (N phases)" or "Simple" |
| `createdAt` (i64) | Created date | Unix timestamp → formatted date |
| `releasedAmount` (u64) | Progress | Show released/total for active milestone payments |

### Build Order

1. **T01: PDA helpers + agreements query hook** — Create `lib/pda.ts` with all three PDA functions and `lib/queries/agreements.ts` with `useAgreements()` hook. This is pure logic with no UI — testable by the build passing (type checking against IDL types).
2. **T02: Agreements page rewrite** — Replace the hardcoded page with a client component using `useAgreements()`, shadcn Table/Badge, loading skeleton, empty state (disconnected vs connected-but-no-data), and proper pubkey formatting.

T01 unblocks T02 and also unblocks S04 (which consumes `useAgreements()` for payment pubkeys and `pda.ts` for condition PDAs).

### Verification Approach

- `bun run build` passes with no errors (contract verification)
- `bun run typecheck` passes (after build, per KNOWLEDGE.md)
- No `@/` imports in new files
- No hardcoded mock arrays remain in agreements page
- Zero tRPC imports in the rewritten page (the `api.post.hello` placeholder is removed)
- Page handles three states: wallet disconnected, loading, empty results, populated results

## Constraints

- Page must use `"use client"` (or a client sub-component) — `useAnchorProgram()` and `useWallet()` require client context.
- Import alias is `~/` not `@/` — all new files must follow this.
- React Query is available through the existing tRPC QueryClientProvider — no additional provider setup needed.
- `useAnchorProgram()` returns null programs when disconnected — the query hook must disable itself when program is null (use `enabled: !!program` in `useQuery`).

## Common Pitfalls

- **BN arithmetic in display** — Anchor returns `BN` objects for u64 fields. Must call `.toNumber()` for display (safe for USDC amounts under 2^53). Don't use `.toString()` directly as it returns decimal string without formatting.
- **Enum variant matching** — Anchor deserializes Rust enums as `{ variantName: {} }` objects. To check status, use `"active" in payment.status` or `Object.keys(payment.status)[0]`. Don't compare with `===`.
- **memcmp offset for authority filter** — The `paymentAgreement` account layout starts with 8-byte discriminator, then `paymentId` (8 bytes u64), then `authority` (32 bytes pubkey) at offset 16. If filtering by authority, the memcmp bytes must be the base58 pubkey and offset must be 16.
