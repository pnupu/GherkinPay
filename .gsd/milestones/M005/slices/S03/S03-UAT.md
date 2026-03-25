# S03 UAT: Devnet Deploy & Smoke Test

## Preconditions

- Solana CLI installed and configured for devnet (`solana config set --url devnet`)
- Deploy authority keypair at `~/.config/solana/id.json` with devnet SOL balance
- bun installed (v1.0+)
- `bun install` completed in both repo root and `app/web/`
- A Solana wallet browser extension (Phantom or Solflare) configured for devnet

---

## Test Case 1: Program Deployment Verification

**Objective:** Confirm the program is deployed to devnet with the correct account layout.

1. Run: `solana program show 2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV --url devnet`
2. **Expected:** Exit 0. Output shows:
   - Program Id: `2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV`
   - Data Length: `422944` bytes
   - Authority: `nnAH8phxSRgVSez4hFonzQh5ZC4LeWsTTz5koSsqv5U`
3. Run: `solana program show 2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV --url devnet 2>&1 | grep -q "Data Length"`
4. **Expected:** Exit 0 (Data Length field present in output)

---

## Test Case 2: Frontend Type Sync

**Objective:** Confirm generated types are identical to frontend types and include metadataUri.

1. Run: `diff target/types/gherkin_pay.ts app/web/src/types/gherkin_pay.ts`
2. **Expected:** No output, exit 0 (files are identical)
3. Run: `grep -c metadataUri app/web/src/types/gherkin_pay.ts`
4. **Expected:** Output `4` (PaymentAgreement type, create_payment args, create_milestone_payment args, PaymentCreated event)
5. Run: `grep 'gherkinPay' app/web/src/types/gherkin_pay.ts | head -1`
6. **Expected:** Contains the program name "gherkinPay" (not the old "triggerPay")

---

## Test Case 3: Frontend Build

**Objective:** Confirm the frontend compiles clean with synced types.

1. Run: `cd app/web && bun run build`
2. **Expected:** Exit 0. Output shows all 10 routes compiled:
   - `/`, `/_not-found`, `/activity`, `/agreements`, `/agreements/[id]`, `/api/trpc/[trpc]`, `/audit`, `/compliance`, `/milestones`, `/relayers`
3. **Expected:** No TypeScript errors in build output

---

## Test Case 4: Crank Bot Devnet Connectivity

**Objective:** Confirm the crank bot connects to devnet and deserializes accounts without errors.

1. Run: `perl -e 'alarm 15; exec @ARGV' -- bun run scripts/crank-bot.ts --dry-run 2>&1`
2. **Expected:** Exit 142 (killed by timeout after 15s — normal). Stdout includes:
   - `[INFO] GherkinPay Crank Bot starting` with `rpc=https://api.devnet.solana.com` and `dryRun=true`
   - `[INFO] Program loaded programId=2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV`
   - `[INFO] Poll cycle #1 complete` with `cranked=0 skipped=0 errors=0`
3. **Not expected:** Any `[ERROR]` lines, deserialization failures, or connection refused messages

---

## Test Case 5: All-in-One Verification Script

**Objective:** Confirm the verification script validates all slice criteria.

1. Run: `bash scripts/verify-s03-smoke.sh`
2. **Expected:** Exit 0. Output shows 6 checks, all PASS:
   - `[Program deployed] ... PASS ✅`
   - `[Program data inspectable] ... PASS ✅`
   - `[Types synced] ... PASS ✅`
   - `[metadataUri count = 4] ... PASS ✅`
   - `[Frontend build] ... PASS ✅`
   - `[Crank bot dry-run] ... PASS ✅`
   - `Results: 6 passed, 0 failed`

---

## Test Case 6: Manual UI Roundtrip (R026 — Human UAT)

**Objective:** Prove end-to-end that a payment with metadata_uri can be created via the UI and is visible on the detail page.

### Steps:

1. Start dev server: `cd app/web && bun run dev`
2. Open `http://localhost:3000` in browser
3. Connect a Solana wallet (Phantom or Solflare) switched to **devnet**
4. Ensure the connected wallet has devnet SOL (airdrop via `solana airdrop 2 <address> --url devnet` if needed)
5. Navigate to the Create Payment wizard
6. Fill in payment details:
   - Payee address: any valid devnet pubkey
   - Amount: small value (e.g. 0.01 USDC)
   - Metadata URI: `https://example.com/travel-rule/agreement-001.json`
   - At least one condition (e.g. TimeBased with a future unlock time)
7. Submit the transaction — confirm in wallet popup
8. **Expected:** Transaction succeeds, redirect to agreements list or detail page
9. Navigate to the agreement detail page for the newly created payment
10. **Expected:** The `metadataUri` field displays `https://example.com/travel-rule/agreement-001.json`
11. If the URI is rendered as a link, click it — **Expected:** opens in new tab (or shows appropriate behavior for the URL)
12. Navigate to the agreements list — **Expected:** The new payment appears with correct status

### Edge Cases:

- **Empty metadata_uri:** Create a payment with an empty metadata URI field. The detail page should handle this gracefully (show nothing or "Not provided").
- **Long URI:** Try a metadata URI near the 200-character limit. Should be accepted and displayed without truncation on the detail page.
- **Crank bot after payment creation:** After creating a payment with a TimeBased condition, run `bun run scripts/crank-bot.ts --dry-run` again. **Expected:** It now reports fetching 1+ ConditionAccount(s) instead of 0.

---

## Pass Criteria

- Test Cases 1–5: All automated, all must exit 0 / show expected output
- Test Case 6: Manual — documented for human execution. R026 is validated only after this completes successfully.
