import type { Coupon, DiscountType } from "./types"

export interface CalculateDiscountOptions {
  subtotalFils: number
  deliveryFeeFils?: number
  coupon: Pick<
    Coupon,
    | "code"
    | "discount_type"
    | "discount_value"
    | "min_order_fils"
    | "max_discount_fils"
    | "usage_limit"
    | "usage_count"
    | "per_customer_limit"
    | "starts_at"
    | "expires_at"
    | "is_active"
  >
  customerRedemptionsCount?: number
  now?: Date
}

export interface CalculationResult {
  valid: boolean
  error?: string
  discountFils: number
  freeShipping: boolean
  discountType: DiscountType
  discountValue: number
}

/**
 * Pure calculation logic for coupon evaluation.
 * Returns exact discount in fils, or a user-friendly error reason if invalid.
 */
export function calculateCouponDiscount({
  subtotalFils,
  deliveryFeeFils = 0,
  coupon,
  customerRedemptionsCount = 0,
  now = new Date(),
}: CalculateDiscountOptions): CalculationResult {
  // 1. Active status check
  if (!coupon.is_active) {
    return {
      valid: false,
      error: "This promo code is no longer active.",
      discountFils: 0,
      freeShipping: false,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
    }
  }

  // 2. Starts at check
  if (coupon.starts_at) {
    const startDate = new Date(coupon.starts_at)
    if (now < startDate) {
      return {
        valid: false,
        error: "This promo code is not active yet.",
        discountFils: 0,
        freeShipping: false,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
      }
    }
  }

  // 3. Expiry date check
  if (coupon.expires_at) {
    const expiryDate = new Date(coupon.expires_at)
    if (now > expiryDate) {
      return {
        valid: false,
        error: "This promo code has expired.",
        discountFils: 0,
        freeShipping: false,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
      }
    }
  }

  // 4. Global usage limit
  if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
    return {
      valid: false,
      error: "This promo code has reached its maximum redemptions limit.",
      discountFils: 0,
      freeShipping: false,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
    }
  }

  // 5. Per-customer limit
  if (customerRedemptionsCount >= coupon.per_customer_limit) {
    return {
      valid: false,
      error: "You have already used this promo code.",
      discountFils: 0,
      freeShipping: false,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
    }
  }

  // 6. Minimum order value threshold
  if (coupon.min_order_fils > 0 && subtotalFils < coupon.min_order_fils) {
    const minAed = Math.round(coupon.min_order_fils / 100)
    return {
      valid: false,
      error: `A minimum order value of AED ${minAed} is required for this code.`,
      discountFils: 0,
      freeShipping: false,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
    }
  }

  // 7. Calculate discount by type
  let discountFils = 0
  let freeShipping = false

  switch (coupon.discount_type) {
    case "percentage": {
      const calculated = Math.round((subtotalFils * coupon.discount_value) / 100)
      if (coupon.max_discount_fils && coupon.max_discount_fils > 0) {
        discountFils = Math.min(calculated, coupon.max_discount_fils)
      } else {
        discountFils = calculated
      }
      break
    }
    case "fixed_fils": {
      discountFils = Math.min(coupon.discount_value, subtotalFils)
      break
    }
    case "free_shipping": {
      freeShipping = true
      discountFils = deliveryFeeFils
      break
    }
  }

  return {
    valid: true,
    discountFils,
    freeShipping,
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value,
  }
}
