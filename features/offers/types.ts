import type { DiscountType } from "@/features/coupons/types"

export interface Offer {
  id: string
  slug: string
  title: string
  description: string
  terms: string
  status: "draft" | "published" | "disabled"
  discount_type: DiscountType
  discount_value: number
  scope: "all" | "products" | "categories"
  product_ids: string[]
  category_ids: string[]
  min_order_fils: number
  max_discount_fils: number | null
  usage_limit: number | null
  per_customer_limit: number | null
  starts_at: string | null
  expires_at: string | null
  created_at: string
}

export interface OfferQuote {
  offer_id: string
  title: string
  subtotal_fils: number
  eligible_fils: number
  discount_fils: number
  delivery_fee_fils: number
  free_shipping: boolean
}

export interface OfferChoice { id: string; name: string }
export interface ProductOfferTag { slug: string; title: string; label: string }

export function offerState(offer: Pick<Offer, "status" | "starts_at" | "expires_at">, now = new Date()): string {
  if (offer.status !== "published") return offer.status
  if (offer.starts_at && new Date(offer.starts_at) > now) return "scheduled"
  if (offer.expires_at && new Date(offer.expires_at) <= now) return "expired"
  return "active"
}

export function toDubaiInput(value: string | null): string {
  return value ? new Date(new Date(value).getTime() + 4 * 3600000).toISOString().slice(0, 16) : ""
}

export function fromDubaiInput(value: string): string | null {
  return value ? new Date(`${value}:00+04:00`).toISOString() : null
}
