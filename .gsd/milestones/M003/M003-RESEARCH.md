# M003: Advanced Flows — Research

**Date:** 2026-03-20

## Summary

M003 wires the remaining 7 instructions from the `gherkin_pay` and `gherkin_pay_hook` programs into the frontend: three permissionless cranks (time, oracle, token gate), two permissioned actions (multisig signing, webhook confirmation), compliance allowlist management, and relayer registration. All Rust instruction handlers are complete and tested. The IDL exposes clean account contexts with 1–3 accounts per instruction and simple argument signatures (condition_index for most, plus event_hash for webhook and is_allowed for compliance).

M001 delivers the foundation infrastructure (wallet adapter, `useAnchorProgram()`, PDA helpers, React Query read hooks, shadcn component library). M002 delivers the mutation pattern (`useMutation` + `queryClient.invalidateQueries`), the `TransactionStatus` component, and the agreements list with action buttons. M003 builds directly on these established patterns — every new instruction follows the same mutation hook shape.

The primary challenge is **UI surface area**, not technical complexity. M003 needs a condition detail view (likely an agreement detail page or expandable condition panel) where crank/sign/confirm buttons live contextually. It also needs the Compliance page rewritten from mock data to live on-chain writes, and a Relayer registration form. The oracle crank is the only instruction requiring a new dependency (`@pythnetwork/hermes-client` or direct account fetch) to resolve Pyth price feed accounts on devnet.

## Recommendation

**Slice into 3 slices: (S01) Permissionless Cranks, (S02) Permissioned Actions, (S03) Admin Flows.**

S01 (cranks) should be built first — it's the broadest slice (3 instructions), forces the creation of the condition detail view that S02 also needs, and is permissionless (no wallet identity checks, simpler to test). Start with crankTime (simplest — 2 accounts, no extra resolution) to prove the condition action UI pattern, then add oracle and token gate cranks which need extra account resolution.

S02 (multisig + webhook) adds wallet-identity-gated actions to the same condition detail view. It depends on S01's UI scaffold. Multisig is more interesting (approval tracking, signer list check); webhook is simpler (single relayer check + hash input).

S03 (compliance + relayer) is independent of S01/S02 — it operates on separate pages. Build last because it's lowest risk and doesn't block the core condition engine flows.

## Implementation Landscape

### Key Files

**Infrastructure from M001 (exists):**
- `app/web/src/lib/anchor.ts` — `useAnchorProgram()` returning `Program<GherkinPay>` and `Program<GherkinPayHook>`
- `app/web/src/lib/pda.ts` — `getPaymentPDA()`, `getEscrowPDA()`, `getConditionPDA()`
- `app/web/src/lib/queries/agreements.ts` — `useAgreements()` query hook pattern
- `app/web/src/types/gherkin_pay.ts` — TypeScript types for the program
- `app/web/src/idl/gherkin_pay.json` — IDL with all 13 instructions
- `app/web/src/idl/gherkin_pay_hook.json` — IDL with setCompliance instruction

**Patterns from M002 (exists):**
- `app/web/src/lib/mutations/create-payment.ts` — mutation hook pattern to follow
- `app/web/src/components/transaction-status.tsx` — reusable tx feedback component
- `app/web/src/components/agreements-client.tsx` — agreements list with action buttons
- `app/web/src/lib/constants.ts` — program IDs, USDC mint

**Smart contract (reference):**
- `programs/gherkin-pay/src/instructions/crank_time.rs` — 2 accounts (payment, conditionAccount), args: condition_index
- `programs/gherkin-pay/src/instructions/crank_oracle.rs` — 3 accounts (+price_feed UncheckedAccount), args: condition_index; validates feed_id matches condition's feed_account, checks price staleness (60s), confidence band (5%)
- `programs/gherkin-pay/src/instructions/crank_token_gate.rs` — 3 accounts (+holder_token_account InterfaceAccount), args: condition_index; checks mint + owner + amount >= min_amount
- `programs/gherkin-pay/src/instructions/sign_multisig.rs` — 3 accounts (+signer: Signer), args: condition_index; checks signer is in signers list, sets approvals[pos]=true, checks threshold
- `programs/gherkin-pay/src/instructions/confirm_webhook.rs` — 3 accounts (+relayer: Signer), args: condition_index + event_hash [u8;32]; checks relayer == condition.relayer, event_hash matches
- `programs/gherkin-pay-hook/src/lib.rs` — `set_compliance(is_allowed: bool)` with init_if_needed PDA seeds: ["compliance", mint, wallet]
- `programs/gherkin-pay/src/state/condition.rs` — Condition enum with 5 variants, all have `met: bool` field

**New files M003 will create:**

*S01 — Cranks:*
- `app/web/src/app/(console)/agreements/[id]/page.tsx` — agreement detail page with condition list and crank actions
- `app/web/src/lib/queries/conditions.ts` — `useConditions(paymentPubkey)` query hook
- `app/web/src/lib/mutations/crank-time.ts` — `useCrankTime()` mutation
- `app/web/src/lib/mutations/crank-oracle.ts` — `useCrankOracle()` mutation
- `app/web/src/lib/mutations/crank-token-gate.ts` — `useCrankTokenGate()` mutation
- `app/web/src/components/condition-card.tsx` — per-condition display with type-specific action button

