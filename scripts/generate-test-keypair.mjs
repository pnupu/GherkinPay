#!/usr/bin/env node

/**
 * Generate a Solana keypair for E2E testing.
 *
 * Outputs:
 *   - Public key (base58)
 *   - Secret key (base64) — set as NEXT_PUBLIC_TEST_WALLET
 *   - Secret key (JSON array) — for import into Solana CLI / Phantom
 *
 * Usage:
 *   node scripts/generate-test-keypair.mjs
 *   node scripts/generate-test-keypair.mjs --fund   # also airdrops 2 SOL on localnet
 */

import { Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

const keypair = Keypair.generate();
const secretKeyBase64 = Buffer.from(keypair.secretKey).toString("base64");
const secretKeyJson = JSON.stringify(Array.from(keypair.secretKey));

console.log("=== Test Wallet Keypair ===\n");
console.log(`Public key:  ${keypair.publicKey.toBase58()}`);
console.log(`Secret (b64): ${secretKeyBase64}`);
console.log(`Secret (JSON): ${secretKeyJson}\n`);
console.log("Add to app/web/.env:");
console.log(`  NEXT_PUBLIC_TEST_WALLET="${secretKeyBase64}"\n`);

if (process.argv.includes("--fund")) {
  const rpcUrl = process.env.SOLANA_RPC_URL || "http://127.0.0.1:8899";
  console.log(`Requesting airdrop on ${rpcUrl}...`);
  const connection = new Connection(rpcUrl, "confirmed");
  try {
    const sig = await connection.requestAirdrop(
      keypair.publicKey,
      2 * LAMPORTS_PER_SOL,
    );
    await connection.confirmTransaction(sig, "confirmed");
    const balance = await connection.getBalance(keypair.publicKey);
    console.log(
      `Airdrop confirmed. Balance: ${balance / LAMPORTS_PER_SOL} SOL`,
    );
  } catch (err) {
    console.error("Airdrop failed (is solana-test-validator running?):", err.message);
  }
}
