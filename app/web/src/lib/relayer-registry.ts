/**
 * localStorage-based relayer registry.
 *
 * Stores relayer entries (pubkey + label) in the browser's localStorage
 * under the key "gherkinpay:relayers". SSR-safe — all reads/writes guard
 * against server-side execution where `window` is undefined.
 */

export interface RelayerEntry {
  pubkey: string;
  label: string;
  createdAt: number;
}

const STORAGE_KEY = "gherkinpay:relayers";

/** Read all relayer entries from localStorage. Returns [] if missing or invalid. */
export function getRelayers(): RelayerEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Basic shape validation — cast through Record to satisfy no-unsafe-member-access
    return parsed.filter((e): e is RelayerEntry => {
      if (typeof e !== "object" || e === null) return false;
      const obj = e as Record<string, unknown>;
      return (
        typeof obj.pubkey === "string" &&
        typeof obj.label === "string" &&
        typeof obj.createdAt === "number"
      );
    });
  } catch {
    return [];
  }
}

/**
 * Add a relayer entry. Prevents duplicates by pubkey.
 * Returns the updated list.
 */
export function addRelayer(entry: {
  pubkey: string;
  label: string;
}): RelayerEntry[] {
  const current = getRelayers();
  if (current.some((r) => r.pubkey === entry.pubkey)) {
    return current; // duplicate — no-op
  }
  const updated: RelayerEntry[] = [
    ...current,
    { pubkey: entry.pubkey, label: entry.label, createdAt: Date.now() },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Remove a relayer by pubkey. Returns the updated list.
 */
export function removeRelayer(pubkey: string): RelayerEntry[] {
  const updated = getRelayers().filter((r) => r.pubkey !== pubkey);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
