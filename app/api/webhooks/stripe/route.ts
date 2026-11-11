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

  // 1. Claim the event before processing. In-flight duplicates receive 409 so Stripe retries them.
  let eventClaimed = false
  try {
    const { error: insertErr } = await supabase.from("stripe_events").insert({
      id: event.id,
      event_type: event.type,
      processing_status: "processing",
    })

    if (insertErr) {
      if (insertErr.code === "23505") {
        const { data: existing } = await supabase
          .from("stripe_events")
          .select("processing_status")
          .eq("id", event.id)
          .maybeSingle()

        if (existing?.processing_status === "processed") {
          return NextResponse.json({ received: true, duplicate: true })
        }

        if (existing?.processing_status === "processing") {
          return NextResponse.json({ error: "Event is already being processed." }, { status: 409 })
        }

        const { data: reclaimed } = await supabase
          .from("stripe_events")
          .update({ processing_status: "processing", received_at: new Date().toISOString() })
          .eq("id", event.id)
          .eq("processing_status", "failed")
          .select("id")
          .maybeSingle()

        if (!reclaimed) {
          return NextResponse.json({ error: "Event could not be claimed." }, { status: 409 })
        }
      } else {
        console.warn("[Stripe Webhook] Idempotency record warning:", insertErr.message)
      }
    }

    eventClaimed = !insertErr || insertErr.code === "23505"
  } catch (err) {
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

        // Stripe Checkout Requirement: verify payment_status before fulfillment
        if (session.payment_status === "paid") {
          console.log(`[Stripe Webhook] Payment confirmed for order ${orderId}, session ${session.id}`)
          await fulfillOrderPayment(supabase, session, orderId)
        } else {
          console.log(
            `[Stripe Webhook] Session completed but payment_status is '${session.payment_status}'. Awaiting asynchronous confirmation.`
          )
          await supabase.from("order_events").insert({
            order_id: orderId,
            event_type: "card_payment_pending",
            note: `Stripe checkout session completed with payment_status '${session.payment_status}'. Awaiting bank settlement.`,
            actor_sub: "stripe_webhook",
          })
        }
        break
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.order_id || session.client_reference_id

        if (orderId) {
          console.log(`[Stripe Webhook] Delayed payment succeeded for order ${orderId}`)
          await fulfillOrderPayment(supabase, session, orderId)
        }
        break
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.order_id || session.client_reference_id

        if (orderId) {
          console.log(`[Stripe Webhook] Delayed payment failed for order ${orderId}`)
          await releaseOrderStockAndCancel(
            supabase,
            orderId,
            "Delayed card or bank payment failed on Stripe."
          )
        }
        break
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.order_id || session.client_reference_id

        if (orderId) {
          console.log(`[Stripe Webhook] Checkout session expired for order ${orderId}`)
          await releaseOrderStockAndCancel(
            supabase,
            orderId,
            "Checkout session expired without payment (31m hold released)."
          )
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
        // The current payment_status enum has no partial-refund value; retain paid until fully refunded.
        const newPaymentStatus = isFullyRefunded ? "refunded" : "paid"

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
      case "refund.updated":
      case "refund.failed": {
        const refund = event.data.object as Stripe.Refund
        const paymentIntentId =
          typeof refund.payment_intent === "string"
            ? refund.payment_intent
            : refund.payment_intent?.id || null

        if (!paymentIntentId) break

        const refundDbStatus = refund.status === "succeeded"
          ? "succeeded"
          : refund.status === "failed"
          ? "failed"
          : "pending"

        const { data: order } = await supabase
          .from("orders")
          .select("id, order_number, payment_status, total_fils")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .maybeSingle()

        if (order) {
          const { data: existingRef } = await supabase
            .from("refunds")
            .select("id")
            .eq("stripe_refund_id", refund.id)
            .maybeSingle()

          if (!existingRef) {
            await supabase.from("refunds").insert({
              order_id: order.id,
              amount_fils: refund.amount || 0,
              method: "card",
              status: refundDbStatus,
              stripe_refund_id: refund.id,
              reason: refund.reason || "Stripe refund",
              processed_by: "stripe_webhook",
            })
          } else {
            await supabase
              .from("refunds")
              .update({ status: refundDbStatus })
              .eq("stripe_refund_id", refund.id)
          }

          if (refund.status !== "succeeded") break

          let totalRefunded = refund.amount || 0
          try {
            const stripe = getStripeServer()
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
              expand: ["latest_charge"],
            })
            const charge = typeof paymentIntent.latest_charge === "object" && paymentIntent.latest_charge
              ? paymentIntent.latest_charge
              : null
            totalRefunded = charge?.amount_refunded ?? totalRefunded
          } catch (stripeErr) {
            console.warn("[Stripe Webhook] Could not retrieve cumulative refund amount:", stripeErr)
          }

          const isFull = totalRefunded >= (order.total_fils || 0)
          // Partial refunds remain paid in the current schema until the cumulative amount is full.
          const newStatus = isFull ? "refunded" : "paid"
          await supabase.from("orders").update({ payment_status: newStatus, updated_at: new Date().toISOString() }).eq("id", order.id)

          const refundedAed = (totalRefunded / 100).toFixed(2)
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
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
      }
    }

    if (eventClaimed) {
      await supabase
        .from("stripe_events")
        .update({ processing_status: "processed" })
        .eq("id", event.id)
    }
    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    if (eventClaimed) {
      await supabase
        .from("stripe_events")
        .update({ processing_status: "failed" })
        .eq("id", event.id)
    }
    const msg = err instanceof Error ? err.message : "Internal error processing webhook"
    console.error("[Stripe Webhook] Processing error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * Fulfils the paid order and stock transition atomically, then records coupons and sends emails.
 */
async function fulfillOrderPayment(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session,
  orderId: string
) {
  // Fetch current order
  const { data: order, error: orderFetchErr } = await supabase
    .from("orders")
    .select("id, status, payment_status, order_number, email, clerk_user_id, discount_fils")
    .eq("id", orderId)
    .maybeSingle()

  if (orderFetchErr || !order) {
    console.error("[Stripe Webhook] Order not found for session:", orderId)
    return
  }

  // Avoid re-processing if already confirmed and paid
  if (order.status === "confirmed" && order.payment_status === "paid") {
    console.log(`[Stripe Webhook] Order ${orderId} is already confirmed and paid.`)
    return
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null

  const { data: fulfilled, error: fulfillError } = await supabase.rpc("fulfill_card_order", {
    p_order_id: orderId,
    p_stripe_session_id: session.id,
    p_stripe_payment_intent_id: paymentIntentId,
  })

  if (fulfillError) {
    throw new Error(`Atomic order fulfilment failed: ${fulfillError.message}`)
  }

  // A second event for an already-paid order should not duplicate coupons or emails.
  if (fulfilled !== true) {
    return
  }

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

/**
 * Releases stock reservation and marks order cancelled upon session expiry or async failure.
 */
async function releaseOrderStockAndCancel(
  supabase: ReturnType<typeof createAdminClient>,
  orderId: string,
  cancellationReason: string
) {
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
          await supabase.rpc("release_reserved_stock", {
            p_variant_id: item.variant_id,
            p_quantity: item.quantity,
          })
        }
      }
    }

    // Mark order cancelled
    await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancellation_reason: cancellationReason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    await supabase.from("order_events").insert({
      order_id: orderId,
      event_type: "checkout_expired",
      from_status: "pending",
      to_status: "cancelled",
      note: cancellationReason,
      actor_sub: "stripe_webhook",
    })
  }
}

