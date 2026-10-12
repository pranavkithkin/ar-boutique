/**
 * AR Boutique - Money and Currency Formatting Helpers
 *
 * All money is stored and calculated in integer fils (1 AED = 100 fils).
 * Formatted only in the UI using formatAED().
 * UAE standard VAT is 5% included in prices: VAT split is fils * 5 / 105.
 * (ADR-014, docs/RULES.md)
 */

/**
 * Converts AED decimal amount to integer fils.
 * e.g., 1250 -> 125000, 249.50 -> 24950
 */
export function toFils(aed: number): number {
  return Math.round(aed * 100)
}

/**
 * Converts integer fils to decimal AED.
 * e.g., 125000 -> 1250, 24950 -> 249.5
 */
export function toAED(fils: number): number {
  return fils / 100
}

/**
 * Formats integer fils into AED presentation string.
 * Uses 2 decimals only when needed (e.g. AED 1,250 or AED 249.50) per docs/DESIGN.md.
 */
export function formatAED(fils: number): string {
  const aed = fils / 100
  const hasDecimals = fils % 100 !== 0

  const formattedNumber = new Intl.NumberFormat("en-AE", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(aed)

  return `AED ${formattedNumber}`
}

/**
 * Calculates UAE 5% VAT portion included in the price.
 * VAT amount = (fils * 5) / 105.
 */
export function calculateVatPortion(totalFils: number): number {
  return Math.round((totalFils * 5) / 105)
}
