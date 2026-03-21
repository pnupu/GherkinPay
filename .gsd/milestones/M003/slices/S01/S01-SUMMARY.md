---
id: S01
parent: M003
milestone: M003
provides:
  - Agreement detail page at /agreements/[id] with payment header and condition cards for all 5 types
  - useConditions(paymentPubkey) React Query hook with memcmp filter on ConditionAccount
  - useAgreements() and usePaymentDetail() query hooks for on-chain PaymentAgreement data
  - useCrankTime(), useCrankOracle(), useCrankTokenGate() mutation hooks for permissionless condition cranking
  - decodeAnchorError() utility mapping all 27 GherkinPayError variants to user-friendly messages
  - TransactionStatus component with pending/success/error states and Solana Explorer link
  - ConditionCard component with type-specific rendering, crank buttons, oracle price display, staleness warnings
  - Clickable agreement rows on list page linking to detail view
  - Solana/Anchor/wallet-adapter infrastructure (useAnchorProgram, PDA helpers, IDL files, WalletProvider)
  - shadcn UI components (Button, Table, Badge, Card, Skeleton, Dialog)
requires:
  - slice: M001/S01
    provides: shadcn canary pattern (D008), CSS token coexistence (D005/D007)
  - slice: M002
    provides: mutation hook pattern (useMutation shape), TransactionStatus pattern
affects:
  - S02
key_files:
  - app/web/src/app/(console)/agreements/[id]/page.tsx
  - app/web/src/app/(console)/agreements/page.tsx
  - app/web/src/components/condition-card.tsx
  - app/web/src/components/agreements-client.tsx
  - app/web/src/components/transaction-status.tsx
  - app/web/src/lib/queries/conditions.ts
  - app/web/src/lib/queries/agreements.ts
  - app/web/src/lib/mutations/crank-time.ts
  - app/web/src/lib/mutations/crank-oracle.ts
  - app/web/src/lib/mutations/crank-token-gate.ts
  - app/web/src/lib/errors.ts
  - app/web/src/lib/anchor.ts
  - app/web/src/lib/pda.ts
  - app/web/src/lib/constants.ts
  - app/web/src/lib/token.ts
  - app/web/src/idl/gherkin_pay.json
  - app/web/src/types/gherkin_pay.ts
  - app/web/src/components/wallet-provider.tsx
key_decisions:
  - Cast IDL JSON as Anchor Idl type to avoid TypeScript structural mismatch with Anchor 0.32 IdlSeed types
  - Crank hooks live in condition-card.tsx (not page.tsx) — each CrankAction component owns its mutation lifecycle
  - Oracle price parsed at same byte offsets as on-chain program (73-101) via DataView, not Pyth SDK
  - File-level eslint-disable for Anchor query files — Program<Idl> account accessors are inherently untyped
patterns_established:
  - useAnchorProgram() returns { program, hookProgram, connection, provider } — null when wallet disconnected
  - Query hooks use (program.account as any).accountName with eslint-disable header for Anchor untyped accessors
  - Mutation hooks pattern: eslint-disable header, (program.methods as any).methodName(), [GherkinPay] console logs, queryClient.invalidateQueries on success, decodeAnchorError on error
  - memcmp filter at offset 8 (after discriminator) for account relationship queries
  - Four UI states (disconnected, loading, error, populated) as standard for wallet-aware pages
  - BN-to-number conversion via toNumber() with fallback for mixed BN/number runtime types
  - Condition enum parsing via Object.keys(variant)[0] for Anchor enum discriminant extraction
observability_surfaces:
  - Console logs with [GherkinPay] prefix before RPC calls, on success (with tx sig), on failure (with decoded error)
  - TransactionStatus component with role="status" aria-live="polite" for programmatic observation
  - React Query cache keys ["agreements"], ["conditions", paymentPubkey], ["payment", paymentPubkey]
  - Oracle staleness warning badge when Pyth publish_time > 60s old
  - Solana Explorer link in TransactionStatus success state
drill_down_paths:
  - .gsd/milestones/M003/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M003/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M003/slices/S01/tasks/T03-SUMMARY.md
duration: 30m
verification_result: passed
completed_at: 2026-03-20
---

