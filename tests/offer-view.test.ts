import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
vi.mock("@/features/offers/actions", () => ({ saveOfferAction: vi.fn() }))
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => createElement("a", { href }, children) }))
import { OfferForm } from "@/features/offers/components/OfferForm"
import { OfferSummary } from "@/features/offers/components/OfferSummary"
import { offerSchema } from "@/features/offers/schemas"

it("renders a labelled draft campaign form with UAE scheduling and no generated client data", () => {
  const html = renderToStaticMarkup(createElement(OfferForm, { products: [], categories: [] }))
  expect(html).toContain('for="offer-title"')
  expect(html).toContain('for="offer-slug"')
  expect(html).toContain("UAE time")
  expect(html).toContain("Draft")
  expect(html).toContain("Offers cannot stack with coupons")
  expect(html).toContain("Save offer")
})
it("allows editing an existing campaign link", () => {
  const offer = { ...offerSchema.parse({ title: "Offer test", slug: "offer-test", description: "", terms: "", status: "published", discount_type: "free_shipping", discount_value: 0, scope: "all", product_ids: [], category_ids: [], min_order_fils: 0, max_discount_fils: null, usage_limit: null, per_customer_limit: null, starts_at: null, expires_at: null }), id: "be7da261-1489-4137-92e9-8bd95750eeb2", created_at: "2026-11-20T00:00:00Z" }
  const html = renderToStaticMarkup(createElement(OfferForm, { offer, products: [], categories: [] }))
  expect(html).not.toContain('readOnly=""')
  expect(html).toContain('value="offer-test"')
})
it("shows an automatically applied offer summary without an activation control", () => {
  const html = renderToStaticMarkup(createElement(OfferSummary, {
    offer: { slug: "festive-edit", title: "Festive Edit" },
    quote: { offer_id: "offer-id", title: "Festive Edit", subtotal_fils: 10000, eligible_fils: 10000, discount_fils: 1000, delivery_fee_fils: 2500, free_shipping: false },
  }))
  expect(html).toContain("Festive Edit")
  expect(html).toContain("AED 10 off eligible items")
  expect(html).not.toContain("Activate offer")
})
