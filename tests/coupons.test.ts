import { describe, it, expect } from "vitest"
import { calculateCouponDiscount } from "@/features/coupons/service"
import { couponFormSchema } from "@/features/coupons/schemas"

describe("Coupons & Promo Codes Service", () => {
  const baseActiveCoupon = {
    code: "WELCOME10",
    discount_type: "percentage" as const,
    discount_value: 10,
    min_order_fils: 0,
    max_discount_fils: null,
    usage_limit: null,
    usage_count: 0,
    per_customer_limit: 1,
    starts_at: null,
    expires_at: null,
    is_active: true,
  }

  it("calculates percentage discount accurately in fils", () => {
    const res = calculateCouponDiscount({
      subtotalFils: 100000, // AED 1,000.00
      coupon: baseActiveCoupon,
    })

    expect(res.valid).toBe(true)
    expect(res.discountFils).toBe(10000) // AED 100.00 (10%)
    expect(res.freeShipping).toBe(false)
  })

  it("respects max_discount_fils cap on percentage discounts", () => {
    const cappedCoupon = {
      ...baseActiveCoupon,
      discount_value: 20, // 20%
      max_discount_fils: 15000, // Capped at AED 150.00
    }

    const res = calculateCouponDiscount({
      subtotalFils: 200000, // AED 2,000.00 -> 20% would be 400.00
      coupon: cappedCoupon,
    })

    expect(res.valid).toBe(true)
    expect(res.discountFils).toBe(15000) // Capped at AED 150.00
  })

  it("calculates fixed fils discount accurately", () => {
    const fixedCoupon = {
      ...baseActiveCoupon,
      discount_type: "fixed_fils" as const,
      discount_value: 5000, // AED 50.00 off
    }

    const res = calculateCouponDiscount({
      subtotalFils: 45000, // AED 450.00
      coupon: fixedCoupon,
    })

    expect(res.valid).toBe(true)
    expect(res.discountFils).toBe(5000)
  })

  it("caps fixed discount to the bag subtotal (cannot be negative total)", () => {
    const bigFixedCoupon = {
      ...baseActiveCoupon,
      discount_type: "fixed_fils" as const,
      discount_value: 20000, // AED 200.00
    }

    const res = calculateCouponDiscount({
      subtotalFils: 15000, // Bag is only AED 150.00
      coupon: bigFixedCoupon,
    })

    expect(res.valid).toBe(true)
    expect(res.discountFils).toBe(15000) // Discount equals subtotal
  })

  it("calculates free shipping promo code discount", () => {
    const shippingCoupon = {
      ...baseActiveCoupon,
      discount_type: "free_shipping" as const,
      discount_value: 0,
    }

    const res = calculateCouponDiscount({
      subtotalFils: 20000, // AED 200.00 (below AED 500 threshold)
      deliveryFeeFils: 3000, // AED 30.00 standard delivery
      coupon: shippingCoupon,
    })

    expect(res.valid).toBe(true)
    expect(res.freeShipping).toBe(true)
    expect(res.discountFils).toBe(3000)
  })

  it("rejects coupon when bag subtotal does not meet min_order_fils threshold", () => {
    const thresholdCoupon = {
      ...baseActiveCoupon,
      min_order_fils: 50000, // AED 500.00 minimum
    }

    const res = calculateCouponDiscount({
      subtotalFils: 35000, // AED 350.00
      coupon: thresholdCoupon,
    })

    expect(res.valid).toBe(false)
    expect(res.error).toContain("minimum order value of AED 500")
  })

  it("rejects inactive promo codes", () => {
    const inactiveCoupon = {
      ...baseActiveCoupon,
      is_active: false,
    }

    const res = calculateCouponDiscount({
      subtotalFils: 100000,
      coupon: inactiveCoupon,
    })

    expect(res.valid).toBe(false)
    expect(res.error).toBe("This promo code is no longer active.")
  })

  it("rejects expired promo codes", () => {
    const expiredCoupon = {
      ...baseActiveCoupon,
      expires_at: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
    }

    const res = calculateCouponDiscount({
      subtotalFils: 100000,
      coupon: expiredCoupon,
    })

    expect(res.valid).toBe(false)
    expect(res.error).toBe("This promo code has expired.")
  })

  it("rejects scheduled promo codes that have not started yet", () => {
    const futureCoupon = {
      ...baseActiveCoupon,
      starts_at: new Date(Date.now() + 86400 * 1000).toISOString(), // tomorrow
    }

    const res = calculateCouponDiscount({
      subtotalFils: 100000,
      coupon: futureCoupon,
    })

    expect(res.valid).toBe(false)
    expect(res.error).toBe("This promo code is not active yet.")
  })

  it("rejects promo codes when overall usage limit is reached", () => {
    const maxedCoupon = {
      ...baseActiveCoupon,
      usage_limit: 10,
      usage_count: 10,
    }

    const res = calculateCouponDiscount({
      subtotalFils: 100000,
      coupon: maxedCoupon,
    })

    expect(res.valid).toBe(false)
    expect(res.error).toBe("This promo code has reached its maximum redemptions limit.")
  })

  it("rejects promo codes when per-customer limit is reached", () => {
    const onePerCustomerCoupon = {
      ...baseActiveCoupon,
      per_customer_limit: 1,
    }

    const res = calculateCouponDiscount({
      subtotalFils: 100000,
      coupon: onePerCustomerCoupon,
      customerRedemptionsCount: 1, // already redeemed once
    })

    expect(res.valid).toBe(false)
    expect(res.error).toBe("You have already used this promo code.")
  })
})

describe("Coupons Form Schema Validation", () => {
  it("normalizes code to uppercase and trims whitespace", () => {
    const parsed = couponFormSchema.safeParse({
      code: " eid2026 ",
      discountType: "percentage",
      discountValue: 15,
      minOrderAed: 100,
      isActive: true,
    })

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.code).toBe("EID2026")
    }
  })

  it("rejects invalid characters in coupon code", () => {
    const parsed = couponFormSchema.safeParse({
      code: "VIP 15% OFF!",
      discountType: "percentage",
      discountValue: 15,
      minOrderAed: 0,
      isActive: true,
    })

    expect(parsed.success).toBe(false)
  })
})
