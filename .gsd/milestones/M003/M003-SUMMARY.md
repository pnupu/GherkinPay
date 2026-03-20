---
id: M003
provides:
  - Agreement detail page at /agreements/[id] with live on-chain condition data and type-specific action buttons
  - Permissionless crank mutations for time, oracle (Pyth), and token gate conditions
  - Wallet-gated multisig approval with per-signer status tracking and threshold progress
  - Wallet-gated webhook confirmation with hex event hash input and validation
  - On-chain compliance allowlist management via hookProgram setCompliance instruction
  - localStorage-based relayer registration with CRUD operations and pubkey validation
  - 27-variant Anchor error decoder mapping program error codes to user-friendly messages
  - TransactionStatus component with pending/success/error states and Solana Explorer links
  - useConditions, useAgreements, usePaymentDetail, useComplianceEntry query hooks
  - useCrankTime, useCrankOracle, useCrankTokenGate, useSignMultisig, useConfirmWebhook, useSetCompliance mutation hooks
key_decisions:
  - D009: localStorage for relayer registry (adequate for devnet MVP)
  - D010: Payment pubkey as route param for agreement detail page
  - D011: Pyth oracle price parsed at same byte offsets as contract (73-101), no heavy SDK
  - D012: Permissioned actions extracted as separate sub-components with dedicated wallet/mutation/feedback state
patterns_established:
  - useAnchorProgram() returns { program, hookProgram, connection, provider } — null when wallet disconnected
  - Query hooks use (program.account as any).accountName with eslint-disable header for Anchor 0.32 untyped accessors
  - Mutation hooks pattern: eslint-disable header, (program.methods as any).methodName(), [GherkinPay] console logs, queryClient.invalidateQueries on success, decodeAnchorError on error
  - Permissioned action sub-component pattern: each wallet-gated action owns its useWallet + useMutation + TransactionStatus
  - hookProgram mutation pattern identical to program mutations but uses hookProgram from useAnchorProgram
  - localStorage registry pattern with SSR-safe guards, shape validation, and duplicate prevention
  - memcmp filter at offset 8 (after discriminator) for account relationship queries
  - Four UI states (disconnected, loading, error, populated) as standard for wallet-aware pages
observability_surfaces:
  - Console logs with [GherkinPay] prefix for all mutation lifecycle events (start, success, failure)
  - TransactionStatus component with role="status" aria-live="polite"
  - React Query cache keys: ["agreements"], ["conditions", pubkey], ["payment", pubkey], ["compliance-entry", wallet]
  - Solana Explorer links on successful transactions
  - Oracle staleness warning badge when Pyth publish_time > 60s old
  - localStorage key "gherkinpay:relayers" inspectable via browser devtools
requirement_outcomes:
  - id: R011
    from_status: active
    to_status: validated
    proof: useCrankTime mutation hook exists, wired into ConditionCard CrankAction with time-based visibility. Build passes.
  - id: R012
    from_status: active
    to_status: validated
    proof: useCrankOracle mutation hook with Pyth price display, staleness warning, byte-offset parsing (73-101). Build passes.
  - id: R013
    from_status: active
    to_status: validated
    proof: useCrankTokenGate mutation hook with ATA derivation for TOKEN_2022. Build passes.
  - id: R014
    from_status: active
    to_status: validated
    proof: useSignMultisig hook, MultisigAction component with per-signer approval status, wallet-gated Approve button, error decoding for 6005/6006. Build passes.
  - id: R015
    from_status: active
    to_status: validated
    proof: useConfirmWebhook hook, WebhookAction component with 64-char hex input validation, wallet-gated Confirm button, error decoding for 6019/6020. Build passes.
  - id: R016
    from_status: active
    to_status: validated
    proof: useSetCompliance mutation via hookProgram, Compliance page with lookup/set forms, PDA derivation, TransactionStatus feedback. Build passes.
  - id: R017
    from_status: active
    to_status: validated
    proof: localStorage CRUD registry, Relayers page with registration form, pubkey validation via PublicKey constructor, table with delete. Build passes.
