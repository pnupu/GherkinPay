---
id: S05
milestone: M001
status: ready
---

# S05: Compliance and Relayers — Live Reads — Context

## Goal

Replace the hardcoded compliance mock array with live ComplianceEntry accounts from the hook program, and clean up the relayers page to an empty state with an explanation — no hardcoded arrays remain in either page.

## Why this Slice

S02 wired the Anchor client for both programs; S03/S04 established the query hook pattern. S05 applies that same pattern to the hook program's ComplianceEntry accounts, completing live reads for all pages except Activity (S06). Relayers is cleared of mock data here so no page is left with hardcoded arrays going into S06.

## Scope

### In Scope

- `useComplianceEntries()` React Query hook fetching all `ComplianceEntry` accounts from the hook program via `hookProgram.account.complianceEntry.all()`
- Compliance page rewritten with live data and the four UI states (disconnected / loading / empty / populated)
- PDA pubkey used as the row identifier, displayed truncated (first4…last4) — the wallet address is a PDA seed not stored in account data; the PDA pubkey is what we have
- Compliance table columns: Wallet (PDA truncated), Status (Allowed / Blocked badge), and any timestamp or slot info available from the account (if not available, omit — do not fake it)
- A connected wallet is required to view the page — show the standard connect prompt when disconnected (consistent with agreements and milestones pages)
- All ComplianceEntry accounts fetched regardless of which wallet is connected (full allowlist view, not scoped to connected wallet)
- Relayers page: remove all hardcoded mock data; replace with an empty state message explaining that relayer registration is not yet available (coming in a future release)
- Relayers page retains its table structure / column headers so M003 can populate it without changing the page shape
- `bun run build` and `bun run typecheck` pass clean

### Out of Scope

- Writing or modifying compliance entries (set_compliance instruction) — M003
- Filtering or searching the compliance table — M003 or later
- Pagination — acceptable at devnet scale
- Relayer registration, relayer detail views, uptime metrics — M003
- Any on-chain data for relayers in this slice — the page is static

## Constraints

- Must use `hookProgram` from `useAnchorProgram()` — the hook program is a separate Anchor program from the main gherkin_pay program
- Follow the established four-state page pattern (disconnected / loading / empty / populated) exactly as in agreements and milestones pages
- No `@/` imports — use `~/` alias throughout
- No hardcoded arrays may remain in either page after this slice
- ComplianceEntry only stores `is_allowed: bool` and `bump: u8` — do not attempt to display data the account doesn't contain

## Integration Points

### Consumes

- `useAnchorProgram()` from `~/components/wallet-provider` (via `~/lib/anchor`) — specifically `hookProgram` for ComplianceEntry fetches
- `HOOK_PROGRAM_ID` from `~/lib/constants` — for getProgramAccounts calls if needed
- shadcn `Table`, `Badge`, `Skeleton` from `~/components/ui/` — same components used in S03/S04
- Four-state page pattern established in S03 and S04

### Produces

- `app/web/src/lib/queries/compliance.ts` — `useComplianceEntries()` React Query hook returning all ComplianceEntry accounts with pubkeys
- `app/web/src/app/(console)/compliance/page.tsx` — fully rewritten, live data, four UI states, zero hardcoded arrays
- `app/web/src/app/(console)/relayers/page.tsx` — hardcoded arrays removed, empty state with explanation, table structure retained

## Open Questions

- ComplianceEntry PDA seeds are `["compliance", mint, wallet]` — when fetching all entries via `getProgramAccounts`, we get PDA pubkeys but not the original wallet addresses. Display will show the PDA pubkey truncated. If this turns out to look confusing in practice, a follow-up task could add a memcmp filter on the wallet seed position to recover it — but that's not required here.
- The `"Last update"` column currently shown in the mock data has no on-chain equivalent in ComplianceEntry (no timestamp field). Drop this column entirely; do not substitute a fake or derived value.
- No `Last update` field exists on the account — the current mock column will simply be removed.
