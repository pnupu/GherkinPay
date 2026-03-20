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
| D007 | M001/S01 | convention | CSS collision resolution pattern | Prefix GherkinPay tokens with gp- when they collide with shadcn tokens | Lets shadcn own its namespace cleanly; existing CSS classes keep working; cleaner than aliasing | Yes — if full consolidation done later |
| D008 | M001/S01 | convention | shadcn init approach | Manual components.json creation, not interactive shadcn init | Interactive init overwrites globals.css; manual creation preserves existing CSS and lets us control merge | No |
| D009 | M003 | arch | Relayer registry storage | localStorage-based off-chain registry for devnet MVP | No on-chain relayer registry exists; contract modification out of scope; database adds disproportionate backend work. localStorage stores pubkey + label, persists across reloads, adequate for devnet | Yes — upgrade to tRPC + database when multi-user discovery needed |
| D010 | M003 | arch | Agreement detail page URL scheme | Payment pubkey (base58) as route param: /agreements/[id] | Direct account fetch without index lookup; payment_id (u64) would require iterating accounts. Base58 pubkeys are long but acceptable for devnet | Yes — could switch to shorter payment_id with index |
| D011 | M003 | library | Pyth oracle price display strategy | Read PriceUpdateV2 account directly (same byte offsets as contract); Hermes HTTP API only for freshness refresh | Avoids adding @pythnetwork/hermes-client as heavy dependency. Contract already parses at fixed offsets 73-101. Hermes POST only needed when data >60s stale | Yes — could switch to Pyth SDK if it simplifies |