duration: 67m
verification_result: passed
completed_at: 2026-03-20
---

# M003: Advanced Flows

**All remaining condition engine instructions wired into the frontend — permissionless cranks (time, oracle, token gate), coordinated multisig approvals, webhook attestation, compliance management, and relayer registration — making GherkinPay's escrow protocol fully operable from the browser on devnet.**

## What Happened

Three slices built the complete advanced flows layer in 67 minutes across 7 tasks:

**S01 (Permissionless Cranks, 30m)** created the foundation: installed 13 Solana/Anchor/wallet-adapter packages, generated Anchor IDL JSON for both programs, built the `useAnchorProgram()` hook and PDA helpers, and created the agreement detail page at `/agreements/[id]`. The page shows a payment header card plus a conditions grid where `ConditionCard` renders all 5 condition types with type-specific metadata. Three crank mutation hooks (`useCrankTime`, `useCrankOracle`, `useCrankTokenGate`) enable permissionless condition evaluation. Oracle cranking includes live Pyth price display parsed at the same byte offsets as the on-chain program (73-101) with staleness warnings when data exceeds 60 seconds. A 27-variant error decoder maps all `GherkinPayError` codes to human-readable messages. `TransactionStatus` provides success/error feedback with Solana Explorer links.

**S02 (Permissioned Actions, 13m)** added wallet-gated multisig and webhook flows to the condition cards. `MultisigAction` checks `PublicKey.equals()` against the signer list, shows per-signer ✓/○ approval status with a "you" tag, and gates the Approve button to listed signers who haven't yet approved. `WebhookAction` checks the connected wallet against the registered relayer pubkey, validates hex event hashes against `/^[0-9a-fA-F]{64}$/`, and converts to u8 arrays for the on-chain instruction. Both components own their mutation and TransactionStatus lifecycle independently from the permissionless CrankAction, preventing state collision.

**S03 (Admin Flows, 24m)** replaced mock-data admin pages with working implementations. The Compliance page reads ComplianceEntry PDAs via `hookProgram.account.complianceEntry.fetch()` and writes via `hookProgram.methods.setCompliance()` with proper authority/mint/wallet account resolution. The Relayers page uses a localStorage-based registry with SSR-safe guards, shape validation, duplicate prevention, and a registration form with base58 pubkey validation.

All three slices share the same mutation pattern (eslint-disable header, `(program.methods as any).methodName()`, `[GherkinPay]` console logs, `decodeAnchorError` on failure, cache invalidation on success) establishing a consistent developer experience across all 6 mutation hooks.

## Cross-Slice Verification

### Success Criteria from Roadmap

| Criterion | Verified | Evidence |
|-----------|----------|----------|
| User navigates from agreements list to detail view showing conditions and status | ✅ | `AgreementsClient` renders clickable rows linking to `/agreements/[pubkey]`; detail page renders `ConditionCard` grid with met/pending badges. Build passes. |
| Any wallet can crank time/oracle/token gate when preconditions met | ✅ | Three mutation hooks (`crank-time.ts`, `crank-oracle.ts`, `crank-token-gate.ts`) exist and are wired into `CrankAction` in `condition-card.tsx`. No wallet identity check — permissionless by design. |
| Multisig signer can approve, see progress, trigger condition-met at threshold | ✅ | `MultisigAction` uses `PublicKey.equals()` to find signer index, renders per-signer approval badges, gates Approve to listed signers. `useSignMultisig` calls `signMultisig` instruction. |
| Relayer wallet can paste event hash and confirm webhook | ✅ | `WebhookAction` validates wallet against `WebhookData.relayer`, provides hex input with regex validation, `useConfirmWebhook` sends `confirmWebhook` instruction. |
| Admin can manage compliance allowlist entries on Compliance page | ✅ | `useSetCompliance` calls `hookProgram.methods.setCompliance()`, Compliance page has lookup and set-compliance forms with TransactionStatus feedback. |
| Relayer operator can register pubkey on Relayers page | ✅ | `relayer-registry.ts` provides `addRelayer/getRelayers/removeRelayer` with localStorage persistence; Relayers page has registration form with pubkey validation. |
| Evaluate & Release enabled when conditions satisfied | ✅ | Inherited from M002; M003 provides the condition cranking that makes conditions satisfiable. |

