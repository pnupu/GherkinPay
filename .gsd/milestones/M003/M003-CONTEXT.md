---
depends_on: [M001, M002]
---

# M003: Advanced Flows

**Gathered:** 2026-03-18
**Status:** Ready for planning (after M002 completes)

## Project Description

GherkinPay's advanced condition management flows: permissionless cranks (time, Pyth oracle, token-gate), multisig approval coordination, webhook relayer confirmation, compliance allowlist management via the Token-2022 hook program, and relayer registration.

## Why This Milestone

M002 covers the happy path for simple conditions. M003 covers everything that makes GherkinPay's condition engine actually useful in production — oracle-driven releases, coordinated approvals, off-chain event attestation, and compliance enforcement.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Click "Crank Time" on an agreement where the unlock timestamp has passed, triggering the time condition evaluation
- Click "Crank Oracle" on an oracle-conditioned agreement, fetching the Pyth price feed and evaluating the condition on-chain
- Click "Crank Token Gate" on a token-gated agreement to verify the holder's balance
- As one of the registered multisig signers, click "Approve" on a condition and see approval count update
- As a registered relayer, paste an event hash and confirm a webhook condition
- As an admin, add or update a wallet's compliance allowlist entry in the hook program
- Register a relayer pubkey with metadata in the Relayers page

### Entry point / environment

- Entry point: Agreement detail view (cranks, multisig, webhook), Compliance page (allowlist management), Relayers page (registration)
- Environment: Browser, devnet Solana
- Live dependencies: Solana devnet RPC, Pyth devnet price feeds, connected wallet

## Completion Class

- Contract complete means: all remaining instructions (crankTime, crankOracle, crankTokenGate, signMultisig, confirmWebhook, setCompliance) callable from UI
- Integration complete means: a full oracle-gated payment can be created, funded, oracle-cranked, and released entirely via the UI
- Operational complete means: compliance entry created via UI blocks a subsequent non-compliant transfer attempt

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Create an oracle-conditioned payment, fund it, crank the Pyth oracle when the price condition is met, and release — all via the UI on devnet
- Create a 2-of-3 multisig payment, fund it, have two signers approve via the UI, then release
- Add a wallet to the compliance allowlist via the Compliance page and verify the ComplianceEntry exists on-chain

## Risks and Unknowns

- Pyth devnet feed addresses — need to look up current devnet feed pubkeys for common symbols (SOL/USD, BTC/USD, etc.)
- Relayer registry design — the contract has no on-chain relayer registry; need to decide whether to use an off-chain store or introduce a simple on-chain registry account
- Multisig signing UX — the signer must be the currently-connected wallet; the UI must check if the connected wallet is in the signer list and which index they are

## Existing Codebase / Prior Art

- `programs/gherkin-pay/src/instructions/crank_time.rs`
- `programs/gherkin-pay/src/instructions/crank_oracle.rs`
- `programs/gherkin-pay/src/instructions/crank_token_gate.rs`
- `programs/gherkin-pay/src/instructions/sign_multisig.rs`
- `programs/gherkin-pay/src/instructions/confirm_webhook.rs`
- `programs/gherkin-pay-hook/src/lib.rs` — setCompliance instruction and ComplianceEntry account

> See `.gsd/DECISIONS.md` for architectural decisions — append new ones during execution.

## Relevant Requirements

- R011 — Time condition crank
- R012 — Oracle condition crank (Pyth)
- R013 — Token gate crank
- R014 — Multisig signing
- R015 — Webhook confirmation
- R016 — Compliance allowlist management
- R017 — Relayer registration

## Scope

### In Scope

- Time crank button on condition detail (visible when unlock_at < now and not yet met)
- Oracle crank with Pyth feed resolution (Pyth SDK, devnet feeds)
- Token gate crank
- Multisig signing — connected wallet sees "Approve" if they are in the signer list and haven't signed yet; approval count badge
- Webhook confirmation — relayer sees a form to paste event hash; gated to the registered relayer pubkey
- Compliance allowlist management — add/update wallet entries via the hook program's setCompliance instruction
- Relayer registration — either simple on-chain account or off-chain registry (decided during M003 planning)

### Out of Scope / Non-Goals

- Pyth feed browser/search UI (R018, deferred) — users paste feed pubkeys directly
- Mobile wallet adapter
- Mainnet

## Technical Constraints

- Pyth oracle: use `@pythnetwork/client` or `@pythnetwork/price-service-client` for devnet feeds
- All cranks are permissionless — no wallet ownership check needed (any connected wallet can submit)
- Multisig and webhook are permissioned — must check connected wallet matches registered signer/relayer

## Integration Points

- `gherkin_pay` program — crank, sign, confirm instructions
- `gherkin_pay_hook` program — setCompliance instruction
- Pyth devnet price feeds — oracle condition evaluation
- Solana devnet RPC

## Open Questions

- Relayer registry: on-chain PDA vs off-chain database — decision deferred to M003 planning phase
- Pyth devnet feed pubkeys for the condition builder in M002 — need to pre-populate a feed list for the oracle condition form
