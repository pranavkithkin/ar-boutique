import { describe, it, expect } from "vitest"

describe("Customer Order Cancellation & Refund Eligibility", () => {
  function isEligibleForCustomerCancellation(status: string): boolean {
    const blockedStatuses = ["shipped", "delivered", "returned_to_sender", "cancelled"]
    return !blockedStatuses.includes(status)
  }

  function isEligibleForStripeRefund(paymentMethod: string, paymentStatus: string): boolean {
    return paymentMethod === "card" && paymentStatus === "paid"
  }

  it("permits cancellation for pre-dispatch statuses", () => {
    expect(isEligibleForCustomerCancellation("pending")).toBe(true)
    expect(isEligibleForCustomerCancellation("confirmed")).toBe(true)
    expect(isEligibleForCustomerCancellation("awaiting_confirmation")).toBe(true)
    expect(isEligibleForCustomerCancellation("packed")).toBe(true)
  })

  it("blocks cancellation for dispatched, completed, or terminal statuses", () => {
    expect(isEligibleForCustomerCancellation("shipped")).toBe(false)
    expect(isEligibleForCustomerCancellation("delivered")).toBe(false)
    expect(isEligibleForCustomerCancellation("returned_to_sender")).toBe(false)
    expect(isEligibleForCustomerCancellation("cancelled")).toBe(false)
  })

  it("determines Stripe refund eligibility correctly", () => {
    expect(isEligibleForStripeRefund("card", "paid")).toBe(true)
    expect(isEligibleForStripeRefund("card", "refunded")).toBe(false)
    expect(isEligibleForStripeRefund("card", "pending")).toBe(false)
    expect(isEligibleForStripeRefund("cod", "paid")).toBe(false)
    expect(isEligibleForStripeRefund("cod", "unpaid")).toBe(false)
  })

  it("formats composite cancellation reason properly", () => {
    const selected = "Incorrect size or colourway selected"
    const notes = "Wanted size M instead of L"
    const composite = notes.trim() ? `${selected}: ${notes.trim()}` : selected
    expect(composite).toBe("Incorrect size or colourway selected: Wanted size M instead of L")
  })
})