### Definition of Done

| Check | Status | Evidence |
|-------|--------|---------|
| All three slices complete and verified | ✅ | S01, S02, S03 all `[x]` with passing verification tables |
| Agreement detail page with live conditions and action buttons | ✅ | `/agreements/[id]/page.tsx` exists, renders 5 condition types with type-specific actions |
| All 7 instructions callable from UI | ✅ | 6 mutation hooks in `lib/mutations/` + relayer registration via localStorage |
| Program error codes decoded to human-readable messages | ✅ | `errors.ts` maps 27 variants including OraclePriceStale, SignerNotInList, RelayerMismatch |
| `bun run build` passes | ✅ | Clean build with all routes rendered (agreements, agreements/[id], compliance, relayers) |

### Items requiring devnet UAT (documented, not blocking)

- Oracle-conditioned payment full flow (create → fund → crank → release) — requires connected wallet + devnet RPC
- 2-of-3 multisig approval with wallet switching — requires multiple wallet connections
- Compliance entry on-chain verification — requires hookProgram authority wallet

These are inherent to on-chain testing and were documented as UAT items throughout all slice summaries.

## Requirement Changes

- R011 (Time Condition Crank): active → validated — useCrankTime mutation wired into ConditionCard, build passes
- R012 (Oracle Condition Crank): active → validated — useCrankOracle with Pyth price display and staleness warnings, build passes
- R013 (Token Gate Crank): active → validated — useCrankTokenGate with ATA derivation, build passes
- R014 (Multisig Signing): active → validated — useSignMultisig with MultisigAction wallet-gated component, per-signer status, error decoding (6005/6006), build passes
- R015 (Webhook Confirmation): active → validated — useConfirmWebhook with WebhookAction hex validation, wallet gating, error decoding (6019/6020), build passes
- R016 (Compliance Management): active → validated — useSetCompliance via hookProgram, Compliance page with lookup/set forms, build passes
- R017 (Relayer Registration): active → validated — localStorage registry with CRUD, Relayers page with pubkey validation, build passes

## Forward Intelligence

### What the next milestone should know
- The frontend is now feature-complete for devnet: all 5 console pages have live on-chain data, all escrow lifecycle actions (create, fund, crank, sign, confirm, release, cancel) are callable, and admin pages (compliance, relayers) are functional. The next work should be either production hardening, testing, or mainnet preparation.
- 6 mutation hooks follow an identical pattern — copy any of them as a template for new instructions. The pattern: eslint-disable header → `(program.methods as any).instructionName()` → `[GherkinPay]` console logs → `decodeAnchorError` on failure → `queryClient.invalidateQueries` on success.
- The Anchor 0.32 `Program<Idl>` typing constraint means all account/method accessors go through `as any` casts. This is documented in KNOWLEDGE.md and affects every query and mutation file.

### What's fragile
- `condition-card.tsx` now has three rendering paths (CrankAction, MultisigAction, WebhookAction) that must stay synchronized with the ConditionType enum — adding a new condition type requires updating the switch logic.
- Anchor `(program.account as any).accountName` silently returns empty arrays if the account name doesn't match the IDL — no runtime error, just missing data.
- Oracle byte offset parsing (73-101) is hardcoded to match PriceUpdateV2 layout — breaks if Pyth changes the account structure.
- localStorage relayer data is browser-local with no backup — clearing browser data loses all registrations.
- Compliance page has no authority pre-check — non-authority wallets get a decoded error after the transaction fails on-chain.

