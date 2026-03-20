# Knowledge Base

<!-- Lessons learned during execution. Read this before planning any new slice. -->

## Anchor 0.32 + TypeScript: IDL Casting Required

**Context:** M003/S01/T01
**Problem:** Anchor 0.32's `IdlSeed` type uses literal unions (`"account" | "const" | "arg"`) that don't match JSON import inference (`string`). Using `Program<GherkinPay>` generic fails with strict TypeScript.
**Solution:** Cast IDL as `Idl` type: `new Program(idl as Idl, provider)`. Use separate TypeScript interfaces in `src/types/` for account data typing.
**Impact:** All downstream code (queries, mutations) uses `(program.account as any).accountName` and `(program.methods as any).methodName()` with file-level eslint-disable headers. This is the pragmatic pattern for Anchor 0.32.

## Anchor Account Accessors Fail Silently

**Context:** M003/S01/T02
**Problem:** `(program.account as any).wrongName.all()` returns an empty array with no error — not a crash, not an exception, just no data.
**Solution:** Double-check account names match the IDL exactly (camelCase). If queries return empty when data exists, the account name is wrong.
**Diagnostic:** Compare `Object.keys(program.account)` against IDL account names.

## PublicKey Objects Break useCallback Deps

**Context:** M003/S01/T03
**Problem:** `new PublicKey(stringProp)` creates a new object reference on every render, making `useCallback` deps arrays unstable and causing infinite re-renders or stale closures.
**Solution:** Use inline arrow functions in onClick handlers instead of useCallback for handlers that create PublicKey objects from props. The component only renders when visible anyway.

## Pyth PriceUpdateV2 Byte Offsets

**Context:** M003/S01/T03 (D011)
**Layout:** price (i64) at offset 73, conf (u64) at 81, exponent (i32) at 89, publish_time (i64) at 93. Total parsed region: bytes 73-101.
**Endianness:** Little-endian (Solana convention). Use DataView with `true` for littleEndian parameter.
**Staleness:** MAX_PRICE_AGE_SECS = 60. If `Date.now()/1000 - publish_time > 60`, the on-chain program will reject with OraclePriceStale (error 6009).

## memcmp Filter Offset for Anchor Accounts

**Context:** M003/S01/T02
**Pattern:** Anchor prepends an 8-byte discriminator to all accounts. To filter ConditionAccounts by their `payment` field (first field after discriminator), use `memcmp` at offset 8 with the payment pubkey bytes.
**Gotcha:** The offset is from the raw account data start, not from the deserialized struct.

## Wallet Identity Gating Pattern

**Context:** M003/S02
**Pattern:** For permissioned actions (multisig approve, webhook confirm), use `useWallet().publicKey` with `PublicKey.equals()` to check if the connected wallet matches an on-chain identity (signer list entry, relayer pubkey). Never compare `.toString()` strings — `equals()` handles the comparison correctly.
**UX:** Show contextual messages for three states: wallet disconnected, wrong wallet connected, or eligible wallet connected. Only the eligible state shows the action button.

## Permissioned vs Permissionless Component Isolation

**Context:** M003/S02 (D012)
**Problem:** Sharing `TransactionStatus` state between permissioned and permissionless actions causes mutation state collision — one action's success/error overwrites another's feedback.
**Solution:** Extract each permissioned action as its own sub-component (MultisigAction, WebhookAction) with dedicated `useMutation` + `TransactionStatus` state. Permissionless cranks share a single CrankAction component since only one is visible per condition.

## hookProgram Follows Same Mutation Pattern

**Context:** M003/S03/T01
**Pattern:** The Token-2022 transfer hook program (`gherkin_pay_hook`) uses the exact same mutation pattern as the main program — just swap `program` for `hookProgram` from `useAnchorProgram()`. The eslint-disable header, console logging, error decoding, and cache invalidation are all identical.
**Gotcha:** The hookProgram authority is different from the main program authority. Non-authority wallets get a decoded error after the on-chain transaction fails — no UI pre-check exists.
