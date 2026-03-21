# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? |
|---|------|-------|----------|--------|-----------|------------|
| D001 | M001 | library | shadcn/ui installation path | shadcn canary (Tailwind v4 path) | Project is on Tailwind v4; canary supports CSS-based config, no tailwind.config.ts needed, aligns with existing globals.css approach | Yes — if shadcn v4 goes stable |
| D002 | M001 | arch | Network target | Devnet | User confirmed devnet for all development; mainnet explicitly out of scope until ready | Yes — single env var change |
| D003 | M001 | data | Payment token | USDC (Token-2022 devnet mint) | User confirmed USDC; other Token-2022 mints out of scope for UI | Yes — UI restriction only, contract is generic |
| D004 | M001 | library | Oracle price feed source | Pyth | User confirmed Pyth; standard on Solana devnet, well-documented SDKs | Yes — if Switchboard preferred later |
| D005 | M001 | arch | Design system coexistence | Keep existing GherkinPay CSS tokens, add shadcn tokens alongside | Existing --bg/--green/--surface tokens are used throughout all pages; shadcn needs --background/--primary/--card; both live in globals.css, shadcn components themed to match dark green palette | Yes — could consolidate later |
| D006 | M001 | arch | Wallet adapter strategy | @solana/wallet-adapter-react with ConnectionProvider + WalletProvider in a client boundary | Next.js App Router requires wallet providers in a client component; Wallet Standard auto-detects Phantom and Solflare without explicit adapters | No |
| D007 | M001/S01/T01 | library | How to initialize shadcn/ui in GherkinPay frontend | Manual components.json creation instead of interactive `shadcn init` | Interactive `shadcn init` overwrites globals.css and prompts for input, which is incompatible with automated execution. Manual creation gives full control over alias paths (~/  not @/) and preserves the existing CSS design system. | Yes |
| D008 | M001/S03 | arch | How to handle Anchor 0.32 Program generic type inference in query hooks | Cast to Program<GherkinPay> at query hook level | Anchor 0.32 Program constructor takes `idl: any`, so TypeScript always infers Program<Idl> regardless of IDL object cast. Accessing typed accounts like program.account.paymentAgreement requires the specific generic. Casting at the hook keeps anchor.ts unchanged and is a single-point fix per query file. | Yes |
