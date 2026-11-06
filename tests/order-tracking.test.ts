import { beforeEach, describe, expect, it, vi } from "vitest"
import { orderTrackingSchema } from "@/features/order-tracking/schemas"
import { canRevealTrackingId } from "@/features/order-tracking/access"

const db = vi.hoisted(() => ({
  from: vi.fn(), select: vi.fn(), eq: vi.fn(), ilike: vi.fn(), or: vi.fn(), maybeSingle: vi.fn(),
}))
vi.mock("server-only", () => ({}))
vi.mock("@/lib/supabase/server", () => ({ createAdminClient: () => db }))

import { trackOrderAction } from "@/features/order-tracking/actions"

const orderId = "590095e2-7283-45d1-80b3-723dc50527b3"
const input = { orderId, email: "guest@example.com" }

beforeEach(() => {
  vi.clearAllMocks()
  db.from.mockReturnValue(db)
  db.select.mockReturnValue(db)
  db.eq.mockReturnValue(db)
  db.ilike.mockReturnValue(db)
  db.or.mockReturnValue(db)
  db.maybeSingle.mockResolvedValue({ data: null, error: null })
})

describe("guest tracking", () => {
  it("accepts an Order Number (AR-1001) or a UUID and requires a valid checkout email", async () => {
    expect(orderTrackingSchema.safeParse({ ...input, orderId: "AR-1001" }).success).toBe(true)
    expect(orderTrackingSchema.safeParse({ ...input, orderId: "1001" }).success).toBe(true)
    expect(orderTrackingSchema.safeParse({ ...input, orderId: "ar-1001" }).success).toBe(true)
    expect(orderTrackingSchema.safeParse({ ...input, orderId: orderId }).success).toBe(true)
    expect(orderTrackingSchema.safeParse({ ...input, orderId: "x" }).success).toBe(false)
    expect(orderTrackingSchema.safeParse({ ...input, email: "" }).success).toBe(false)
    expect((await trackOrderAction({ orderId })).success).toBe(false)
    expect(db.from).not.toHaveBeenCalled()
  })

  it("normalizes the email and handles Order Number queries", async () => {
    await trackOrderAction({ orderId: "AR-1001", email: "  GUEST@Example.com  " })
    expect(db.ilike).toHaveBeenCalledWith("email", "guest@example.com")
    expect(db.or).toHaveBeenCalledWith("order_number.ilike.AR-1001,order_number.ilike.AR-1001")
  })

  it("normalizes the email and handles UUID queries", async () => {
    await trackOrderAction({ orderId, email: "  GUEST@Example.com  " })
    expect(db.eq).toHaveBeenCalledWith("id", orderId)
    expect(db.ilike).toHaveBeenCalledWith("email", "guest@example.com")
  })

  it("returns the same missing-order result for unmatched credentials", async () => {
    expect(await trackOrderAction(input)).toEqual({
      success: false,
      error: "No matching order found. Check your Order ID and checkout email.",
    })
  })

  it("returns only status and shipment details", async () => {
    db.maybeSingle.mockResolvedValue({ data: {
      id: orderId, status: "shipped", courier: "Test Courier", tracking_number: "TRACK-1",
      email: input.email, customer_name: "Private", street_address: "Private",
    }, error: null })
    expect(await trackOrderAction(input)).toEqual({ success: true, order: {
      orderId, orderNumber: undefined, status: "Shipped", courier: "Test Courier", trackingNumber: "TRACK-1",
    } })
    expect(db.select).toHaveBeenCalledWith("id, order_number, status, payment_method, courier, tracking_number")
  })

  it.each([
    ["pending", "cod", "Awaiting confirmation"],
    ["pending", "card", "Awaiting payment"],
    ["pending_payment", "card", "Awaiting payment"],
    ["awaiting_confirmation", "cod", "Awaiting confirmation"],
    ["packed", "card", "Packed"],
    ["delivered", "cod", "Delivered"],
    ["cancelled", "card", "Cancelled"],
    ["expired", "card", "Expired"],
    ["returned_to_sender", "cod", "Returned to sender"],
  ])("handles %s for %s", async (status, payment_method, label) => {
    db.maybeSingle.mockResolvedValue({ data: { id: orderId, status, payment_method }, error: null })
    expect(await trackOrderAction(input)).toEqual({ success: true, order: {
      orderId, orderNumber: undefined, status: label, courier: null, trackingNumber: null,
    } })
  })

  it("keeps database failure details private", async () => {
    db.maybeSingle.mockResolvedValue({ data: null, error: { message: "Internal DB details" } })
    expect(await trackOrderAction(input)).toEqual({
      success: false, error: "We couldn’t check your order right now. Please try again.",
    })
  })
})

describe("confirmation page Order ID visibility", () => {
  it("requires the matching customer or a nonempty matching Checkout Session", () => {
    expect(canRevealTrackingId(null, null, null, null)).toBe(false)
    expect(canRevealTrackingId("owner", "someone-else", "session", "wrong")).toBe(false)
    expect(canRevealTrackingId("owner", "owner", null, null)).toBe(true)
    expect(canRevealTrackingId(null, null, "session", "session")).toBe(true)
  })
})
