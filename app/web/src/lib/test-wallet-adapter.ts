/* eslint-disable @typescript-eslint/no-this-alias, @typescript-eslint/consistent-type-imports */
/**
 * Test wallet adapter for automated E2E testing.
 *
 * Implements the full SignerWalletAdapter interface using an in-memory Keypair,
 * so Playwright can drive the dApp without any browser extension.
 *
 * Features:
 * - Auto-connects on mount (no popup)
 * - Signs all transactions silently (no approval flow)
 * - Exposes `window.__TEST_WALLET` for Playwright to switch keypairs mid-test
 *   (needed for multisig / compliance tests with multiple signers)
 *
 * NEVER use in production — guarded by NEXT_PUBLIC_TEST_WALLET env var.
 */

import {
  BaseSignerWalletAdapter,
  WalletReadyState,
  type WalletName,
} from "@solana/wallet-adapter-base";
import {
  Keypair,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import nacl from "tweetnacl";

// Minimal base64 decode that works in browsers without Buffer
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Shape exposed on `window.__TEST_WALLET` for Playwright control.
 */
export interface TestWalletControl {
  /** Switch to a different keypair (base64-encoded secret key) */
  switchKeypair: (secretKeyBase64: string) => void;
  /** Disconnect the wallet */
  disconnect: () => void;
  /** Reconnect (using current keypair) */
  connect: () => void;
  /** Get current public key as base58 */
  publicKey: () => string | null;
}

declare global {
  interface Window {
    __TEST_WALLET?: TestWalletControl;
  }
}

export class TestWalletAdapter extends BaseSignerWalletAdapter<"Test Wallet"> {
  name = "Test Wallet" as WalletName<"Test Wallet">;
  url = "https://github.com/GherkinPay";
  // 1x1 transparent PNG as data URI — satisfies the icon requirement
  icon =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" as const;
  readyState = WalletReadyState.Installed;
  supportedTransactionVersions = new Set([0, "legacy"] as const);

  private _keypair: Keypair;
  private _connecting = false;
  private _connected = false;

  constructor(keypair: Keypair) {
    super();
    this._keypair = keypair;
  }

  get publicKey() {
    return this._connected ? this._keypair.publicKey : null;
  }

  get connecting() {
    return this._connecting;
  }

  get connected() {
    return this._connected;
  }

  async connect(): Promise<void> {
    if (this._connected) return;
    this._connecting = true;

    try {
      this._connected = true;
      this._exposeControl();
      this.emit("connect", this._keypair.publicKey);
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    this._connected = false;
    this.emit("disconnect");
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
  ): Promise<T> {
    if (!this._connected) throw new Error("Wallet not connected");

    if (transaction instanceof VersionedTransaction) {
      transaction.sign([this._keypair]);
    } else {
      transaction.partialSign(this._keypair);
    }
    return transaction;
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (!this._connected) throw new Error("Wallet not connected");
    return nacl.sign.detached(message, this._keypair.secretKey);
  }

  /**
   * Switch the underlying keypair and re-emit connect with the new public key.
   * Called from Playwright via `window.__TEST_WALLET.switchKeypair(...)`.
   */
  switchKeypair(keypair: Keypair): void {
    this._keypair = keypair;
    if (this._connected) {
      // Emit disconnect then connect to force React state update
      this.emit("disconnect");
      this._connected = true;
      this.emit("connect", this._keypair.publicKey);
    }
    this._exposeControl();
  }

  private _exposeControl(): void {
    if (typeof window === "undefined") return;

    const adapter = this;
    window.__TEST_WALLET = {
      switchKeypair(secretKeyBase64: string) {
        const secretKey = base64ToUint8Array(secretKeyBase64);
        const keypair = Keypair.fromSecretKey(secretKey);
        adapter.switchKeypair(keypair);
      },
      disconnect() {
        void adapter.disconnect();
      },
      connect() {
        void adapter.connect();
      },
      publicKey() {
        return adapter.publicKey?.toBase58() ?? null;
      },
    };
  }
}

/**
 * Create a TestWalletAdapter from a base64-encoded secret key.
 * The env var NEXT_PUBLIC_TEST_WALLET should contain the base64-encoded
 * 64-byte secret key of a funded keypair.
 *
 * Generate one with:
 *   node -e "const k = require('@solana/web3.js').Keypair.generate(); console.log(Buffer.from(k.secretKey).toString('base64'))"
 */
export function createTestWalletAdapter(
  secretKeyBase64: string,
): TestWalletAdapter {
  const secretKey = base64ToUint8Array(secretKeyBase64);
  const keypair = Keypair.fromSecretKey(secretKey);
  return new TestWalletAdapter(keypair);
}
