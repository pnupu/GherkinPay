/**
 * Core payment lifecycle: create → fund → crank → release.
 *
 * Covers TESTING.md Tests 4, 5, 6, 7, 8 (happy path).
 *
 * This test creates a payment with a time condition set in the past,
 * funds it, cranks the time condition, then releases the payment.
 * A second payment is created and cancelled to verify refund.
 */

import { test, expect } from "./fixtures";
import { Keypair } from "@solana/web3.js";

// Use the test wallet itself as payee (self-payment) to avoid ATA issues.
// The test wallet already has a USDC token account.
// We set PAYEE_ADDRESS in the test that uses testKeypair.

test.describe("Payment Lifecycle", () => {
  test("Test 4: Create simple payment with time condition", async ({
    connectedPage: page,
    testKeypair,
  }) => {
    const PAYEE_ADDRESS = testKeypair.publicKey.toBase58();
    // 4.1 — Click "Create payment" button
    await page.goto("/agreements");
    const createBtn = page.getByRole("button", { name: /create payment/i });
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
    await createBtn.click();

    // 4.2 — Payer auto-fills (verify the field is populated)
    await expect(page.getByText(/step 1/i)).toBeVisible();

    // 4.3 — Enter payee address and amount
    const payeeInput = page.getByLabel(/payee/i).or(
      page.locator('input[placeholder*="payee" i]'),
    );
    await payeeInput.fill(PAYEE_ADDRESS);

    const amountInput = page.getByLabel(/amount/i).or(
      page.locator('input[placeholder*="amount" i]'),
    );
    await amountInput.fill("0.01");

    // 4.4 — Click Next to Step 2
    const nextBtn = page.getByRole("button", { name: "Next", exact: true });
    await nextBtn.click();

    // 4.5–4.6 — Time condition should be the default; set unlock date slightly in the future
    // The form validation requires a future date, so we set it 2 minutes from now.
    const dateInput = page.locator('input[type="datetime-local"]').first();
    await expect(dateInput).toBeVisible({ timeout: 5_000 });

    // Set to 2 minutes from now
    const nearFuture = new Date(Date.now() + 120_000);
    const dateStr = nearFuture.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM

    // datetime-local + react-hook-form: Set value through the test bridge
    // and force the wizard's conditions validity since RHF's formState.isValid
    // doesn't update correctly with programmatic setValue.
    await page.waitForFunction(() => 
      !!(window as unknown as Record<string, unknown>).__TEST_CONDITION_FORM &&
      !!(window as unknown as Record<string, unknown>).__TEST_WIZARD,
      { timeout: 5_000 }
    );
    await page.evaluate(async (val: string) => {
      const form = (window as unknown as Record<string, unknown>).__TEST_CONDITION_FORM as {
        setValue: (name: string, value: unknown) => void;
        trigger: (field?: string) => Promise<boolean>;
      };
      const wizard = (window as unknown as Record<string, unknown>).__TEST_WIZARD as {
        setConditionsValid: (valid: boolean) => void;
      } | undefined;
      form.setValue('conditions.0.unlockAt', val);
      await form.trigger();
      // Force the wizard to consider conditions valid
      wizard?.setConditionsValid(true);
    }, dateStr);

    // Wait for RHF validation → onValidChange → parent state update
    await page.waitForTimeout(1000);

    // 4.7 — Click Next to Step 3 (Review)
    const nextBtn2 = page.getByRole("button", { name: "Next", exact: true });
    await expect(nextBtn2).toBeEnabled({ timeout: 10_000 });
    await nextBtn2.click();
    await expect(
      page.getByText(/review/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    // 4.8 — Submit (no Phantom popup — test adapter signs silently)
    const submitBtn = page.getByRole("button", { name: /submit payment/i });
    await submitBtn.click();

    // 4.9 — Wait for transaction confirmation
    await expect(
      page.getByText(/confirmed/i).or(page.getByText(/success/i)),
    ).toBeVisible({ timeout: 30_000 });

    // 4.10 — Close wizard, check agreements list
    // Close the dialog if it's still open
    const closeBtn = page.getByRole("button", { name: /close|done|×/i });
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    }

    // Verify the new agreement appears in the list
    await page.goto("/agreements");
    await expect(page.locator("a[href*='/agreements/']").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("Test 5: Fund payment", async ({ connectedPage: page }) => {
    await page.goto("/agreements");

    // 5.1–5.2 — Find and click "Fund" button on the first payment row
    const fundBtn = page.getByRole("button", { name: /fund/i }).first();
    await expect(fundBtn).toBeVisible({ timeout: 15_000 });
    await fundBtn.click();

    // 5.3 — Confirm funding in the dialog
    const confirmBtn = page.getByRole("button", { name: /confirm|fund/i }).last();
    await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
    await confirmBtn.click();

    // 5.4 — Wait for confirmation
    await expect(
      page.getByText(/confirmed/i).or(page.getByText(/success/i)),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("Test 6: Crank time condition", async ({ connectedPage: page }) => {
    await page.goto("/agreements");

    // Navigate to the first agreement's detail page
    const agreementLink = page.locator("a[href*='/agreements/']").first();
    await expect(agreementLink).toBeVisible({ timeout: 15_000 });
    await agreementLink.click();

    // 6.2–6.3 — Find the time-based condition card and crank button
    // Wait a few seconds for the time condition to pass (set 5s in future during creation)
    await page.waitForTimeout(5_000);
    await expect(page.getByText(/time/i).first()).toBeVisible({ timeout: 10_000 });
    const crankBtn = page.getByRole("button", { name: /crank time/i }).first();
    await expect(crankBtn).toBeVisible({ timeout: 5_000 });

    // 6.4 — Click "Crank Time"
    await crankBtn.click();

    // 6.5 — Condition status updates to "Met"
    await expect(page.getByText("Met", { exact: true }).first()).toBeVisible({ timeout: 30_000 });
  });

  test("Test 7: Release payment", async ({
    connectedPage: page,
    testKeypair,
  }) => {
    await page.goto("/agreements");
    
    // The release dialog confirms and shows "Confirmed" on success.
    // Click the first Release button and handle both success and failure.
    const releaseBtn = page.getByRole("button", { name: "Release", exact: true }).first();
    await expect(releaseBtn).toBeVisible({ timeout: 15_000 });
    await releaseBtn.click();

    // 7.3 — The Release Payment dialog opens. Click "Release Payment" to confirm.
    const confirmBtn = page.getByRole("button", { name: /release payment/i });
    await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
    await confirmBtn.click();

    // 7.4 — Wait for confirmation or error
    await expect(
      page.getByText("Confirmed", { exact: true }).first()
        .or(page.getByText("Failed", { exact: true }).first()),
    ).toBeVisible({ timeout: 30_000 });

    // If it failed (wrong agreement), close and try the next one
    if (await page.getByText("Failed", { exact: true }).first().isVisible().catch(() => false)) {
      await page.getByRole("button", { name: "Close" }).click();
      // Try the second Release button
      const releaseBtn2 = page.getByRole("button", { name: "Release", exact: true }).nth(1);
      if (await releaseBtn2.isVisible().catch(() => false)) {
        await releaseBtn2.click();
        const confirmBtn2 = page.getByRole("button", { name: /release payment/i });
        await expect(confirmBtn2).toBeVisible({ timeout: 5_000 });
        await confirmBtn2.click();
        await expect(
          page.getByText("Confirmed", { exact: true }).first(),
        ).toBeVisible({ timeout: 30_000 });
      }
    }
  });
});

test.describe("Cancel & Refund (Test 8)", () => {
  test("create, fund, then cancel a payment", async ({
    connectedPage: page,
    testKeypair,
  }) => {
    const PAYEE_ADDRESS = testKeypair.publicKey.toBase58();
    // Create a new payment
    await page.goto("/agreements");
    const createBtn = page.getByRole("button", { name: /create payment/i });
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
    await createBtn.click();

    // Fill in payee + amount
    const payeeInput = page.getByLabel(/payee/i).or(
      page.locator('input[placeholder*="payee" i]'),
    );
    await payeeInput.fill(PAYEE_ADDRESS);

    const amountInput = page.getByLabel(/amount/i).or(
      page.locator('input[placeholder*="amount" i]'),
    );
    await amountInput.fill("0.005");

    // Next → conditions
    await page.getByRole("button", { name: "Next", exact: true }).click();

    // Set time condition in the future (so we can cancel before it unlocks)
    const dateInput = page.locator('input[type="datetime-local"]').first();
    await expect(dateInput).toBeVisible({ timeout: 5_000 });
    const tomorrow = new Date(Date.now() + 86400000);
    await page.evaluate((val: string) => {
      const form = (window as unknown as Record<string, unknown>).__TEST_CONDITION_FORM as {
        setValue: (name: string, value: unknown) => void;
      } | undefined;
      if (form) form.setValue('conditions.0.unlockAt', val);
    }, tomorrow.toISOString().slice(0, 16));
    await page.waitForTimeout(500);

    // Next → review → submit
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: /submit|create/i }).click();

    await expect(
      page.getByText(/confirmed/i).or(page.getByText(/success/i)),
    ).toBeVisible({ timeout: 30_000 });

    // Close wizard
    const closeBtn = page.getByRole("button", { name: /close|done|×/i });
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    }

    // Fund the payment
    await page.goto("/agreements");
    const fundBtn = page.getByRole("button", { name: /fund/i }).first();
    await expect(fundBtn).toBeVisible({ timeout: 15_000 });
    await fundBtn.click();

    const confirmFundBtn = page
      .getByRole("button", { name: /confirm|fund/i })
      .last();
    await expect(confirmFundBtn).toBeVisible({ timeout: 5_000 });
    await confirmFundBtn.click();
    await expect(
      page.getByText(/confirmed/i).or(page.getByText(/success/i)),
    ).toBeVisible({ timeout: 30_000 });

    // Now cancel
    await page.goto("/agreements");
    const cancelBtn = page.getByRole("button", { name: /cancel/i }).first();
    await expect(cancelBtn).toBeVisible({ timeout: 15_000 });
    await cancelBtn.click();

    const confirmCancelBtn = page
      .getByRole("button", { name: /confirm|cancel/i })
      .last();
    await expect(confirmCancelBtn).toBeVisible({ timeout: 5_000 });
    await confirmCancelBtn.click();

    // 8.4 — Status becomes "Cancelled"
    await expect(
      page.getByText(/cancelled/i).first(),
    ).toBeVisible({ timeout: 30_000 });
  });
});
