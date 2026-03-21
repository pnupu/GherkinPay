/**
 * Shared Playwright fixtures for GherkinPay E2E tests.
 *
 * Provides:
 *   - `connectedPage`: a Page with the test wallet auto-connected
 *   - `switchWallet(secretKeyBase64)`: switch to a different keypair mid-test
 *   - `testKeypair`: the primary test keypair for direct RPC assertions
 */

import { test as base, expect, type Page } from "@playwright/test";
import { Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

// Re-export expect for convenience
export { expect };

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "http://127.0.0.1:8899";

export type TestFixtures = {
  connectedPage: Page;
  switchWallet: (secretKeyBase64: string) => Promise<string>;
  testKeypair: Keypair;
  connection: Connection;
  /** Generate a new funded keypair for multi-signer tests */
  generateFundedKeypair: () => Promise<{
    keypair: Keypair;
    secretKeyBase64: string;
  }>;
};

export const test = base.extend<TestFixtures>({
  connection: async ({}, use) => {
    const connection = new Connection(RPC_URL, "confirmed");
    await use(connection);
  },

  testKeypair: async ({}, use) => {
    const secretKeyBase64 = process.env.NEXT_PUBLIC_TEST_WALLET;
    if (!secretKeyBase64) {
      throw new Error(
        "NEXT_PUBLIC_TEST_WALLET not set. Run: node scripts/generate-test-keypair.mjs",
      );
    }
    const secretKey = Buffer.from(secretKeyBase64, "base64");
    const keypair = Keypair.fromSecretKey(secretKey);
    await use(keypair);
  },

  connectedPage: async ({ page, testKeypair }, use) => {
    // Pre-set the wallet adapter's localStorage key so autoConnect picks up
    // the test wallet without needing to click through the wallet selection modal.
    await page.goto("/agreements", { waitUntil: "commit" });
    await page.evaluate(() => {
      localStorage.setItem("walletName", '"Test Wallet"');
    });

    // Reload so the WalletProvider reads the stored wallet name and auto-connects
    await page.reload({ waitUntil: "domcontentloaded" });

    // Wait for wallet to connect — the wallet button should show the truncated address
    const pubkeyPrefix = testKeypair.publicKey.toBase58().slice(0, 4);
    await page.waitForFunction(
      (prefix) => {
        return document.body.innerText.includes(prefix);
      },
      pubkeyPrefix,
      { timeout: 15_000 },
    );

    await use(page);
  },

  switchWallet: async ({ page }, use) => {
    const switcher = async (secretKeyBase64: string): Promise<string> => {
      const newPubkey = await page.evaluate((b64) => {
        if (!window.__TEST_WALLET) {
          throw new Error("Test wallet control not available on window");
        }
        window.__TEST_WALLET.switchKeypair(b64);
        return window.__TEST_WALLET.publicKey();
      }, secretKeyBase64);

      if (!newPubkey) throw new Error("switchWallet returned null publicKey");

      // Reload page to pick up new wallet state in React context
      await page.reload({ waitUntil: "domcontentloaded" });

      // Wait for UI to reflect the change
      await page.waitForFunction(
        (prefix) => document.body.innerText.includes(prefix),
        newPubkey.slice(0, 4),
        { timeout: 15_000 },
      );

      return newPubkey;
    };

    await use(switcher);
  },

  generateFundedKeypair: async ({ connection }, use) => {
    const generator = async () => {
      const keypair = Keypair.generate();
      const secretKeyBase64 = Buffer.from(keypair.secretKey).toString(
        "base64",
      );

      // Airdrop SOL for transaction fees
      const sig = await connection.requestAirdrop(
        keypair.publicKey,
        2 * LAMPORTS_PER_SOL,
      );
      await connection.confirmTransaction(sig, "confirmed");

      return { keypair, secretKeyBase64 };
    };

    await use(generator);
  },
});
