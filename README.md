# ◆ GherkinPay

**Institutional stablecoin escrow infrastructure on Solana.**

Programmable, condition-gated settlement with KYC/AML enforcement, Travel Rule compliance, and milestone-based releases — built for regulated stablecoin payments.

🔗 **Live demo:** [gherkinpay.lacertalabs.xyz](https://gherkinpay.lacertalabs.xyz)  
📡 **Network:** Solana Devnet  
🏗️ **Track:** StableHacks 2026 — Track 3: Programmable Stablecoin Payments

---

## Problem

Institutional stablecoin payments need programmable settlement logic with compliance built in — not bolted on. Traditional escrow is manual, off-chain, and opaque. Existing DeFi protocols lack the regulatory infrastructure (KYC, AML, Travel Rule) that institutions require.

## Solution

GherkinPay is an on-chain escrow protocol where funds are locked in smart contract escrow and released only when verifiable conditions pass. Every payment carries compliance metadata, every wallet is KYC-verified via on-chain allowlists, and every transaction is logged for AML audit.

### Key Capabilities

| Capability | Description |
|---|---|
| **Programmable Escrow** | Composable AND/OR condition trees: time-locks, Pyth oracle price feeds, multisig approval, webhook events, token-gated access |
| **KYC Enforcement** | Token-2022 transfer hook allowlist — only KYC-verified wallets can send or receive settlement tokens |
| **Travel Rule** | Every payment includes a `metadata_uri` linking to sender/receiver identity data per FATF requirements |
| **KYT Monitor** | Real-time transaction event feed for Know Your Transaction monitoring |
| **AML Audit Log** | Filterable on-chain event trail across 7 compliance-relevant event types |
| **Milestone Releases** | Phased stablecoin disbursement — each milestone gated by its own condition set |
| **Multi-Stablecoin** | USDC, USDT, USDG support with custom token extensibility |
| **Autonomous Settlement** | Permissionless crank bot auto-evaluates time, oracle, and token-gate conditions |

## Architecture

```
Internet → Nginx (TLS) → Next.js 15 Console
                              ↓
                     Solana Devnet (RPC)
                         ↓           ↓
               gherkin_pay        gherkin_pay_hook
            (escrow + conditions)  (Token-2022 KYC allowlist)
```

### Smart Contracts (Anchor 0.30)

- **gherkin_pay** — Core escrow protocol: payment creation, funding, condition evaluation, milestone releases, cancellation
- **gherkin_pay_hook** — Token-2022 transfer hook enforcing KYC allowlist on every token transfer

### Condition Engine

Conditions are composable with AND/OR logic. Each payment (or milestone) can have up to 8 conditions:

| Type | Trigger | Use Case |
|---|---|---|
| **Time-Based** | Unix timestamp reached | Payment schedules, vesting |
| **Oracle** | Pyth price feed meets threshold | FX-conditional payments, commodity-linked settlement |
| **Multisig** | M-of-N approvals collected | Corporate treasury, multi-party sign-off |
| **Webhook** | Off-chain event confirmed by relayer | Invoice verification, delivery confirmation |
| **Token-Gated** | Wallet holds minimum token balance | Stakeholder-only payments, loyalty tiers |

### Compliance Stack

```
┌─────────────────────────────────────────────┐
│  KYC Allowlist (Transfer Hook)              │
│  └─ On-chain PDA per wallet: allowed/blocked│
├─────────────────────────────────────────────┤
│  Travel Rule (metadata_uri per payment)     │
│  └─ Links to VASP identity JSON            │
├─────────────────────────────────────────────┤
│  KYT Monitor (real-time event feed)         │
│  └─ All settlement + condition events       │
├─────────────────────────────────────────────┤
│  AML Audit Log (filterable event trail)     │
│  └─ 7 event types, searchable by wallet/tx  │
└─────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Smart contracts | Anchor 0.30, Rust, Token-2022 |
| Frontend | Next.js 15, TypeScript, Tailwind v4, shadcn/ui |
| Wallet | Solana Wallet Adapter |
| Oracles | Pyth Network price feeds |
| Token standard | SPL Token-2022 with transfer hooks |
| Network | Solana Devnet |
| Hosting | EC2 + Nginx + Let's Encrypt |

## Console Pages

| Page | Purpose |
|---|---|
| **Agreements** | Create, fund, release, and cancel escrow payments |
| **Milestones** | Track phased releases with per-milestone conditions |
| **KYC / AML** | Manage on-chain identity allowlist (allow/block wallets) |
| **Relayers** | Register and manage webhook relay operators |
| **KYT Monitor** | Real-time settlement and condition event feed |
| **AML Audit Log** | Filterable compliance event trail |

## Running Locally

```bash
# Frontend
cd app/web
bun install
bun run dev          # http://localhost:3000

# Smart contracts
anchor build
anchor test          # 33 passing tests
anchor deploy        # Solana devnet
```

## Test Coverage

33 passing on-chain tests covering:
- Payment lifecycle (create → fund → evaluate → release/cancel)
- All 5 condition types (time, oracle, multisig, webhook, token-gate)
- Milestone payment flows
- Edge cases and error conditions

## Team

Built for StableHacks 2026 — Track 3: Programmable Stablecoin Payments.

## License

MIT
