# T03: Agreement Detail Page Integration

## Objective
Add `<MpcBadge />` next to payer, payee, and authority wallet addresses on the agreement detail page.

## Files to Modify
- **Modify:** `app/web/src/app/(console)/agreements/[id]/page.tsx`

## Implementation Notes

Three `<dd>` elements need modification (lines ~160, ~164, ~180):

**Before:**
```tsx
<dd className="font-mono text-xs">{truncatePubkey(payment.payer)}</dd>
```

**After:**
```tsx
<dd className="flex items-center gap-1.5 font-mono text-xs">
  {truncatePubkey(payment.payer)}
  <MpcBadge />
</dd>
```

Apply the same pattern to:
1. `payment.payer` (Payer)
2. `payment.payee` (Payee)
3. `payment.authority` (Authority)

Do NOT add the badge to `payment.tokenMint` — that's a token mint address, not a wallet/signer.

### Import
```tsx
import { MpcBadge } from "~/components/mpc-badge";
```

## Verification
```bash
cd app/web && bun run build
# Must exit 0
grep -c "MpcBadge" app/web/src/app/\(console\)/agreements/\[id\]/page.tsx
# Should return 4 (1 import + 3 usages)
```
