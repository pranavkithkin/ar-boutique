/**
 * Product Publish Validation Checks (TASK-037)
 *
 * Rules:
 * 1. At least one visible colourway with at least one photo.
 * 2. At least one active SKU.
 * 3. A valid AED price on every active SKU (price_fils > 0).
 */

export interface ColourwayPublishSnapshot {
  id: string
  is_active: boolean
  hasPhoto: boolean
  variants: {
    id: string
    sku: string
    is_active: boolean
    price_fils: number | null
  }[]
}

export interface PublishValidationResult {
  canPublish: boolean
  errors: string[]
  checks: {
    hasVisibleColourwayWithPhoto: boolean
    hasActiveSku: boolean
    allActiveSkusHavePrice: boolean
  }
  details: {
    visibleColourwaysCount: number
    photosCount: number
    activeSkusCount: number
    skusMissingPrice: string[]
  }
}

/**
 * Pure evaluation function that can run in both client and server environments.
 */
export function evaluatePublishRules(
  colourways: ColourwayPublishSnapshot[]
): PublishValidationResult {
  const errors: string[] = []

  // Rule 1: At least one visible colourway with at least one photo
  const visibleColourwaysWithPhoto = colourways.filter(
    (c) => c.is_active && c.hasPhoto
  )
  const hasVisibleColourwayWithPhoto = visibleColourwaysWithPhoto.length > 0
  if (!hasVisibleColourwayWithPhoto) {
    errors.push(
      "A product must have at least one visible colourway with at least one uploaded photo."
    )
  }

  // Rule 2: At least one active SKU
  const allVariants = colourways.flatMap((c) => c.variants)
  const activeSkus = allVariants.filter((v) => v.is_active)
  const hasActiveSku = activeSkus.length > 0
  if (!hasActiveSku) {
    errors.push("A product must have at least one active SKU (variant).")
  }

  // Rule 3: A valid AED price on every active SKU
  const skusMissingPrice = activeSkus
    .filter((v) => typeof v.price_fils !== "number" || v.price_fils <= 0)
    .map((v) => v.sku)
  const allActiveSkusHavePrice = skusMissingPrice.length === 0
  if (!allActiveSkusHavePrice) {
    errors.push(
      `Every active SKU must have a valid selling price in AED (missing on: ${skusMissingPrice.join(", ")}).`
    )
  }

  return {
    canPublish: errors.length === 0,
    errors,
    checks: {
      hasVisibleColourwayWithPhoto,
      hasActiveSku,
      allActiveSkusHavePrice,
    },
    details: {
      visibleColourwaysCount: colourways.filter((c) => c.is_active).length,
      photosCount: colourways.reduce((sum, c) => sum + (c.hasPhoto ? 1 : 0), 0),
      activeSkusCount: activeSkus.length,
      skusMissingPrice,
    },
  }
}