# S01: Permissionless Cranks

**Agreement detail page with live on-chain condition data and permissionless crank buttons for time, oracle, and token gate conditions — including Pyth price display, staleness warnings, and decoded error feedback.**

## What Happened

Three tasks built the full vertical stack from infrastructure to interactive UI:

**T01 (Infrastructure)** recreated the Solana client stack in the M003 worktree: installed 13 packages (web3.js, Anchor, wallet-adapter suite, spl-token, shadcn deps), generated Anchor IDL JSON for both programs from source, built typed interfaces for all enums/accounts/errors, created `useAnchorProgram()` hook and PDA derivation helpers, wired WalletProvider into layouts, and added 6 shadcn UI components. Hit an Anchor 0.32 IdlSeed typing issue — resolved by casting IDL as `Idl` instead of using `Program<T>` generic.

**T02 (Data + UI)** created three React Query hooks (`useAgreements`, `useConditions` with memcmp filter, `usePaymentDetail`) and built the full page stack: `AgreementsClient` with clickable table rows linking to `/agreements/[pubkey]`, and the detail page at `/agreements/[id]` showing a payment header card plus a conditions grid. `ConditionCard` renders all 5 condition types with type-specific metadata (dates, oracle thresholds, signer lists, relayer pubkeys) and met/pending status badges. All pages handle four UI states: disconnected, loading, error, populated.

**T03 (Mutations + Actions)** created three crank mutation hooks, a 27-variant error decoder, and `TransactionStatus` feedback component. Rewrote `ConditionCard` to include `CrankAction` sub-components rendering type-specific buttons: "Crank Time" (visible when unlock_at < now), "Crank Oracle" (with live Pyth price and staleness warning via `useOraclePrice()` hook), "Crank Token Gate" (with ATA derivation for TOKEN_2022). Each button triggers its mutation and shows success/error feedback with Solana Explorer links. Oracle price parsing uses the same byte offsets (73-101) as the on-chain program.

## Verification

All slice-level verification checks pass:

| # | Check | Result |
|---|-------|--------|
| 1 | `bun run build` exits 0 | ✅ pass |
| 2 | Detail route exists | ✅ pass |
| 3 | Conditions query hook exists | ✅ pass |
| 4 | crank-time mutation exists | ✅ pass |
| 5 | crank-oracle mutation exists | ✅ pass |
| 6 | crank-token-gate mutation exists | ✅ pass |
| 7 | Error decoder exists | ✅ pass |
| 8 | Crank hooks wired in condition-card.tsx | ✅ pass |

## New Requirements Surfaced

- none

## Deviations

- Crank hooks placed in `condition-card.tsx` instead of `page.tsx` — architecturally correct since each CrankAction component owns its own mutation lifecycle and TransactionStatus feedback. The slice plan's grep check accounts for this with an OR fallback.
- Oracle staleness shows a warning instead of disabling the crank button — users may want to attempt the crank if the feed updates between render and click.
- `useCallback` removed from crank handlers — PublicKey objects from string props cause reference instability in deps arrays; inline arrow functions are cleaner.

## Known Limitations

- No live devnet transaction testing performed — crank buttons render correctly but real transaction flow requires a connected wallet and devnet RPC. Manual devnet verification is part of the UAT.
- Oracle price display uses `Number()` conversion which may lose precision for very large values (acceptable for display).
- `formatTokenAmount` in agreements-client.tsx wraps raw numbers in a `{ toString }` object — could be simplified to accept plain numbers.
- The devnet USDC mint in token.ts (`Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr`) should be confirmed against the project's actual deployed devnet mint.

## Follow-ups

- none — all planned deliverables shipped. S02 consumes the condition card and mutation patterns established here.

## Files Created/Modified