*S02 — Permissioned Actions:*
- `app/web/src/lib/mutations/sign-multisig.ts` — `useSignMultisig()` mutation
- `app/web/src/lib/mutations/confirm-webhook.ts` — `useConfirmWebhook()` mutation
- `app/web/src/components/multisig-approval-panel.tsx` — signer list, approval badges, approve button
- `app/web/src/components/webhook-confirm-form.tsx` — event hash input, relayer status

*S03 — Admin Flows:*
- `app/web/src/lib/mutations/set-compliance.ts` — `useSetCompliance()` mutation (hook program)
- `app/web/src/lib/queries/compliance.ts` — `useComplianceEntries()` query hook
- `app/web/src/components/compliance-form.tsx` — add/update wallet form
- `app/web/src/components/relayer-registration.tsx` — relayer pubkey + metadata form
- `app/web/src/lib/relayer-registry.ts` — localStorage-based relayer store (see decision below)

### Instruction Account Context Summary

| Instruction | Accounts | Args | Signer constraint |
|---|---|---|---|
| crankTime | payment, conditionAccount | condition_index: u8 | None (permissionless) |
| crankOracle | payment, conditionAccount, price_feed | condition_index: u8 | None (permissionless) |
| crankTokenGate | payment, conditionAccount, holder_token_account | condition_index: u8 | None (permissionless) |
| signMultisig | signer, payment, conditionAccount | condition_index: u8 | signer must be in condition.signers[] |
| confirmWebhook | relayer, payment, conditionAccount | condition_index: u8, event_hash: [u8;32] | relayer must == condition.relayer |
| setCompliance | authority, mint, wallet, compliance_entry, system_program | is_allowed: bool | authority (payer) |

### Build Order

1. **Agreement detail page + condition query hook** — this is the UI scaffold that S01 and S02 both need. Route: `/agreements/[id]`. Fetch `PaymentAgreement` by pubkey, fetch associated `ConditionAccount`(s), render condition cards with type-specific metadata and action buttons.

2. **crankTime mutation + UI** — simplest crank: 2 accounts, no extra resolution. Proves the crank pattern. Button visible when `condition.timeBased.met === false && condition.timeBased.unlock_at < Date.now()/1000`.

3. **crankOracle mutation + UI** — adds Pyth price_feed account resolution. The condition stores `feed_account` (Pubkey). On devnet, this is the Pyth PriceUpdateV2 account. The UI must pass this as the `price_feed` account. Price display is optional but useful.

4. **crankTokenGate mutation + UI** — adds holder_token_account resolution. Must derive the ATA for `condition.tokenGated.holder` + `condition.tokenGated.required_mint`.

5. **signMultisig mutation + UI** — first permissioned action. Must check `wallet.publicKey` is in `condition.multisig.signers[]`. Show approval progress (N of threshold).

6. **confirmWebhook mutation + UI** — second permissioned. Must check `wallet.publicKey === condition.webhook.relayer`. Add event hash input field.

7. **Compliance page rewrite** — replace mock data with live `ComplianceEntry` reads + `setCompliance` write form.

8. **Relayer registration** — simplest slice item; decide on storage approach.

### Verification Approach

- **S01 acceptance:** Create a time-conditioned payment (M002 wizard), wait for unlock, click "Crank Time" on the agreement detail page, verify condition status changes to met. For oracle: create oracle-conditioned payment, click "Crank Oracle" when price condition is met on Pyth devnet feed.
- **S02 acceptance:** Create a 2-of-3 multisig payment, connect as signer1 and approve, switch wallet to signer2 and approve, verify condition met. Create a webhook payment, connect as relayer wallet, paste event hash, confirm, verify condition met.
- **S03 acceptance:** Navigate to Compliance page, add a wallet entry with is_allowed=true, verify ComplianceEntry PDA exists on-chain. Register a relayer on the Relayers page.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Pyth price feed account data parsing | Direct account fetch + manual byte parsing (contract already does this) | The contract parses PriceUpdateV2 at fixed offsets. The frontend only needs to pass the account pubkey — no client-side price parsing required for the crank. Optional: use `@pythnetwork/hermes-client` for price display. |
| Token account ATA derivation | `@solana/spl-token` `getAssociatedTokenAddressSync()` | Already a transitive dependency via wallet adapter. Used in M002 for fund payment. |
| Transaction mutation pattern | M002's `useMutation` + `queryClient.invalidateQueries` | Established pattern in M002, all 7 new mutations follow it identically. |
| Transaction feedback UI | `TransactionStatus` component from M002 | Already built, handles loading/success/error states. |

## Constraints

