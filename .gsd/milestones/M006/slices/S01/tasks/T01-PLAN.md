---
estimated_steps: 5
estimated_files: 2
skills_used: []
---

# T01: Fix oracle hex feed ID plumbing and add FX presets

**Slice:** S01 — FX Oracle Post+Crank
**Milestone:** M006

## Description

Clicking any oracle preset currently fails zod validation because `oracleSchema.feedAccount` uses a `publicKeyString` validator that requires base58, but `ORACLE_PRESETS` stores Pyth feed IDs as hex strings (with `0x` prefix). This pre-existing bug blocks all preset usage — both existing crypto presets and the new FX presets we need to add.

This task fixes the validation pipeline to accept hex feed IDs, strips the `0x` prefix from existing presets, adds EUR/USD, GBP/USD, and USD/JPY as FX presets, and updates the wizard's `toConditionInput()` to correctly convert hex feed IDs to on-chain PublicKeys.

## Steps

1. **Update `oracleSchema.feedAccount` in `condition-builder.tsx`** — Replace the `publicKeyString` validator with a custom refinement that accepts either:
   - A valid base58 Solana address (32-44 chars, `new PublicKey(val)` succeeds), OR
   - A 64-character hex string `[0-9a-fA-F]{64}` (32 bytes as hex)
   The error message should say "Invalid feed ID (base58 address or 64-char hex)".

2. **Normalize existing `ORACLE_PRESETS`** — Strip the `0x` prefix from all existing crypto feed IDs (SOL/USD, BTC/USD, ETH/USD, USDC/USD). Keep the "Custom…" entry with empty feedId. Add three new FX presets after the crypto presets:
   - `{ label: "EUR / USD", feedId: "a995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b", decimals: 5, category: "fx" }`
   - `{ label: "GBP / USD", feedId: "84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7c1", decimals: 5, category: "fx" }`
   - `{ label: "USD / JPY", feedId: "ef2c98c804ba503c6a707e38be4dfbb16683775f195b091252bf24693042fd52", decimals: 3, category: "fx" }`
   Add a `category: "crypto"` field to the existing crypto presets as well, and add `category` to the type.

3. **Add category separators in `OracleFields`** — In the preset button rendering, group by category and render small labels ("Crypto" / "FX") before each group. Use the existing `Label` component with `text-xs text-muted-foreground`.

4. **Auto-set decimals when a preset is clicked** — In `OracleFields`, when a preset button is clicked, also call `field.onChange` for the `decimals` field using the preset's `decimals` value. Use the `control`'s `setValue` (you'll need to accept `setValue` as a prop from the parent, or use `useFormContext`, or use `Controller` for decimals that reacts to feedAccount changes). The simplest approach: in the preset button's `onClick`, use `control._formValues` or pass `setValue` down. Research note: the `OracleFields` component has access to `control`, and the pattern already used in the parent is `setValue(...)`. Add `setValue` to the `FieldProps` interface and thread it from `ConditionRow` → `OracleFields`.

5. **Update `toConditionInput()` in `create-payment-wizard.tsx`** — In the `oracle` case, detect whether `c.feedAccount` is hex (64-char `[0-9a-fA-F]`) and convert appropriately:
   ```typescript
   const isHex = /^[0-9a-fA-F]{64}$/.test(c.feedAccount);
   const feedAccount = isHex
     ? new PublicKey(Buffer.from(c.feedAccount, 'hex'))
     : new PublicKey(c.feedAccount);
   ```

## Must-Haves

- [ ] `oracleSchema.feedAccount` accepts both base58 and 64-char hex strings
- [ ] All `ORACLE_PRESETS` use bare hex (no `0x` prefix)
- [ ] EUR/USD, GBP/USD, USD/JPY presets present with correct feed IDs and decimals
- [ ] Clicking a preset auto-fills decimals from the preset
- [ ] `toConditionInput()` converts hex feed IDs to PublicKey via `Buffer.from(hex, 'hex')`
- [ ] `bun run build` exits 0

## Verification

- `cd app/web && bun run build` exits 0
- `grep -c "EUR / USD\|GBP / USD\|USD / JPY" app/web/src/components/condition-builder.tsx` returns 3 (all FX presets present)
- `grep "0x" app/web/src/components/condition-builder.tsx | grep -c feedId` returns 0 (no `0x` prefixes remain in preset feedIds)
- `grep -c "Buffer.from" app/web/src/components/create-payment-wizard.tsx` returns >= 1 (hex conversion present)

## Observability Impact

- **Signals changed:** Zod validation errors for `feedAccount` will now accept hex strings — validation rejection messages change from "Invalid Solana address (base58)" to "Invalid feed ID (base58 address or 64-char hex)" for the oracle condition type.
- **Inspection:** A future agent can verify hex feed ID plumbing by checking that ORACLE_PRESETS contain bare 64-char hex strings (no `0x` prefix), that `oracleSchema.feedAccount` refinement accepts both formats, and that `toConditionInput()` has a `Buffer.from(hex, 'hex')` code path.
- **Failure visibility:** If a preset click still fails validation, the form will show the updated error message. If hex→PublicKey conversion fails, the create-payment mutation will throw with a clear "Invalid public key input" error from `@solana/web3.js`.

## Inputs

- `app/web/src/components/condition-builder.tsx` — Contains ORACLE_PRESETS, oracleSchema, OracleFields component
- `app/web/src/components/create-payment-wizard.tsx` — Contains toConditionInput() with `new PublicKey(c.feedAccount)` at line ~94

## Expected Output

- `app/web/src/components/condition-builder.tsx` — Updated with hex-accepting schema, normalized presets, FX presets, category labels, decimals auto-fill
- `app/web/src/components/create-payment-wizard.tsx` — Updated toConditionInput() with hex→PublicKey conversion