- `app/web/package.json` — added 13 Solana/Anchor/wallet/shadcn dependencies
- `app/web/components.json` — shadcn canary configuration
- `app/web/next.config.js` — webpack externals for Node.js polyfills
- `app/web/src/env.js` — T3 env schema with NEXT_PUBLIC_SOLANA_RPC_URL
- `app/web/src/idl/gherkin_pay.json` — Anchor IDL for gherkin_pay program
- `app/web/src/idl/gherkin_pay_hook.json` — Anchor IDL for hook program
- `app/web/src/types/gherkin_pay.ts` — TypeScript types, enums, error codes
- `app/web/src/types/gherkin_pay_hook.ts` — TypeScript types for hook program
- `app/web/src/lib/anchor.ts` — useAnchorProgram() hook
- `app/web/src/lib/pda.ts` — PDA derivation helpers
- `app/web/src/lib/constants.ts` — program ID constants
- `app/web/src/lib/token.ts` — USDC mint and ATA helper
- `app/web/src/lib/utils.ts` — cn() utility
- `app/web/src/lib/errors.ts` — 27-variant error decoder
- `app/web/src/lib/queries/agreements.ts` — useAgreements(), formatTokenAmount, truncatePubkey
- `app/web/src/lib/queries/conditions.ts` — useConditions(), usePaymentDetail()
- `app/web/src/lib/mutations/crank-time.ts` — useCrankTime() mutation
- `app/web/src/lib/mutations/crank-oracle.ts` — useCrankOracle() with parsePythPrice, isPriceStale
- `app/web/src/lib/mutations/crank-token-gate.ts` — useCrankTokenGate() with ATA derivation
- `app/web/src/components/wallet-provider.tsx` — WalletContextProvider
- `app/web/src/components/wallet-button.tsx` — WalletMultiButton wrapper
- `app/web/src/components/condition-card.tsx` — ConditionCard with CrankAction and oracle price display
- `app/web/src/components/agreements-client.tsx` — agreements list with clickable rows
- `app/web/src/components/transaction-status.tsx` — transaction feedback component
- `app/web/src/components/ui/button.tsx` — shadcn Button
- `app/web/src/components/ui/table.tsx` — shadcn Table
- `app/web/src/components/ui/badge.tsx` — shadcn Badge
- `app/web/src/components/ui/card.tsx` — shadcn Card
- `app/web/src/components/ui/skeleton.tsx` — shadcn Skeleton
- `app/web/src/components/ui/dialog.tsx` — shadcn Dialog
- `app/web/src/app/layout.tsx` — wrapped with WalletContextProvider
- `app/web/src/app/(console)/layout.tsx` — added WalletButton to sidebar
- `app/web/src/app/(console)/agreements/page.tsx` — rewired to use AgreementsClient
- `app/web/src/app/(console)/agreements/[id]/page.tsx` — agreement detail page

## Forward Intelligence

### What the next slice should know
- All mutation hooks use `(program.methods as any).methodName()` with eslint-disable headers — this is required for Anchor 0.32's `Program<Idl>` which returns untyped method accessors. S02's `useSignMultisig()` and `useConfirmWebhook()` should follow the same pattern.
- ConditionCard already renders informational text for multisig ("Requires coordinated signing") and webhook ("Requires relayer confirmation") — S02 replaces these with actual action buttons.
- The `CrankAction` component pattern in condition-card.tsx is the extension point: add new cases to the switch statement for multisig and webhook action types.
- `decodeAnchorError()` already maps all 27 errors including SignerNotInList (6013), AlreadySigned (6014), WebhookAlreadyConfirmed (6016) — S02 gets error decoding for free.

### What's fragile
- Anchor `(program.account as any)` accessors silently return empty arrays if the account name doesn't match the IDL — no runtime error, just missing data. If the IDL account names change, queries will silently break.
- Oracle byte offset parsing (73-101) is hardcoded to match the contract's PriceUpdateV2 layout. If Pyth changes the account layout, both the contract and the frontend parser break simultaneously — but the contract would need updating first.

### Authoritative diagnostics
- `bun run build` in app/web — the single source of truth for whether the frontend compiles. All type errors surface here.
- React Query devtools — inspect cache keys `["conditions", pubkey]` to verify condition data shape and fetch status.
- Browser console `[GherkinPay]` prefix — all crank operations log before, on success, and on failure with decoded errors.

### What assumptions changed
- Assumed crank hooks would live in page.tsx — actually cleaner in condition-card.tsx where each CrankAction owns its mutation lifecycle and TransactionStatus feedback.
- Assumed useCallback needed for crank handlers — PublicKey objects from string props cause deps instability; inline handlers are better.
