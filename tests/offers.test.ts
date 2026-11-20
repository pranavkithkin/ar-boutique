import { describe, expect, it } from "vitest"
import { offerSchema } from "@/features/offers/schemas"
import { offerState, toDubaiInput, fromDubaiInput } from "@/features/offers/types"
import { splitDiscountedLine, returnLineAmount } from "@/features/offers/pricing"

const input = { title: "Festive offer", slug: "festive-offer", description: "", terms: "", status: "published", discount_type: "percentage", discount_value: 20, scope: "all", product_ids: [], category_ids: [], min_order_fils: 0, max_discount_fils: null, usage_limit: null, per_customer_limit: null, starts_at: null, expires_at: null }
describe("Offer rules", () => {
  it("accepts the supported first-version types and scopes", () => {
    for (const discount_type of ["percentage", "fixed_fils", "free_shipping"]) expect(offerSchema.safeParse({ ...input, discount_type }).success).toBe(true)
    expect(offerSchema.safeParse({ ...input, scope: "products", product_ids: ["be7da261-1489-4137-92e9-8bd95750eeb2"] }).success).toBe(true)
  })
  it("rejects invalid values, targeting and schedule", () => {
    for (const change of [{ discount_value: 101 }, { discount_value: -1 }, { discount_value: 1.5 }, { scope: "products" }, { scope: "categories" }, { usage_limit: 0 }, { slug: "Bad/Link" }, { starts_at: "2026-11-20T12:00:00Z", expires_at: "2026-11-20T11:00:00Z" }]) expect(offerSchema.safeParse({ ...input, ...change }).success).toBe(false)
  })
  it("identifies scheduled and expired offers at the boundary", () => {
    const now = new Date("2026-11-20T12:00:00Z")
    const offer = offerSchema.parse(input)
    expect(offerState(offer, now)).toBe("active")
    expect(offerState({ ...offer, starts_at: "2026-11-20T12:00:01Z" }, now)).toBe("scheduled")
    expect(offerState({ ...offer, expires_at: now.toISOString() }, now)).toBe("expired")
    expect(offerState({ ...offer, status: "draft" }, now)).toBe("draft")
  })
  it("round-trips UAE scheduling independently of the browser timezone", () => {
    expect(toDubaiInput("2026-11-20T08:30:00Z")).toBe("2026-11-20T12:30")
    expect(fromDubaiInput("2026-11-20T12:30")).toBe("2026-11-20T08:30:00.000Z")
    expect(fromDubaiInput("")).toBeNull()
  })
})
describe("Exact discounted amounts", () => {
  it("keeps Stripe units equal to exact net line amounts for every allowed quantity", () => {
    for (let quantity = 1; quantity <= 5; quantity++) for (const discount of [0, 1, 3333, 8000]) {
      const parts = splitDiscountedLine(8000, discount, quantity)
      expect(parts.reduce((s, p) => s + p.quantity, 0)).toBe(quantity)
      expect(parts.reduce((s, p) => s + p.quantity * p.unitPriceFils, 0)).toBe(8000 - discount)
      expect(parts.every(p => Number.isInteger(p.unitPriceFils) && p.unitPriceFils >= 0)).toBe(true)
    }
  })
  it("allocates partial refunds without losing or over-refunding a fil", () => {
    expect([0, 1, 2].reduce((sum, returned) => sum + returnLineAmount(10000, 3, returned, 1), 0)).toBe(10000)
    expect(returnLineAmount(0, 2, 0, 1)).toBe(0)
    expect(() => returnLineAmount(10000, 2, 1, 2)).toThrow()
    expect(() => splitDiscountedLine(1000, 1001, 1)).toThrow()
  })
})
