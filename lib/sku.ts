/**
 * SKU validation per ADR-025 and catalogue rules.
 * Checks only: not blank, at most 64 characters, no leading/trailing spaces, no line breaks.
 * Never generates, suggests, or modifies the client's SKU.
 */
export function validateSku(sku: string): { valid: boolean; error?: string } {
  if (!sku || sku.length === 0) {
    return { valid: false, error: "SKU cannot be blank." }
  }
  if (sku.length > 64) {
    return { valid: false, error: "SKU must be at most 64 characters." }
  }
  if (sku.startsWith(" ") || sku.endsWith(" ")) {
    return { valid: false, error: "SKU must not have leading or trailing whitespace." }
  }
  if (/[\r\n]/.test(sku)) {
    return { valid: false, error: "SKU must not contain line breaks." }
  }
  return { valid: true }
}