- **Pyth devnet PriceUpdateV2 accounts are pull-based** — they require a Hermes price update to be posted before the on-chain account data is fresh. If the price_feed account data is >60 seconds old, `crank_oracle` will fail with `OraclePriceStale`. The UI should warn when data is stale or offer a "Refresh Price" action using the Pyth Hermes API.
- **Multisig signer === connected wallet** — the signer must be the transaction signer. The UI must check `publicKey` against the condition's `signers[]` array and show "Approve" only when matched. Cannot sign on behalf of another wallet.
- **Webhook event_hash is [u8; 32]** — the UI needs to accept a hex string and convert to 32-byte array. Must match the hash stored in the condition exactly.
- **setCompliance is init_if_needed** — creating a new entry costs lamports (rent). The authority pays. Updating an existing entry just changes `is_allowed`.
- **No on-chain relayer registry exists** — the contract's `confirmWebhook` checks `relayer == condition.webhook.relayer` but doesn't have a registry account. Relayer registration must be off-chain.
- **All cranks require `payment.status == Active` and `condition_account.milestone_status == MilestoneStatus::Active`** — the UI should only show crank buttons for active payments with active milestones.

## Common Pitfalls

- **Pyth feed staleness on devnet** — Pyth devnet feeds update less frequently than mainnet. The `MAX_PRICE_AGE_SECS = 60` constraint may cause frequent "OraclePriceStale" errors. Consider: (1) calling Hermes to post a fresh update before cranking, or (2) showing a clear "Price data is stale" message with a retry button. This is the highest friction point in M003.
- **Condition index vs array index** — the `condition_index: u8` arg is a 0-based index into `condition_account.conditions[]`. The UI must track which condition in the array it's acting on, not just display order.
- **Multisig signer position discovery** — `signers.findIndex(s => s.equals(wallet.publicKey))` must use Pubkey comparison (`.equals()`), not string comparison. Raw base58 strings can differ in case/format.
- **Hex-to-bytes for event_hash** — `event_hash` is `[u8; 32]` on-chain. The UI should accept a 64-char hex string and convert to `Uint8Array`. Validate length strictly — the contract checks exact match.
- **ConditionAccount PDA derivation** — seeds are `["conditions", payment.key(), milestone_index]`. For simple payments, `milestone_index = 0`. For milestone payments, iterate `0..milestone_count`.

## Open Risks

- **Pyth devnet price feed freshness** — pull-based feeds may require an explicit Hermes POST before cranking. If this is needed, the frontend must integrate the Hermes HTTP API (POST price update transaction) as a pre-flight step before calling `crankOracle`. This adds a multi-step flow: (1) fetch price from Hermes, (2) post update tx, (3) crank oracle. Research the current Pyth devnet Hermes endpoint availability.
- **Agreement detail page routing** — M002 does not create a detail page (`/agreements/[id]`). M003 must create one. The "id" could be the payment pubkey (base58) or the payment_id (u64). Using pubkey is simpler (direct account fetch) but makes ugly URLs. Using payment_id requires an index lookup. Recommend pubkey for devnet simplicity.
- **Relayer registry decision** — no on-chain relayer registry account exists. Options: (1) localStorage — simplest, single-user, no persistence across browsers; (2) tRPC endpoint + database — proper persistence but adds backend; (3) on-chain PDA — requires contract modification (out of scope). **Recommend localStorage for devnet MVP** — the relayer page becomes a local bookmark of known relayer pubkeys + labels. Can be upgraded to a database later.
- **No agreement detail page from M001/M002** — the agreements list page has no row click → detail navigation. M003 S01 must add both the detail route and clickable rows on the list page.

## Candidate Requirements

The following are gaps surfaced during research that could become requirements. They are advisory — the user decides scope.

1. **Pyth price display on oracle conditions** — show current price from the feed alongside the target value and operator so users know whether the condition is close to being met. Not strictly required (the crank just passes or fails) but significantly improves UX. *Candidate for R-new or advisory note in S01.*

2. **Condition staleness indicators** — for oracle conditions, show whether the Pyth feed is fresh or stale before allowing crank. For time conditions, show countdown to unlock. *Candidate for R-new or advisory.*

3. **Transaction error decoding** — M003 instructions have specific error codes (OraclePriceStale, OracleConfidenceTooWide, SignerNotInList, RelayerMismatch, EventHashMismatch, TokenBalanceInsufficient). The UI should decode these into human-readable messages. *Candidate for R-new — applies to all M003 instructions.*

4. **Condition met → evaluate and release prompt** — when all conditions in a ConditionAccount become met (AND mode: all true; OR mode: any true), the UI should prompt or enable an "Evaluate & Release" button. This bridges M002's release flow with M003's condition satisfaction. *Likely table stakes — should be handled in S01 or S02.*

## Sources

- Instruction account contexts derived from IDL at `target/idl/gherkin_pay.json` and Rust source in `programs/gherkin-pay/src/instructions/`
- Test patterns from `tests/gherkin-pay.ts` (signMultisig, confirmWebhook call signatures confirmed)
- M001 infrastructure (S01–S03 summaries) and M002 patterns (S01, S03 summaries, RESEARCH.md) used to confirm established hooks and mutation patterns
- Pyth PriceUpdateV2 account layout from `crank_oracle.rs` inline comments (offsets 73–101 for price/conf/publish_time)
- ComplianceEntry PDA seeds from `gherkin_pay_hook` source: `["compliance", mint, wallet]`
