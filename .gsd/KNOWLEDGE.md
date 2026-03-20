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
