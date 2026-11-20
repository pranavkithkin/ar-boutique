import "server-only"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server"
import { sendAdminNewOrderNotification, sendOrderConfirmationEmail } from "@/lib/email"
import type { CheckoutFormValues } from "@/features/checkout/schemas"
import type { PlaceOrderResult } from "@/features/checkout/types"
import { z } from "zod"
import { offerLinesSchema } from "./schemas"
import { offerCheckoutOrigin, recoverOfferSession } from "./stripe-session"

export async function placeOfferOrder(customer: CheckoutFormValues, items: unknown, userId: string | null, key: string | undefined, slug: string): Promise<PlaceOrderResult> {
  const lines = offerLinesSchema.safeParse(items)
  if (!lines.success || !z.string().uuid().safeParse(key).success || !z.string().max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).safeParse(slug).success) {
    return { success: false, error: "Please refresh checkout and check your bag." }
  }
  const db = createAdminClient()
  const checkoutOrigin = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.thearboutique.com").replace(/\/$/, "")
  const { data, error } = await db.rpc("place_store_order", {
    p_key: key, p_customer: { ...customer, checkoutOrigin }, p_items: lines.data.map(i => ({ variant_id: i.variantId, quantity: i.quantity })),
    p_user_id: userId, p_coupon_code: null, p_offer_slug: slug,
  })
  if (error) return { success: false, error: error.code === "P0001" ? error.message : "Your order could not be created. Please try again." }
  const result = z.object({ order_id: z.string().uuid(), order_number: z.string(), created: z.boolean() }).parse(data)
  const base = { success: true, orderId: result.order_id, orderNumber: result.order_number, paymentMethod: customer.paymentMethod }
  if (customer.paymentMethod === "cod") {
    if (result.created) await Promise.allSettled([sendOrderConfirmationEmail(result.order_id), sendAdminNewOrderNotification(result.order_id)])
    return { ...base, redirectUrl: `/checkout/received/${encodeURIComponent(result.order_number)}` }
  }
  const { data: order, error: readError } = await db.from("orders").select("*,order_items(*)").eq("id", result.order_id).single()
  if (readError || !order) return { success: false, error: "Checkout could not be loaded. Please retry." }
  const origin = offerCheckoutOrigin(order)
  try {
    const session = await recoverOfferSession(order)
    if (session.status === "complete") return { ...base, redirectUrl: `${origin}/checkout/success?orderNumber=${encodeURIComponent(result.order_number)}&session_id=${session.id}` }
    if (session.status === "expired") {
      await db.rpc("cancel_offer_checkout", { p_order_id: order.id })
      return { success: false, error: "This checkout has expired. Refresh your bag and try checkout again." }
    }
    if (!session.url) throw new Error("No checkout URL")
    const saved = await db.from("orders").update({ stripe_session_id: session.id, offer_payment_note: null }).eq("id", order.id)
    if (saved.error) return { success: false, error: "Checkout was created but could not be saved. Please retry." }
    return { ...base, redirectUrl: session.url }
  } catch (error) {
    // An uncertain network result may have created a Session. Keep its hold and retry the same Stripe key.
    if (!order.stripe_session_id && error instanceof Stripe.errors.StripeInvalidRequestError) await db.rpc("cancel_offer_checkout", { p_order_id: order.id })
    else await db.from("orders").update({ offer_payment_note: "Checkout result needs review. Verify Stripe before cancelling; the customer can retry this checkout." }).eq("id", order.id)
    return { success: false, error: "Card checkout could not be opened. Please retry checkout." }
  }
}
