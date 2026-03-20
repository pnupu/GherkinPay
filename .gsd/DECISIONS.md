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
| D009 | M002/S03 | arch | Include crankTime in M002 release flow | Minimal crankTime call before evaluateAndRelease for unmet TimeBased conditions | M002 acceptance criteria require releasing a time-based payment; crankTime is permissionless and single-instruction; without it, release can't be demonstrated; full crank UI remains M003 scope | No — minimal inclusion is necessary for M002 to be self-contained |
| D010 | M002/S01/T04 | architecture | Wizard top-level form state management | Local useState instead of react-hook-form for wizard steps | ConditionBuilder already manages its own internal RHF form with useFieldArray. Nesting RHF forms (wizard-level RHF wrapping condition-level RHF) causes context conflicts. useState for step state + ConditionBuilder's controlled props (value/onChange/onValidChange) avoids the issue. | Yes — if wizard grows more complex steps that need form-level validation |