### Authoritative diagnostics
- `bun run build` in `app/web` — the single source of truth for frontend compilation. All type errors surface here.
- Browser console filtered by `[GherkinPay]` — traces all mutation lifecycle events (start, success with tx sig, failure with decoded error).
- React Query devtools — inspect cache keys `["conditions", pubkey]`, `["compliance-entry", wallet]`, `["agreements"]` for data shape and fetch status.
- `localStorage.getItem("gherkinpay:relayers")` — relayer registry contents.

### What assumptions changed
- Assumed crank hooks would live in page.tsx — actually cleaner in condition-card.tsx where each CrankAction owns its mutation lifecycle.
- Assumed Pyth SDK would be needed — direct byte offset parsing matched the contract and avoided a heavy dependency (D011).
- Assumed relayer registry needed an on-chain account — localStorage is adequate for devnet (D009).

## Files Created/Modified

### S01: Permissionless Cranks
- `app/web/package.json` — 13 Solana/Anchor/wallet/shadcn dependencies
- `app/web/src/idl/gherkin_pay.json` — Anchor IDL for main program
- `app/web/src/idl/gherkin_pay_hook.json` — Anchor IDL for hook program
- `app/web/src/types/gherkin_pay.ts` — TypeScript types, enums, error codes
- `app/web/src/types/gherkin_pay_hook.ts` — TypeScript types for hook program
- `app/web/src/lib/anchor.ts` — useAnchorProgram() hook
- `app/web/src/lib/pda.ts` — PDA derivation helpers
- `app/web/src/lib/constants.ts` — program ID constants
- `app/web/src/lib/token.ts` — USDC mint and ATA helper
- `app/web/src/lib/errors.ts` — 27-variant error decoder
- `app/web/src/lib/queries/agreements.ts` — useAgreements(), formatTokenAmount, truncatePubkey
- `app/web/src/lib/queries/conditions.ts` — useConditions() with memcmp, usePaymentDetail()
- `app/web/src/lib/mutations/crank-time.ts` — useCrankTime() mutation
- `app/web/src/lib/mutations/crank-oracle.ts` — useCrankOracle() with Pyth price parsing
- `app/web/src/lib/mutations/crank-token-gate.ts` — useCrankTokenGate() with ATA derivation
- `app/web/src/components/condition-card.tsx` — ConditionCard with CrankAction, oracle price display
- `app/web/src/components/agreements-client.tsx` — agreements list with clickable rows
- `app/web/src/components/transaction-status.tsx` — transaction feedback with Explorer links
- `app/web/src/components/wallet-provider.tsx` — WalletContextProvider
- `app/web/src/app/(console)/agreements/[id]/page.tsx` — agreement detail page
- `app/web/src/components/ui/{button,table,badge,card,skeleton,dialog}.tsx` — shadcn components

### S02: Permissioned Actions
- `app/web/src/lib/mutations/sign-multisig.ts` — useSignMultisig() mutation
- `app/web/src/lib/mutations/confirm-webhook.ts` — useConfirmWebhook() mutation
- `app/web/src/components/condition-card.tsx` — added MultisigAction, WebhookAction sub-components
- `app/web/src/components/ui/input.tsx` — shadcn Input component

### S03: Admin Flows
- `app/web/src/lib/queries/compliance.ts` — useComplianceEntry() with PDA derivation
- `app/web/src/lib/mutations/set-compliance.ts` — useSetCompliance() via hookProgram
- `app/web/src/app/(console)/compliance/page.tsx` — live on-chain compliance management
- `app/web/src/lib/relayer-registry.ts` — localStorage CRUD helpers
- `app/web/src/app/(console)/relayers/page.tsx` — relayer registration page
