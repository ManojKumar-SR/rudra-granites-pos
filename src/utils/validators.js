// ─── GSTIN VALIDATOR ─────────────────────────────────────────────────────────
export function validateGSTIN(gstin) {
  if (!gstin) return { valid: false, msg: "GSTIN is required" };
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!regex.test(gstin)) return { valid: false, msg: "Invalid GSTIN format" };
  return { valid: true, msg: "Valid GSTIN", stateCode: gstin.substring(0, 2) };
}