/**
 * Anchor error decoder for GherkinPay program.
 *
 * Anchor custom errors start at code 6000.
 * The GherkinPayError enum variants map to 6000, 6001, … in declaration order.
 */

const GHERKIN_PAY_ERRORS: Record<number, string> = {
  6000: "Payment is not in the expected status",
  6001: "Conditions are already finalized",
  6002: "Conditions are not yet finalized",
  6003: "Maximum number of conditions reached",
  6004: "Maximum number of signers reached",
  6005: "Signer is not in the multisig signer list",
  6006: "Signer has already approved",
  6007: "Condition at the given index is not the expected type",
  6008: "Condition index out of bounds",
  6009: "Conditions are not met for release",
  6010: "Milestone is not in active status",
  6011: "All milestones already released",
  6012: "Milestone index mismatch",
  6013: "Milestone amounts do not sum to total amount",
  6014: "Not all condition accounts are finalized",
  6015: "Payment is not a milestone payment",
  6016: "Payment is a milestone payment — use milestone-specific instructions",
  6017: "Oracle price is stale — feed data older than 60 seconds",
  6018: "Oracle price confidence too wide — unreliable price",
  6019: "Relayer does not match condition",
  6020: "Event hash does not match condition",
  6021: "Token balance insufficient for gate",
  6022: "Arithmetic overflow",
  6023: "Cannot cancel a completed payment",
  6024: "Nothing to refund",
  6025: "Milestone count cannot be zero",
  6026: "Exceeded maximum milestone count",
};

/**
 * Extract a numeric error code from various Anchor/Solana error shapes.
 */
function extractErrorCode(error: unknown): number | null {
  if (error == null || typeof error !== "object") return null;

  const err = error as Record<string, unknown>;

  // AnchorError: { error: { errorCode: { number: N } } }
  if (err.error && typeof err.error === "object") {
    const inner = err.error as Record<string, unknown>;
    if (inner.errorCode && typeof inner.errorCode === "object") {
      const code = (inner.errorCode as Record<string, unknown>).number;
      if (typeof code === "number") return code;
    }
  }

  // ProgramError / flat shape: { code: N }
  if (typeof err.code === "number") return err.code;

  // SendTransactionError: error message contains "custom program error: 0x{hex}"
  const msg = typeof err.message === "string" ? err.message : "";
  const hexMatch = /custom program error:\s*0x([0-9a-fA-F]+)/.exec(msg);
  if (hexMatch) return parseInt(hexMatch[1]!, 16);

  // Anchor error log: "Error Code: {Name}. Error Number: {N}."
  const numMatch = /Error Number:\s*(\d+)/.exec(msg);
  if (numMatch) return parseInt(numMatch[1]!, 10);

  return null;
}

/**
 * Decode an Anchor/Solana error into a user-friendly message.
 * Falls back to the raw error message if the code is not recognized.
 */
export function decodeAnchorError(error: unknown): string {
  const code = extractErrorCode(error);
  if (code !== null && GHERKIN_PAY_ERRORS[code]) {
    return GHERKIN_PAY_ERRORS[code];
  }

  // Fallback: extract message from error
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Transaction failed — unknown error";
}
