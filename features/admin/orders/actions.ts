"use server"

import "server-only"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin-auth"
import {
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderCancelledEmail,
  sendRefundConfirmationEmail,
} from "@/lib/email"
import { getStripeServer } from "@/lib/stripe"
import { formatAED } from "@/lib/money"
import {
  AdminOrderListItem,
  AdminOrderDetail,
  AdminOrderItem,
  AdminOrderEvent,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "./types"

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"

function getCloudinaryUrl(mediaKey?: string | null): string | null {
  if (!mediaKey) return null
  if (mediaKey.startsWith("http://") || mediaKey.startsWith("https://")) {
    return mediaKey
  }
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_limit,w_400/${mediaKey}`
}

export interface GetAdminOrdersListParams {
  search?: string
  status?: string
  paymentMethod?: string
  page?: number
  pageSize?: number
}

export interface GetAdminOrdersListResult {
  orders: AdminOrderListItem[]
  total: number
  currentPage: number
  totalPages: number
  pageSize: number
}

/**
 * Fetch paginated orders list with search and filters from Supabase.
 */
export async function getAdminOrdersList({
  search = "",
  status = "all",
  paymentMethod = "all",
  page = 1,
  pageSize = 10,
}: GetAdminOrdersListParams): Promise<GetAdminOrdersListResult> {
  try {
    const adminDb = createAdminClient()
    const safePage = Math.max(1, page)

    let query = adminDb
      .from("orders")
      .select(
        `
        id,
        order_number,
        created_at,
        customer_name,
        email,
        phone,
        status,
        payment_method,
        payment_status,
        total_fils,
        order_items (
          id,
          quantity
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      if (status === "pending" || status === "awaiting_confirmation") {
        query = query.in("status", ["pending", "awaiting_confirmation"])
      } else {
        query = query.eq("status", status)
      }
    }

    if (paymentMethod && paymentMethod !== "all") {
      query = query.eq("payment_method", paymentMethod)
    }

    if (search && search.trim()) {
      const q = search.trim()
      query = query.or(
        `order_number.ilike.%${q}%,customer_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
      )
    }

    const from = (safePage - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, count, error } = await query

    if (error || !data) {
      console.error("Failed to query orders list:", error)
      return {
        orders: [],
        total: 0,
        currentPage: safePage,
        totalPages: 0,
        pageSize,
      }
    }

    const total = count ?? 0
    const totalPages = Math.ceil(total / pageSize)

    const orders: AdminOrderListItem[] = data.map((o: any) => ({
      id: o.id,
      order_number: o.order_number,
      created_at: o.created_at,
      customer_name: o.customer_name,
      customer_email: o.email,
      customer_phone: o.phone,
      status: o.status as OrderStatus,
      payment_method: o.payment_method as PaymentMethod,
      payment_status: o.payment_status as PaymentStatus,
      item_count: Array.isArray(o.order_items)
        ? o.order_items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0)
        : 0,
      total_fils: o.total_fils,
    }))

    return {
      orders,
      total,
      currentPage: safePage,
      totalPages,
      pageSize,
    }
  } catch (err) {
    console.error("getAdminOrdersList error:", err)
    return {
      orders: [],
      total: 0,
      currentPage: page,
      totalPages: 0,
      pageSize,
    }
  }
}

/**
 * Fetch full order detail with items and timeline audit events.
 */
export async function getAdminOrderById(orderId: string): Promise<AdminOrderDetail | null> {
  try {
    const adminDb = createAdminClient()

    const { data: order, error } = await adminDb
      .from("orders")
      .select(
        `
        *,
        order_items (
          id,
          product_id,
          product_colour_id,
          variant_id,
          product_name,
          colour_name,
          style_code,
          size_label,
          sku,
          media_key,
          unit_price_fils,
          quantity,
          total_fils,
          is_final_sale
        ),
        order_events (
          id,
          event_type,
          from_status,
          to_status,
          note,
          actor_sub,
          created_at
        )
      `
      )
      .eq("id", orderId)
      .maybeSingle()

    if (error || !order) {
      console.error("Failed to fetch order by id:", error)
      return null
    }

    const items: AdminOrderItem[] = (order.order_items || []).map((it: any) => ({
      ...it,
      image_url: getCloudinaryUrl(it.media_key),
    }))

    const events: AdminOrderEvent[] = (order.order_events || []).sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return {
      ...order,
      items,
      events,
    } as AdminOrderDetail
  } catch (err) {
    console.error("getAdminOrderById exception:", err)
    return null
  }
}

/**
 * Update order status with timeline event and tracking data.
 */
export async function updateOrderStatusAction(input: {
  orderId: string
  newStatus: OrderStatus
  courier?: string
  trackingNumber?: string
  note?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = createAdminClient()

    // Get current order status
    const { data: current, error: getErr } = await adminDb
      .from("orders")
      .select("status")
      .eq("id", input.orderId)
      .single()

    if (getErr || !current) {
      return { success: false, error: "Order not found." }
    }

    const fromStatus = current.status
    const updatePayload: Record<string, unknown> = {
      status: input.newStatus,
      updated_at: new Date().toISOString(),
    }

    if (input.newStatus === "confirmed") {
      updatePayload.confirmed_at = new Date().toISOString()
    } else if (input.newStatus === "packed") {
      updatePayload.packed_at = new Date().toISOString()
    } else if (input.newStatus === "shipped") {
      updatePayload.shipped_at = new Date().toISOString()
      if (input.courier) updatePayload.courier = input.courier
      if (input.trackingNumber) updatePayload.tracking_number = input.trackingNumber
    } else if (input.newStatus === "delivered") {
      updatePayload.delivered_at = new Date().toISOString()
      // If COD, mark payment as paid upon delivery
      updatePayload.payment_status = "paid"
    } else if (input.newStatus === "cancelled") {
      updatePayload.cancelled_at = new Date().toISOString()
      if (input.note) updatePayload.cancellation_reason = input.note
    } else if (input.newStatus === "returned") {
      updatePayload.returned_at = new Date().toISOString()
    }

    const { error: updErr } = await adminDb
      .from("orders")
      .update(updatePayload)
      .eq("id", input.orderId)

    if (updErr) {
      return { success: false, error: updErr.message }
    }

    // Insert order event
    await adminDb.from("order_events").insert({
      order_id: input.orderId,
      event_type: `status_changed_to_${input.newStatus}`,
      from_status: fromStatus,
      to_status: input.newStatus,
      note: input.note || `Order status updated to ${input.newStatus}`,
      actor_sub: "admin",
    })

    // Trigger lifecycle emails asynchronously
    if (input.newStatus === "shipped") {
      void sendOrderShippedEmail(input.orderId, input.courier, input.trackingNumber).catch((e) =>
        console.warn("[Orders] Background shipped email error:", e)
      )
    } else if (input.newStatus === "cancelled") {
      void sendOrderCancelledEmail(input.orderId, input.note).catch((e) =>
        console.warn("[Orders] Background cancellation email error:", e)
      )
    }

    revalidatePath(`/admin/orders/${input.orderId}`)
    revalidatePath("/admin/orders")
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error updating order"
    return { success: false, error: msg }
  }
}

/**
 * Direct Stripe Card refund initiated by boutique admin.
 * - Confirms order was paid via card (payment_method === 'card', payment_status === 'paid').
 * - Finds payment_intent ID (directly from order, or retrieves checkout session to get payment_intent).
 * - Calls Stripe API: `stripe.refunds.create({ payment_intent, reason: 'requested_by_customer' })`.
 * - Inserts a record into `refunds` table.
 * - Updates `orders`:
 *     `payment_status: 'refunded'`
 *     `status: 'cancelled'` (if not already cancelled)
 *     `cancelled_at: order.cancelled_at || new Date().toISOString()`
 * - Inserts an audit event in `order_events`:
 *     `event_type: 'refund_processed'`
 *     `note: 'Processed full Stripe card refund of ' + formatAED(order.total_fils) + ' (Stripe Refund ID: ' + refund.id + ')'`
 * - Dispatches refund confirmation email to customer.
 * - Revalidates paths.
 */
export async function refundOrderViaStripeAction(input: {
  orderId: string
  reason?: string
}): Promise<{ success: boolean; error?: string; refundId?: string }> {
  try {
    // 0. Verify the signed-in user is an active admin.
    const admin = await requireAdmin()
    if (!admin) {
      return { success: false, error: "Unauthorized. Staff authentication required." }
    }

    const adminDb = createAdminClient()

    // 1. Fetch order
    const { data: order, error: orderErr } = await adminDb
      .from("orders")
      .select("id, order_number, customer_name, email, payment_method, payment_status, total_fils, status, stripe_payment_intent_id, stripe_session_id, cancelled_at")
      .eq("id", input.orderId)
      .maybeSingle()

    if (orderErr || !order) {
      return { success: false, error: "Order not found." }
    }

    if (order.payment_method !== "card") {
      return { success: false, error: "This order was not placed with an online card payment." }
    }

    if (order.payment_status === "refunded") {
      return { success: false, error: "This order has already been refunded." }
    }

    if (order.payment_status !== "paid") {
      return { success: false, error: `Order payment status is '${order.payment_status}'. Only paid orders can be refunded.` }
    }

    const stripe = getStripeServer()
    let paymentIntentId = order.stripe_payment_intent_id

    // Fallback: If payment_intent_id is not directly stored on the order, retrieve it from the Stripe Checkout Session
    if (!paymentIntentId && order.stripe_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)
        if (typeof session.payment_intent === "string") {
          paymentIntentId = session.payment_intent
        } else if (session.payment_intent && typeof session.payment_intent === "object") {
          paymentIntentId = session.payment_intent.id
        }
      } catch (err) {
        console.warn("[Stripe Refund] Session lookup error:", err)
      }
    }

    if (!paymentIntentId) {
      return {
        success: false,
        error: "Unable to find Stripe Payment Intent ID for this order. Please verify in Stripe Dashboard.",
      }
    }

    // 2. Execute live refund via Stripe API with idempotency key
    const refundReason = input.reason?.trim() || "Customer cancellation refund"
    let stripeRefund
    try {
      stripeRefund = await stripe.refunds.create(
        {
          payment_intent: paymentIntentId,
          reason: "requested_by_customer",
          metadata: {
            order_id: order.id,
            order_number: order.order_number,
            customer_email: order.email,
            admin_reason: refundReason,
            admin_user_id: admin.id,
          },
        },
        {
          idempotencyKey: `ref_order_${order.id}_${order.total_fils}_${paymentIntentId}`,
        }
      )
    } catch (stripeErr: unknown) {
      console.error("[Stripe Refund] API error:", stripeErr)
      return {
        success: false,
        error: `Stripe refund failed: ${stripeErr instanceof Error ? stripeErr.message : "Unknown error"}`,
      }
    }

    if (!stripeRefund || stripeRefund.status === "failed") {
      return { success: false, error: "Stripe declined the refund request. Please check Stripe dashboard." }
    }

    const refundDbStatus = stripeRefund.status === "succeeded" ? "succeeded" : "pending"

    // 3. Insert record into `refunds` table
    const { error: refInsertErr } = await adminDb.from("refunds").insert({
      order_id: order.id,
      amount_fils: order.total_fils,
      method: "card",
      status: refundDbStatus,
      stripe_refund_id: stripeRefund.id,
      reason: refundReason,
      processed_by: admin.email || admin.id,
    })

    if (refInsertErr) {
      console.error("[Stripe Refund] Failed to insert refund record:", refInsertErr)
    }

    // 4. Update order payment status and cancellation status
    if (refundDbStatus === "succeeded") {
      const updatePayload: Record<string, unknown> = {
        payment_status: "refunded",
        updated_at: new Date().toISOString(),
      }
      if (order.status !== "cancelled") {
        updatePayload.status = "cancelled"
        updatePayload.cancelled_at = order.cancelled_at || new Date().toISOString()
        updatePayload.cancellation_reason = refundReason
      }
      await adminDb.from("orders").update(updatePayload).eq("id", order.id)
    }

    // 5. Record audit event in order_events
    const formattedAmount = formatAED(order.total_fils)
    await adminDb.from("order_events").insert({
      order_id: order.id,
      event_type: refundDbStatus === "succeeded" ? "refund_processed" : "refund_pending",
      from_status: order.status,
      to_status: refundDbStatus === "succeeded" ? "cancelled" : order.status,
      note: `Full Stripe card refund of ${formattedAmount} ${refundDbStatus === "succeeded" ? "processed" : "submitted and pending"}. (Stripe Refund ID: ${stripeRefund.id})`,
      actor_sub: admin.id,
    })

    if (refundDbStatus === "succeeded") {
      void sendRefundConfirmationEmail({
        orderId: order.id,
        amountFils: order.total_fils,
        method: "card",
      }).catch((e) => console.warn("[Stripe Refund] Email error:", e))
    }

    revalidatePath(`/admin/orders/${order.id}`)
    revalidatePath("/admin/orders")

    return { success: true, refundId: stripeRefund.id }
  } catch (err: unknown) {
    console.error("[Stripe Refund] Exception:", err)
    const msg = err instanceof Error ? err.message : "Error processing Stripe refund"
    return { success: false, error: msg }
  }
}

/**
 * Update internal admin notes on order.
 */
export async function updateOrderNotesAction(
  orderId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = createAdminClient()
    const { error } = await adminDb
      .from("orders")
      .update({
        internal_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/admin/orders/${orderId}`)
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error updating notes"
    return { success: false, error: msg }
  }
}

/**
 * Admin action to resend the order confirmation email to the customer.
 */
export async function resendOrderConfirmationEmailAction(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await sendOrderConfirmationEmail(orderId)
    if (!result.success) {
      return { success: false, error: result.error || "Failed to dispatch email via Resend" }
    }
    revalidatePath(`/admin/orders/${orderId}`)
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error sending email"
    return { success: false, error: msg }
  }
}

