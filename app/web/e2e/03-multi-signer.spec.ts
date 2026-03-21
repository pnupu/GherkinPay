/**
 * Multi-signer tests: multisig condition, compliance, webhook.
 *
 * Covers TESTING.md Tests 9, 10, 13 — the tests that require wallet switching.
 * Uses `switchWallet` fixture to change the active keypair mid-test.
 */

import { test, expect } from "./fixtures";

test.describe("Multisig Condition (Test 9)", () => {
  test.skip("create payment with multisig, approve with two signers", async ({
    connectedPage: page,
    testKeypair,
    generateFundedKeypair,
    switchWallet,
  }) => {
    // Generate a second signer
    const signer2 = await generateFundedKeypair();
    const signer1Address = testKeypair.publicKey.toBase58();
    const signer2Address = signer2.keypair.publicKey.toBase58();

    // Create payment with multisig condition
    await page.goto("/agreements");
    await page.getByRole("button", { name: /create payment/i }).click();

    // Fill payee + amount
    const payeeInput = page.getByLabel(/payee/i).or(
      page.locator('input[placeholder*="payee" i]'),
    );
    await payeeInput.fill(signer2Address); // payee = signer2

    const amountInput = page.getByLabel(/amount/i).or(
      page.locator('input[placeholder*="amount" i]'),
    );
    await amountInput.fill("0.01");

    // Next → conditions
    await page.getByRole("button", { name: "Next", exact: true }).click();

    // 9.1 — Select multisig condition type (Radix Select, not native)
    const conditionTypeSelect = page.getByRole("combobox").first();
    await conditionTypeSelect.click();
    await page.getByRole("option", { name: /multi/i }).click();

    // 9.2 — Add signer addresses and threshold
    const signerInputs = page.locator('input[placeholder*="signer" i]');
    await signerInputs.nth(0).fill(signer1Address);

    // Add second signer
    const addSignerBtn = page.getByRole("button", { name: /add signer/i });
    if (await addSignerBtn.isVisible().catch(() => false)) {
      await addSignerBtn.click();
    }
    await signerInputs.nth(1).fill(signer2Address);

    // Set threshold to 2
    const thresholdInput = page.getByLabel(/threshold/i).or(
      page.locator('input[placeholder*="threshold" i]'),
    );
    await thresholdInput.fill("2");

    // Next → review → submit
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: /submit|create/i }).click();
    await expect(
      page.getByText(/confirmed/i).or(page.getByText(/success/i)),
    ).toBeVisible({ timeout: 30_000 });

    // Close wizard, fund the payment
    const closeBtn = page.getByRole("button", { name: /close|done|×/i });
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    }

    await page.goto("/agreements");
    const fundBtn = page.getByRole("button", { name: /fund/i }).first();
    await expect(fundBtn).toBeVisible({ timeout: 15_000 });
    await fundBtn.click();
    await page
      .getByRole("button", { name: /confirm|fund/i })
      .last()
      .click();
    await expect(
      page.getByText(/confirmed/i).or(page.getByText(/success/i)),
    ).toBeVisible({ timeout: 30_000 });

    // Navigate to detail page
    await page.goto("/agreements");
    const link = page.locator("a[href*='/agreements/']").first();
    await link.click();

    // 9.6 — Signer 1 approves
    const approveBtn = page.getByRole("button", { name: /approve/i });
    await expect(approveBtn).toBeVisible({ timeout: 10_000 });
    await approveBtn.click();
    await expect(
      page.getByText(/confirmed/i).or(page.getByText(/success/i)),
    ).toBeVisible({ timeout: 30_000 });

    // 9.7 — Switch to signer 2 and approve
    await switchWallet(signer2.secretKeyBase64);

    // Reload the detail page to pick up new wallet context
    await page.reload();
    const approveBtn2 = page.getByRole("button", { name: /approve/i });
    await expect(approveBtn2).toBeVisible({ timeout: 10_000 });
    await approveBtn2.click();

    // Threshold met → condition should show "Met"
    await expect(page.getByText("Met", { exact: true }).first()).toBeVisible({ timeout: 30_000 });
  });
});

test.describe("Compliance (Test 13)", () => {
  test("set and verify compliance status", async ({
    connectedPage: page,
    testKeypair,
  }) => {
    await page.goto("/compliance");
    const address = testKeypair.publicKey.toBase58();

    // 13.2 — Lookup: should show not registered
    const lookupInput = page.locator('#lookup-address');
    await expect(lookupInput).toBeVisible({ timeout: 10_000 });
    await lookupInput.fill(address);

    const checkBtn = page.getByRole("button", { name: /check status/i });
    await checkBtn.click();

    // Should show either "Not registered" or the current status
    await expect(
      page.getByText(/not registered/i).or(page.getByText(/allowed/i)).or(page.getByText(/blocked/i)),
    ).toBeVisible({ timeout: 10_000 });

    // 13.3 — Set compliance: fill the "Set compliance" form
    const setAddressInput = page.locator('#set-address');
    await setAddressInput.fill(address);

    // "Allow" radio should already be selected by default
    const submitBtn = page.getByRole("button", { name: /submit/i });
    await expect(submitBtn).toBeVisible({ timeout: 5_000 });
    await submitBtn.click();

    // Wait for tx confirmation — look for any success indicator
    await expect(
      page.getByText(/confirmed/i)
        .or(page.getByText(/success/i))
        .or(page.getByText(/allowed/i))
        .first(),
    ).toBeVisible({ timeout: 30_000 });
  });
});
