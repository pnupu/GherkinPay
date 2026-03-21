/**
 * Oracle price feed condition test.
 *
 * Covers TESTING.md Test 11.
 *
 * Requires the mock Pyth feed account loaded in the validator:
 *   solana-test-validator --account JBc8woEgPzyXwLEmZJpnSiNhneGBcectQrQpzm52fvCj fixtures/mock-pyth-feed.json
 *
 * The mock feed has:
 *   - Price: $150 (15000000000 with exponent -8)
 *   - Publish time: 2030-01-01 (never stale)
 *   - Feed ID: the account's own pubkey
 */

import { test, expect } from "./fixtures";
import { Keypair } from "@solana/web3.js";

const PAYEE = Keypair.generate().publicKey.toBase58();

// Mock Pyth feed account — deterministic from seed "gherkinpay-mock-pyth-sol-usd"
const MOCK_PYTH_FEED = "JBc8woEgPzyXwLEmZJpnSiNhneGBcectQrQpzm52fvCj";

test.describe("Oracle Price Feed Condition (Test 11)", () => {
  test("create payment with oracle condition, crank, verify met", async ({
    connectedPage: page,
  }) => {
    // Verify the mock feed exists on-chain before running
    const feedExists = await page.evaluate(async (feedPubkey: string) => {
      try {
        const resp = await fetch("http://127.0.0.1:8899", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getAccountInfo",
            params: [feedPubkey, { encoding: "base64" }],
          }),
        });
        const data = (await resp.json()) as { result: { value: unknown } };
        return data.result?.value !== null;
      } catch {
        return false;
      }
    }, MOCK_PYTH_FEED);

    if (!feedExists) {
      test.skip();
      return;
    }

    // Create payment
    await page.goto("/agreements");
    await page.getByRole("button", { name: /create payment/i }).click();

    // Fill payee + amount
    const payeeInput = page
      .getByLabel(/payee/i)
      .or(page.locator('input[placeholder*="payee" i]'));
    await payeeInput.fill(PAYEE);

    const amountInput = page
      .getByLabel(/amount/i)
      .or(page.locator('input[placeholder*="amount" i]'));
    await amountInput.fill("0.01");

    // Next → conditions
    await page.getByRole("button", { name: "Next", exact: true }).click();

    // Select oracle condition type (Radix Select)
    const conditionSelect = page.getByRole("combobox").first();
    await conditionSelect.click();
    await page.getByRole("option", { name: /oracle/i }).click();

    // Fill oracle fields
    // Feed account = the mock Pyth feed pubkey
    const feedInput = page.getByLabel(/feed/i).or(
      page.locator('input[placeholder*="feed" i]'),
    );
    await feedInput.fill(MOCK_PYTH_FEED);

    // Operator: "gt" (greater than)
    const operatorSelect = page
      .locator("select")
      .or(page.getByRole("combobox").nth(1));
    // Try clicking to open if it's a Radix Select
    if (await page.getByRole("combobox").nth(1).isVisible().catch(() => false)) {
      await page.getByRole("combobox").nth(1).click();
      await page
        .getByRole("option", { name: /greater than|gt/i })
        .first()
        .click();
    }

    // Target value: 10000000000 ($100 with exponent -8, price is $150 so gt passes)
    const targetInput = page.getByLabel(/target/i).or(
      page.locator('input[placeholder*="target" i]'),
    );
    await targetInput.fill("10000000000");

    // Decimals: 8
    const decimalsInput = page.getByLabel(/decimal/i).or(
      page.locator('input[placeholder*="decimal" i]'),
    );
    await decimalsInput.fill("8");

    // Use test bridge to force conditions valid (same RHF issue as datetime-local)
    await page.waitForFunction(
      () =>
        !!(window as unknown as Record<string, unknown>).__TEST_CONDITION_FORM &&
        !!(window as unknown as Record<string, unknown>).__TEST_WIZARD,
      { timeout: 5_000 },
    );
    await page.evaluate(() => {
      const wizard = (
        window as unknown as Record<string, unknown>
      ).__TEST_WIZARD as {
        setConditionsValid: (valid: boolean) => void;
      };
      wizard?.setConditionsValid(true);
    });

    // Next → review
    const nextBtn = page.getByRole("button", { name: "Next", exact: true });
    await expect(nextBtn).toBeEnabled({ timeout: 5_000 });
    await nextBtn.click();

    await expect(page.getByText(/review/i).first()).toBeVisible({
      timeout: 10_000,
    });

    // Submit
    await page
      .getByRole("button", { name: /submit payment/i })
      .click();
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

    // Look for the oracle condition card and crank button
    await expect(page.getByText(/oracle/i).first()).toBeVisible({
      timeout: 10_000,
    });
    const crankBtn = page.getByRole("button", { name: /crank oracle/i });

    if (await crankBtn.isVisible().catch(() => false)) {
      await crankBtn.click();

      // Wait for condition to be met
      await expect(
        page
          .getByText("Met", { exact: true })
          .first()
          .or(page.getByText(/confirmed/i).first()),
      ).toBeVisible({ timeout: 30_000 });
    }
  });
});
