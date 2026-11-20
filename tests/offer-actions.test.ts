import { beforeEach, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ auth: vi.fn(), save: vi.fn(), quote: vi.fn(), list: vi.fn(), db: vi.fn(), settings: vi.fn() }))
vi.mock("@/lib/supabase/admin-auth", () => ({ requireAdmin: mocks.auth }))
vi.mock("@/features/offers/service", () => ({ saveOffer: mocks.save, quoteOffer: mocks.quote, listOffers: mocks.list }))
vi.mock("@/lib/supabase/server", () => ({ createAdminClient: mocks.db }))
vi.mock("@/features/admin/settings/actions", () => ({ getStoreSettings: mocks.settings }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
import { saveOfferAction, bestAutomaticOfferAction, bannerOfferChoicesAction } from "@/features/offers/actions"
beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue(null) })
it("denies offer writes and banner administration to unauthenticated callers", async () => {
  expect((await saveOfferAction(null, {})).success).toBe(false)
  expect(await bannerOfferChoicesAction()).toEqual([])
  expect(mocks.save).not.toHaveBeenCalled()
  expect(mocks.list).not.toHaveBeenCalled()
})
it("validates input even for a verified admin", async () => {
  mocks.auth.mockResolvedValue({ id: "admin" })
  expect((await saveOfferAction(null, { discount_value: 200 })).success).toBe(false)
  expect(mocks.save).not.toHaveBeenCalled()
})
it("strips browser prices from automatic offer quote requests", async () => {
  const productId = "256a0847-ea2f-4734-b144-27970b47c813"
  const variantId = "01581467-7bb3-4717-96d4-298132d8a06d"
  const line = { variantId, quantity: 2, priceFils: 1, productId }
  mocks.list.mockResolvedValue([{ id: "offer-id", slug: "festive-sale", title: "Festive Sale", status: "published", starts_at: null, expires_at: null, scope: "all", product_ids: [], category_ids: [], created_at: "2026-11-20T00:00:00Z" }])
  mocks.db.mockReturnValue({ from: () => ({ select: () => ({ in: async () => ({ data: [{ id: productId, category_id: null }], error: null }) }) }) })
  mocks.quote.mockResolvedValue({ success: true, quote: { offer_id: "offer-id", title: "Festive Sale", subtotal_fils: 10000, eligible_fils: 10000, discount_fils: 1000, delivery_fee_fils: 2500, free_shipping: false } })
  mocks.settings.mockResolvedValue({ free_delivery_over_fils: 50000, delivery_fee_fils: 2500 })
  await bestAutomaticOfferAction([line], "test@example.test")
  expect(mocks.quote).toHaveBeenCalledWith("festive-sale", [{ variantId, quantity: 2 }], "test@example.test")
})
it("rejects invalid quantities and unknown target requests", async () => {
  expect((await bestAutomaticOfferAction([{ variantId: "bad", productId: "bad", quantity: 6 }])).success).toBe(false)
  expect(mocks.quote).not.toHaveBeenCalled()
})