export type ResendEmailTemplate = "confirmation" | "shipped" | "cancelled"

export interface ResendOrderEmailInput {
  orderId: string
  emailType: ResendEmailTemplate
  recipientEmail?: string
  updateOrderEmail?: boolean
  courier?: string
  trackingNumber?: string
  cancellationReason?: string
}

/**
 * Enhanced action to resend customer notification emails (Confirmation, Shipped, or Cancelled)
 * with recipient confirmation/override and optional database email synchronisation.
 */
export async function resendOrderEmailAction(
  input: ResendOrderEmailInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = createAdminClient()
    const targetEmail = input.recipientEmail?.trim()

    if (targetEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(targetEmail)) {
        return { success: false, error: "Please provide a valid recipient email address." }
      }

      if (input.updateOrderEmail) {
        await adminDb
          .from("orders")
          .update({
            email: targetEmail.toLowerCase(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", input.orderId)
      }
    }

    let result: { success: boolean; error?: string }

    if (input.emailType === "confirmation") {
      result = await sendOrderConfirmationEmail(input.orderId, targetEmail)
    } else if (input.emailType === "shipped") {
      result = await sendOrderShippedEmail(
        input.orderId,
        input.courier,
        input.trackingNumber,
        targetEmail
      )
    } else if (input.emailType === "cancelled") {
      result = await sendOrderCancelledEmail(
        input.orderId,
        input.cancellationReason,
        targetEmail
      )
    } else {
      return { success: false, error: "Unknown email template." }
    }

    if (!result.success) {
      return { success: false, error: result.error || "Failed to dispatch email via Resend." }
    }

    revalidatePath(`/admin/orders/${input.orderId}`)
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error dispatching email"
    return { success: false, error: msg }
  }
}

