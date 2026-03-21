#!/usr/bin/env node

/**
 * Generate a mock Pyth PriceUpdateV2 account JSON file for use with
 * `solana-test-validator --account <PUBKEY> <FILE>`.
 *
 * The account data matches the byte layout that crank_oracle.rs reads:
 *   bytes 41..73:  feed_id (= account pubkey bytes)
 *   bytes 73..81:  price (i64 LE)
 *   bytes 81..89:  conf (u64 LE)
 *   bytes 89..93:  exponent (i32 LE)
 *   bytes 93..101: publish_time (i64 LE)
 *
 * Usage:
 *   node scripts/create-mock-pyth-feed.mjs
 *
 * Outputs a JSON file at fixtures/mock-pyth-feed.json and the account pubkey.
 * The publish_time is set far in the future so the feed stays "fresh" during tests.
 */

import { Keypair, PublicKey } from "@solana/web3.js";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, "..", "fixtures");
mkdirSync(FIXTURES_DIR, { recursive: true });

// Use a deterministic keypair so the pubkey is stable across test runs.
// This is the "mock SOL/USD Pyth feed" for GherkinPay E2E tests.
// Seed: "gherkinpay-mock-pyth-sol-usd"
import { createHash } from "crypto";
const seed = createHash("sha256")
  .update("gherkinpay-mock-pyth-sol-usd")
  .digest();
const feedKeypair = Keypair.fromSeed(seed);
const feedPubkey = feedKeypair.publicKey;

// Price: $150.00 with exponent -8 → price = 15000000000
const price = BigInt(15000000000);
const exponent = -8;
const conf = price / 100n; // tight confidence

// Publish time: far in the future so it never goes stale during tests
// Set to 2030-01-01T00:00:00Z
const publishTime = BigInt(Math.floor(new Date("2030-01-01").getTime() / 1000));

// Build account data (128 bytes)
const DATA_SIZE = 128;
const data = Buffer.alloc(DATA_SIZE, 0);

// Discriminator (8 bytes) — Pyth PriceUpdateV2 discriminator
// (the program doesn't check it, so we use a placeholder)
data.writeUInt32LE(0xdeadbeef, 0);

// Write authority (32 bytes @ 8..40) — zeroed

// Verification level (1 byte @ 40) — 0 = Full
data.writeUInt8(0, 40);

// Feed ID (32 bytes @ 41..73) — set to the feed account's public key bytes
const feedIdBytes = feedPubkey.toBytes();
feedIdBytes.forEach((b, i) => data.writeUInt8(b, 41 + i));

// Price (i64 LE @ 73..81)
data.writeBigInt64LE(price, 73);

// Confidence (u64 LE @ 81..89)
data.writeBigUInt64LE(conf, 81);

// Exponent (i32 LE @ 89..93)
data.writeInt32LE(exponent, 89);

// Publish time (i64 LE @ 93..101)
data.writeBigInt64LE(publishTime, 93);

// Write the Solana account JSON dump format (same as `solana account --output json`)
const accountJson = {
  pubkey: feedPubkey.toBase58(),
  account: {
    lamports: 1_000_000_000, // 1 SOL — plenty for rent-exempt
    data: [data.toString("base64"), "base64"],
    owner: "11111111111111111111111111111111", // system program
    executable: false,
    rentEpoch: 0,
    space: DATA_SIZE,
  },
};

const outPath = join(FIXTURES_DIR, "mock-pyth-feed.json");
writeFileSync(outPath, JSON.stringify(accountJson, null, 2));

console.log("=== Mock Pyth Feed Account ===\n");
console.log(`Pubkey:         ${feedPubkey.toBase58()}`);
console.log(`Price:          $${Number(price) * Math.pow(10, exponent)}`);
console.log(`Publish time:   2030-01-01 (far future, never stale)`);
console.log(`Output:         ${outPath}`);
console.log(
  `\nTo use with test validator, add to startup:\n  solana-test-validator --account ${feedPubkey.toBase58()} fixtures/mock-pyth-feed.json`
);
console.log(
  `\nIn the oracle condition, use:\n  feed_account = "${feedPubkey.toBase58()}"\n  operator = "gt"\n  target_value = 10000000000  (i.e. $100 with 8 decimals)\n  decimals = 8`
);
