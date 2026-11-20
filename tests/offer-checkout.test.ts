import { beforeEach, describe, expect, it, vi } from "vitest"
import Stripe from "stripe"

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), create: vi.fn(), retrieve: vi.fn(), email: vi.fn() }))
vi.mock("server-only", () => ({}))
vi.mock("@/lib/supabase/server", () => ({ createAdminClient: () => ({ rpc: mocks.rpc, from: mocks.from }) }))
vi.mock("@/lib/stripe", () => ({ getStripeServer: () => ({ checkout: { sessions: { create: mocks.create, retrieve: mocks.retrieve } } }) }))
vi.mock("@/lib/email", () => ({ sendOrderConfirmationEmail: mocks.email, sendAdminNewOrderNotification: mocks.email }))
import { placeOfferOrder } from "@/features/offers/checkout-service"
import type { CheckoutFormValues } from "@/features/checkout/schemas"

const id = "be7da261-1489-4137-92e9-8bd95750eeb2"
const customer: CheckoutFormValues = { fullName: "Offer test", email: "offer@example.test", phone: "+971501234567", emirate: "Dubai", area: "Test", street: "Test", building: "Test", paymentMethod: "card", saveAddress: false }
const items = [{ variantId: "01581467-7bb3-4717-96d4-298132d8a06d", quantity: 3, priceFils: 1 }]
const order = { id, order_number: "AR-TEST", email: customer.email, offer_id: id, stripe_session_id: null, hold_expires_at: new Date(Date.now() + 31 * 60000).toISOString(), delivery_fee_fils: 2500, order_items: [{ id, sku: "AR4207-TP-L", product_name: "Top AR4207", quantity: 3, total_fils: 24000, discount_fils: 3333 }] }
beforeEach(() => {
  vi.clearAllMocks()
  mocks.rpc.mockResolvedValue({ data: { order_id: id, order_number: "AR-TEST", created: true }, error: null })
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: order }), update: vi.fn().mockReturnThis() }
  mocks.from.mockReturnValue(query)
  mocks.create.mockResolvedValue({ id: "cs_test_offer", status: "open", url: "https://checkout.stripe.com/test" })
  mocks.email.mockResolvedValue({ success: true })
})
describe("Offer checkout orchestration", () => {
  it("uses transaction snapshots rather than browser prices and creates an exact Stripe total", async () => {
    const result = await placeOfferOrder(customer, items, null, id, "festive-offer")
    expect(result.success).toBe(true)
    const [params, options] = mocks.create.mock.calls[0]
    expect(params.line_items.reduce((sum: number, line: { quantity: number; price_data: { unit_amount: number } }) => sum + line.quantity * line.price_data.unit_amount, 0)).toBe(23167)
    expect(options.idempotencyKey).toBe(`offer_checkout_${id}`)
    expect(params.metadata.promo_code).toBeUndefined()
    expect(mocks.email).not.toHaveBeenCalled()
    expect(mocks.rpc.mock.calls[0][1].p_items).toEqual([{ variant_id: items[0].variantId, quantity: 3 }])
  })
  it("never calls Stripe when the database rejects eligibility", async () => {
    mocks.rpc.mockResolvedValueOnce({ error: { code: "P0001", message: "This offer has ended." } })
    expect((await placeOfferOrder(customer, items, null, id, "festive-offer")).success).toBe(false)
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it("keeps uncertain network results reserved for an idempotent retry", async () => {
    mocks.create.mockRejectedValueOnce(new Error("Network timeout"))
    expect((await placeOfferOrder(customer, items, null, id, "festive-offer")).success).toBe(false)
    expect(mocks.rpc).toHaveBeenCalledTimes(1)
  })
  it("cleans up a definitively invalid Stripe request", async () => {
    const error = new Stripe.errors.StripeInvalidRequestError({ message: "Invalid amount" })
    mocks.create.mockRejectedValueOnce(error)
    await placeOfferOrder(customer, items, null, id, "festive-offer")
    expect(mocks.rpc).toHaveBeenLastCalledWith("cancel_offer_checkout", { p_order_id: id })
  })
  it("sends COD emails only once and does not call Stripe", async () => {
    await placeOfferOrder({ ...customer, paymentMethod: "cod" }, items, "customer", id, "festive-offer")
    expect(mocks.email).toHaveBeenCalledTimes(2)
    mocks.email.mockClear()
    mocks.rpc.mockResolvedValueOnce({ data: { order_id: id, order_number: "AR-TEST", created: false } })
    await placeOfferOrder({ ...customer, paymentMethod: "cod" }, items, "customer", id, "festive-offer")
    expect(mocks.email).not.toHaveBeenCalled()
    expect(mocks.create).not.toHaveBeenCalled()
  })
})
