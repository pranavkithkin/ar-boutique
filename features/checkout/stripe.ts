import "server-only"
import { getStripeServer } from "@/lib/stripe"
import type Stripe from "stripe"

export interface CreateStripeSessionParams {
  orderId: string
  orderNumber: string
  customerEmail: string
  customerName: string
  items: Array<{
    name: string
    sku: string
    quantity: number
    unitPriceFils: number
  }>
  deliveryFeeFils: number
  discountFils?: number
  promoCode?: string
  vatFils: number
  successUrl: string
  cancelUrl: string
}

/**
 * Creates a Stripe Hosted Checkout Session in AED currency per ADR-006 & ADR-033.
 * - Expires in 31 minutes
 * - Includes garment line items + delivery fee (if any)
 * - Carries order_id and order_number in metadata and client_reference_id
 */
export async function createStripeCheckoutSession(
  params: CreateStripeSessionParams
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeServer()

  // 1. Build line items
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.items.map((item) => ({
    price_data: {
      currency: "aed",
      product_data: {
        name: item.name,
        metadata: {
          sku: item.sku,
        },
      },
      // Stripe amounts are in integer smallest currency unit (1 AED = 100 fils / cents)
      unit_amount: item.unitPriceFils,
    },
    quantity: item.quantity,
  }))

  // 2. Add delivery fee line item if applicable
  if (params.deliveryFeeFils > 0) {
    lineItems.push({
      price_data: {
        currency: "aed",
        product_data: {
          name: "Standard Delivery (UAE)",
        },
        unit_amount: params.deliveryFeeFils,
      },
      quantity: 1,
    })
  }

  // 3. Handle Promotional Discount (Coupon)
  const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = []
  if (params.discountFils && params.discountFils > 0) {
    const couponName = params.promoCode
      ? `Promo Code (${params.promoCode.toUpperCase()})`
      : "Promotional Discount"

    // Create a one-time Stripe coupon matching the exact discount amount in AED
    const stripeCoupon = await stripe.coupons.create(
      {
        amount_off: params.discountFils,
        currency: "aed",
        duration: "once",
        name: couponName,
      },
      {
        idempotencyKey: `coupon_${params.orderId}_${params.discountFils}`,
      }
    )

    discounts.push({ coupon: stripeCoupon.id })
  }

  // 4. Set expiry to 31 minutes from now (Stripe requires minimum 30 minutes)
  const expiresAtUnix = Math.floor(Date.now() / 1000) + 31 * 60

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      currency: "aed",
      customer_email: params.customerEmail,
      client_reference_id: params.orderId,
      line_items: lineItems,
      discounts: discounts.length > 0 ? discounts : undefined,
      expires_at: expiresAtUnix,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        order_id: params.orderId,
        order_number: params.orderNumber,
        customer_name: params.customerName,
        promo_code: params.promoCode || "",
        discount_fils: (params.discountFils || 0).toString(),
      },
    },
    {
      idempotencyKey: `cs_order_${params.orderId}`,
    }
  )

  return session
}

