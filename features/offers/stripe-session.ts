import "server-only"
import { getStripeServer } from "@/lib/stripe"
import { splitDiscountedLine } from "./pricing"

export interface OfferOrderSnapshot {
  id: string; order_number: string; email: string; offer_id: string; stripe_session_id: string | null
  hold_expires_at: string; delivery_fee_fils: number; created_at?: string
  offer_snapshot?: { checkout_origin?: string }
  order_items: { id: string; product_name: string; sku: string; quantity: number; total_fils: number; discount_fils: number }[]
}

export function offerCheckoutOrigin(order: OfferOrderSnapshot) {
  return order.offer_snapshot?.checkout_origin || (process.env.NEXT_PUBLIC_SITE_URL || "https://www.thearboutique.com").replace(/\/$/, "")
}

/** Identical parameters recover the same session after a network error or database-save failure. */
export async function recoverOfferSession(order: OfferOrderSnapshot) {
  const stripe = getStripeServer()
  if (order.stripe_session_id) return stripe.checkout.sessions.retrieve(order.stripe_session_id)
  const origin = offerCheckoutOrigin(order)
  return stripe.checkout.sessions.create({
    mode: "payment", currency: "aed", customer_email: order.email, client_reference_id: order.id,
    expires_at: Math.floor(new Date(order.hold_expires_at).getTime() / 1000),
    success_url: `${origin}/checkout/success?orderNumber=${encodeURIComponent(order.order_number)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout`,
    metadata: { order_id: order.id, order_number: order.order_number, offer_id: order.offer_id },
    line_items: [
      ...[...order.order_items].sort((a, b) => a.id.localeCompare(b.id)).flatMap(line =>
        splitDiscountedLine(line.total_fils, line.discount_fils, line.quantity).map(part => ({
          price_data: { currency: "aed", product_data: { name: line.product_name, metadata: { sku: line.sku } }, unit_amount: part.unitPriceFils }, quantity: part.quantity,
        }))),
      ...(order.delivery_fee_fils > 0 ? [{ price_data: { currency: "aed", product_data: { name: "Standard Delivery (UAE)" }, unit_amount: order.delivery_fee_fils }, quantity: 1 }] : []),
    ],
  }, { idempotencyKey: `offer_checkout_${order.id}` })
}
