/**
 * Smoke test: wallet connection and basic navigation.
 *
 * Covers TESTING.md Tests 1, 3 (core steps).
 */

import { test, expect } from "./fixtures";

test.describe("Wallet Connection (Test 1)", () => {
  test("1.1–1.3: connects wallet and shows address", async ({
    connectedPage: page,
    testKeypair,
  }) => {
    const pubkey = testKeypair.publicKey.toBase58();

    // Wallet address should be visible (truncated) in the UI
    const bodyText = await page.textContent("body");
    expect(bodyText).toContain(pubkey.slice(0, 4));
  });

  test("1.4: wallet survives page refresh", async ({
    connectedPage: page,
    testKeypair,
  }) => {
    await page.reload();
    const pubkeyPrefix = testKeypair.publicKey.toBase58().slice(0, 4);

    await page.waitForFunction(
      (prefix) => document.body.innerText.includes(prefix),
      pubkeyPrefix,
      { timeout: 15_000 },
    );

    const bodyText = await page.textContent("body");
    expect(bodyText).toContain(pubkeyPrefix);
  });
});

test.describe("Navigation (Test 3)", () => {
  test("3.1: Agreements page loads", async ({ connectedPage: page }) => {
    await page.goto("/agreements");
    await expect(page).toHaveURL(/\/agreements/);
    // No unhandled errors
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });

  test("3.2: Milestones page loads", async ({ connectedPage: page }) => {
    await page.goto("/milestones");
    await expect(page).toHaveURL(/\/milestones/);
  });

  test("3.3: Compliance page loads", async ({ connectedPage: page }) => {
    await page.goto("/compliance");
    await expect(page).toHaveURL(/\/compliance/);
  });

  test("3.4: Relayers page loads", async ({ connectedPage: page }) => {
    await page.goto("/relayers");
    await expect(page).toHaveURL(/\/relayers/);
  });

  test("3.5: Activity page loads", async ({ connectedPage: page }) => {
    await page.goto("/activity");
    await expect(page).toHaveURL(/\/activity/);
  });
});
