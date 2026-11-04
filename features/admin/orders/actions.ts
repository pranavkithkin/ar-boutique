"use server"

import "server-only"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import {
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderCancelledEmail,
} from "@/lib/email"
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
          id
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
      item_count: Array.isArray(o.order_items) ? o.order_items.length : 0,
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

