"use client";

import { useState, useEffect, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import {
  type RelayerEntry,
  getRelayers,
  addRelayer,
  removeRelayer,
} from "~/lib/relayer-registry";

/** Validate a string as a valid Solana base58 public key. */
function isValidPubkey(value: string): boolean {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

export default function RelayersPage() {
  const [relayers, setRelayers] = useState<RelayerEntry[]>([]);
  const [pubkey, setPubkey] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setRelayers(getRelayers());
  }, []);

  const handleRegister = useCallback(() => {
    setError(null);

    const trimmedPubkey = pubkey.trim();
    const trimmedLabel = label.trim();

    if (!trimmedPubkey) {
      setError("Enter a relayer public key");
      return;
    }
    if (!isValidPubkey(trimmedPubkey)) {
      setError("Invalid Solana public key");
      return;
    }
    if (!trimmedLabel) {
      setError("Enter a label for the relayer");
      return;
    }

    // Check for duplicate before calling addRelayer so we can show an error
    const current = getRelayers();
    if (current.some((r) => r.pubkey === trimmedPubkey)) {
      setError("A relayer with this public key is already registered");
      return;
    }

    const updated = addRelayer({ pubkey: trimmedPubkey, label: trimmedLabel });
    setRelayers(updated);
    setPubkey("");
    setLabel("");
  }, [pubkey, label]);

  const handleRemove = useCallback((pk: string) => {
    const updated = removeRelayer(pk);
    setRelayers(updated);
  }, []);

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Relayers</h1>
          <p className="page-subtitle">
            Register and manage relayer operators for webhook attestation and
            oracle triggers
          </p>
        </div>
      </header>

      {/* Registration form */}
      <section className="panel">
        <h2 className="panel-title">Register relayer</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label
              htmlFor="relayer-pubkey"
              className="mb-1 block text-sm font-medium"
            >
              Public key
            </label>
            <input
              id="relayer-pubkey"
              type="text"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter Solana public key"
              value={pubkey}
              onChange={(e) => {
                setPubkey(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRegister();
              }}
            />
          </div>
          <div>
            <label
              htmlFor="relayer-label"
              className="mb-1 block text-sm font-medium"
            >
              Label
            </label>
            <input
              id="relayer-label"
              type="text"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. Mainnet relay A"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRegister();
              }}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <div>
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              onClick={handleRegister}
            >
              Register
            </button>
          </div>
        </div>
      </section>

      {/* Registered relayers table */}
      <section className="panel mt-4">
        <h2 className="panel-title">Registered relayers</h2>
        {relayers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No relayers registered yet. Use the form above to add one.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Public key</th>
                  <th>Label</th>
                  <th>Registered</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {relayers.map((r) => (
                  <tr key={r.pubkey}>
                    <td className="font-mono text-xs">{r.pubkey}</td>
                    <td>{r.label}</td>
                    <td className="text-sm text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
                        onClick={() => handleRemove(r.pubkey)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
