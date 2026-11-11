import { beforeEach, expect, test, vi } from "vitest"
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), customerEmail: vi.fn(), adminEmail: vi.fn() }))
vi.mock("server-only", () => ({}))
vi.mock("@/lib/supabase/server", () => ({ createAdminClient: () => ({ rpc: mocks.rpc }) }))
vi.mock("@/lib/email", () => ({ sendOrderConfirmationEmail: mocks.customerEmail, sendAdminNewOrderNotification: mocks.adminEmail }))
import { placeCodOrder } from "@/features/checkout/cod-service"
import type { CheckoutFormValues } from "@/features/checkout/schemas"
const customer: CheckoutFormValues = { fullName: "Test Customer", email: "test@example.com", phone: "+971501234567", emirate: "Dubai", area: "Test", street: "Test", building: "Test", paymentMethod: "cod", saveAddress: false }
const id = "1e71c30d-cd8c-420c-aa18-d534fa09fab2"
const items = [{ variantId: id, sku: "existing-sku", quantity: 1, priceFils: 1 }]
beforeEach(() => {
  vi.clearAllMocks()
  mocks.rpc.mockResolvedValue({ data: { order_id: id, order_number: "AR-TEST", created: true }, error: null })
})
test("uses one COD RPC and never passes browser prices", async () => {
  expect((await placeCodOrder(customer, items, "verified-user", id)).success).toBe(true)
  expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("place_cod_order", expect.objectContaining({ p_key: id, p_items: [{ variant_id: id, sku: "existing-sku", quantity: 1 }], p_user_id: "verified-user" }))
  expect(mocks.customerEmail).toHaveBeenCalledOnce()
})
test("retry returns the existing order without duplicate emails", async () => {
  mocks.rpc.mockResolvedValue({ data: { order_id: id, order_number: "AR-TEST", created: false }, error: null })
  expect((await placeCodOrder(customer, items, "verified-user", id)).orderNumber).toBe("AR-TEST")
  expect(mocks.customerEmail).not.toHaveBeenCalled()
  expect(mocks.adminEmail).not.toHaveBeenCalled()
})
test("transaction failure returns failure and sends no emails", async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: { code: "P0001", message: "Insufficient stock" } })
  expect(await placeCodOrder(customer, items, "verified-user", id)).toEqual({ success: false, error: "Insufficient stock" })
  expect(mocks.customerEmail).not.toHaveBeenCalled()
})
test("rejects invalid quantities and missing attempt keys before database writes", async () => {
  expect((await placeCodOrder(customer, [{ ...items[0], quantity: -1 }], "verified-user", id)).success).toBe(false)
  expect((await placeCodOrder(customer, items, "verified-user")).success).toBe(false)
  expect(mocks.rpc).not.toHaveBeenCalled()
})
