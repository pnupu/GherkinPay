import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env from the app/web directory so NEXT_PUBLIC_TEST_WALLET is available
// in the Playwright test runner process (not just the Next.js dev server).
config({ path: resolve(import.meta.dirname, ".env") });

/**
 * Playwright E2E config for GherkinPay.
 *
 * Prerequisites:
 *   1. solana-test-validator running on :8899
 *   2. Programs deployed (anchor deploy --provider.cluster localnet)
 *   3. NEXT_PUBLIC_TEST_WALLET set in .env (base64 secret key)
 *   4. Dev server started (bun run dev)
 *
 * Or use the webServer config below to auto-start the dev server.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // sequential — tests share on-chain state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // single worker — on-chain state is shared
  reporter: "html",
  timeout: 60_000, // wallet txs can be slow on localnet

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Auto-start the dev server if not already running */
  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
