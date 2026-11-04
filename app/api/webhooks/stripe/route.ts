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
          .select("id, status, payment_status, order_number")
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

          // Trigger customer confirmation and admin alert emails asynchronously
          void sendOrderConfirmationEmail(orderId).catch((err) =>
            console.warn("[Stripe Webhook] Error sending customer email:", err)
          )
          void sendAdminNewOrderNotification(orderId).catch((err) =>
            console.warn("[Stripe Webhook] Error sending admin notification:", err)
          )
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

      default: {
        // Other events (e.g. charge.refunded, payment_intent.succeeded) can be logged
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

