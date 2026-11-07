import { NextRequest, NextResponse } from "next/server"
import { getStripeServer } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/server"
import { sendOrderConfirmationEmail, sendAdminNewOrderNotification } from "@/lib/email"
import type Stripe from "stripe"

/**
 * Stripe Webhook Handler (ADR-008 & docs/ARCHITECTURE.md)
 * Route: /api/webhooks/stripe
 *
 * Verifies raw request body signature with STRIPE_WEBHOOK_SECRET.
 * Enforces event idempotency through `stripe_events`.
 * Handles:
 *  - `checkout.session.completed`: Marks order confirmed, payment paid, consumes held stock, sends emails.
 *  - `checkout.session.expired`: Releases held stock, marks order expired.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = req.headers.get("stripe-signature")

  if (!webhookSecret || !signature) {
    console.error("[Stripe Webhook] Missing webhook secret or signature header.")
    return NextResponse.json(
      { error: "Webhook secret or signature missing." },
      { status: 400 }
    )
  }

  const rawBody = await req.text()
  let event: Stripe.Event

  try {
    const stripe = getStripeServer()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid webhook signature."
    console.error(`[Stripe Webhook] Signature verification failed: ${msg}`)
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 1. Idempotency Check: check if event was already processed
  try {
    const { data: existingEvent } = await supabase
      .from("stripe_events")
      .select("id")
      .eq("id", event.id)
      .maybeSingle()

    if (existingEvent) {
      console.log(`[Stripe Webhook] Skipping duplicate event ${event.id}`)
      return NextResponse.json({ received: true, duplicate: true })
    }
  } catch (err) {
    // If stripe_events table is not yet created, proceed safely with logging
    console.warn("[Stripe Webhook] Idempotency table check skipped/failed:", err)
  }

  // 2. Handle Event Types
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.order_id || session.client_reference_id

        if (!orderId) {
          console.warn("[Stripe Webhook] No order_id associated with session:", session.id)
          break
        }

        console.log(`[Stripe Webhook] Processing payment for order ${orderId}, session ${session.id}`)

        // Fetch current order
        const { data: order, error: orderFetchErr } = await supabase
          .from("orders")
          .select("id, status, payment_status, order_number, email, clerk_user_id, discount_fils")
          .eq("id", orderId)
          .maybeSingle()

        if (orderFetchErr || !order) {
          console.error("[Stripe Webhook] Order not found for session:", orderId)
          break
        }

        // Avoid re-processing if already confirmed
        if (order.status !== "confirmed" && order.status !== "paid") {
          // Update order status to confirmed and paid
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id || null

          const updatePayload: Record<string, unknown> = {
            status: "confirmed",
            payment_status: "paid",
            confirmed_at: new Date().toISOString(),
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          // If database columns exist for stripe tracking, set them
          try {
            updatePayload.stripe_session_id = session.id
            if (paymentIntentId) {
              updatePayload.stripe_payment_intent_id = paymentIntentId
            }
          } catch {
            // Ignore if columns absent
          }

          const { error: updateErr } = await supabase
            .from("orders")
            .update(updatePayload)
            .eq("id", orderId)

          if (updateErr) {
            // Fallback without extra stripe columns in case migration hasn't been run
            delete updatePayload.stripe_session_id
            delete updatePayload.stripe_payment_intent_id
            await supabase.from("orders").update(updatePayload).eq("id", orderId)
          }

          // Consume reserved inventory: reduce both reserved and on_hand
          const { data: items } = await supabase
            .from("order_items")
            .select("variant_id, quantity")
            .eq("order_id", orderId)

          if (items && items.length > 0) {
            for (const item of items) {
              if (item.variant_id) {
                const { data: stock } = await supabase
                  .from("stock_levels")
                  .select("on_hand, reserved")
                  .eq("variant_id", item.variant_id)
                  .maybeSingle()

                if (stock) {
                  const newOnHand = Math.max(0, (stock.on_hand || 0) - item.quantity)
                  const newReserved = Math.max(0, (stock.reserved || 0) - item.quantity)

                  await supabase
                    .from("stock_levels")
                    .update({
                      on_hand: newOnHand,
                      reserved: newReserved,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("variant_id", item.variant_id)
                }
              }
            }
          }

          // Log event in order_events audit trail
          await supabase.from("order_events").insert({
            order_id: orderId,
            event_type: "card_payment_confirmed",
            from_status: order.status,
            to_status: "confirmed",
            note: `Payment confirmed via Stripe Checkout (Session: ${session.id}).`,
            actor_sub: "stripe_webhook",
          })

          // Record coupon redemption now that payment is confirmed
          const promoCode = session.metadata?.promo_code
          const discountFilsStr = session.metadata?.discount_fils
          const discountFils = discountFilsStr ? parseInt(discountFilsStr, 10) : (order.discount_fils || 0)

          if (promoCode && discountFils > 0) {
            try {
              const { data: dbCoupon } = await supabase
                .from("coupons")
                .select("id, usage_count")
                .ilike("code", promoCode.trim())
                .maybeSingle()

              if (dbCoupon) {
                const customerEmail =
                  order.email?.toLowerCase().trim() ||
                  session.customer_details?.email?.toLowerCase().trim() ||
                  session.customer_email?.toLowerCase().trim() ||
                  ""

                await supabase.from("coupon_redemptions").insert({
                  coupon_id: dbCoupon.id,
                  order_id: orderId,
                  customer_email: customerEmail,
                  clerk_user_id: order.clerk_user_id || null,
                  discount_fils: discountFils,
                })

                await supabase
                  .from("coupons")
                  .update({
                    usage_count: (dbCoupon.usage_count || 0) + 1,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", dbCoupon.id)
              }
            } catch (couponErr) {
              console.warn("[Stripe Webhook] Error recording coupon redemption:", couponErr)
            }
          }

          // Trigger customer confirmation and admin alert emails safely
          try {
            await Promise.allSettled([
              sendOrderConfirmationEmail(orderId),
              sendAdminNewOrderNotification(orderId),
            ])
          } catch (emailErr) {
            console.warn("[Stripe Webhook] Error sending emails:", emailErr)
          }
        }
        break
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.order_id || session.client_reference_id

        if (!orderId) break

        console.log(`[Stripe Webhook] Checkout session expired for order ${orderId}`)

        const { data: order } = await supabase
          .from("orders")
          .select("id, status")
          .eq("id", orderId)
          .maybeSingle()

        if (order && order.status === "pending") {
          // Release reserved stock hold
          const { data: items } = await supabase
            .from("order_items")
            .select("variant_id, quantity")
            .eq("order_id", orderId)

          if (items) {
            for (const item of items) {
              if (item.variant_id) {
                const { data: stock } = await supabase
                  .from("stock_levels")
                  .select("reserved")
                  .eq("variant_id", item.variant_id)
                  .maybeSingle()

                if (stock && stock.reserved > 0) {
                  await supabase
                    .from("stock_levels")
                    .update({
                      reserved: Math.max(0, stock.reserved - item.quantity),
                      updated_at: new Date().toISOString(),
                    })
                    .eq("variant_id", item.variant_id)
                }
              }
            }
          }

          // Mark order expired/cancelled
          await supabase
            .from("orders")
            .update({
              status: "cancelled",
              cancellation_reason: "Checkout session expired without payment.",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId)

          await supabase.from("order_events").insert({
            order_id: orderId,
            event_type: "checkout_expired",
            from_status: "pending",
            to_status: "cancelled",
            note: "Stripe checkout session timed out (31m hold released).",
            actor_sub: "stripe_webhook",
          })
        }
        break
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id || null

        if (!paymentIntentId) break

        console.log(`[Stripe Webhook] Charge refunded for payment intent ${paymentIntentId}`)

        const isFullyRefunded = charge.refunded
        const newPaymentStatus = isFullyRefunded ? "refunded" : "partially_refunded"

        const { data: order } = await supabase
          .from("orders")
          .select("id, order_number, payment_status, total_fils")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .maybeSingle()

        if (order) {
          await supabase
            .from("orders")
            .update({
              payment_status: newPaymentStatus,
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id)

          const refundedAed = ((charge.amount_refunded || 0) / 100).toFixed(2)
          await supabase.from("order_events").insert({
            order_id: order.id,
            event_type: isFullyRefunded ? "payment_refunded" : "payment_partially_refunded",
            from_status: order.payment_status,
            to_status: newPaymentStatus,
            note: `Stripe card charge ${newPaymentStatus}. Amount refunded: AED ${refundedAed} (Charge: ${charge.id}).`,
            actor_sub: "stripe_webhook",
          })
        }
        break
      }

      case "refund.created":
      case "refund.updated": {
        const refund = event.data.object as Stripe.Refund
        const paymentIntentId =
          typeof refund.payment_intent === "string"
            ? refund.payment_intent
            : refund.payment_intent?.id || null

        if (!paymentIntentId || refund.status !== "succeeded") break

        console.log(`[Stripe Webhook] Refund succeeded for payment intent ${paymentIntentId}`)

        const { data: order } = await supabase
          .from("orders")
          .select("id, order_number, payment_status, total_fils")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .maybeSingle()

        if (order) {
          const isFull = (refund.amount || 0) >= (order.total_fils || 0)
          const newStatus = isFull ? "refunded" : "partially_refunded"

          await supabase
            .from("orders")
            .update({
              payment_status: newStatus,
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id)

          const refundedAed = ((refund.amount || 0) / 100).toFixed(2)
          await supabase.from("order_events").insert({
            order_id: order.id,
            event_type: "payment_refunded",
            from_status: order.payment_status,
            to_status: newStatus,
            note: `Stripe refund ${refund.status}. Amount refunded: AED ${refundedAed} (Refund: ${refund.id}).`,
            actor_sub: "stripe_webhook",
          })
        }
        break
      }

      default: {
        // Other events (e.g. payment_intent.succeeded) can be logged
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
      }
    }

    // 3. Record event in stripe_events table for idempotency
    try {
      await supabase.from("stripe_events").insert({
        id: event.id,
        event_type: event.type,
      })
    } catch {
      // Ignored if table doesn't exist
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error processing webhook"
    console.error("[Stripe Webhook] Processing error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

