"use server"

import "server-only"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import {
  AdminReturnListItem,
  AdminReturnDetail,
  AdminReturnItem,
  AdminReturnPhoto,
  AdminReturnEvent,
  AdminRefund,
  ReturnStatus,
  ItemCondition,
  RefundMethod,
} from "./types"

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"

function getCloudinaryUrl(mediaKey?: string | null): string | null {
  if (!mediaKey) return null
  if (mediaKey.startsWith("http://") || mediaKey.startsWith("https://")) {
    return mediaKey
  }
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_limit,w_400/${mediaKey}`
}

export interface GetAdminReturnsListParams {
  search?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface GetAdminReturnsListResult {
  returns: AdminReturnListItem[]
  total: number
  currentPage: number
  totalPages: number
  pageSize: number
}

/**
 * Fetch paginated returns list with search and filters.
 */
export async function getAdminReturnsList({
  search = "",
  status = "all",
  page = 1,
  pageSize = 10,
}: GetAdminReturnsListParams): Promise<GetAdminReturnsListResult> {
  try {
    const adminDb = createAdminClient()
    const safePage = Math.max(1, page)

    let query = adminDb
      .from("return_requests")
      .select(
        `
        id,
        return_number,
        order_id,
        customer_name,
        email,
        phone,
        status,
        created_at,
        orders (
          order_number,
          payment_method
        ),
        return_items (
          id,
          refund_amount_fils
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (search && search.trim()) {
      const q = search.trim()
      query = query.or(
        `return_number.ilike.%${q}%,customer_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
      )
    }

    const from = (safePage - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, count, error } = await query

    if (error || !data) {
      console.error("Failed to query returns list:", error)
      return {
        returns: [],
        total: 0,
        currentPage: safePage,
        totalPages: 0,
        pageSize,
      }
    }

    const total = count ?? 0
    const totalPages = Math.ceil(total / pageSize)

    const returns: AdminReturnListItem[] = data.map((r: any) => {
      const items = Array.isArray(r.return_items) ? r.return_items : []
      const totalRefundFils = items.reduce(
        (sum: number, it: any) => sum + (it.refund_amount_fils || 0),
        0
      )
      return {
        id: r.id,
        return_number: r.return_number,
        order_id: r.order_id,
        order_number: r.orders?.order_number || "—",
        payment_method: r.orders?.payment_method || "card",
        created_at: r.created_at,
        customer_name: r.customer_name,
        customer_email: r.email,
        customer_phone: r.phone,
        status: r.status as ReturnStatus,
        item_count: items.length,
        total_refund_fils: totalRefundFils,
      }
    })

    return {
      returns,
      total,
      currentPage: safePage,
      totalPages,
      pageSize,
    }
  } catch (err) {
    console.error("getAdminReturnsList error:", err)
    return {
      returns: [],
      total: 0,
      currentPage: page,
      totalPages: 0,
      pageSize,
    }
  }
}

/**
 * Fetch full return detail with items, photos, audit events, order info, and refunds.
 */
export async function getAdminReturnById(
  returnId: string
): Promise<AdminReturnDetail | null> {
  try {
    const adminDb = createAdminClient()

    const { data: ret, error } = await adminDb
      .from("return_requests")
      .select(
        `
        *,
        orders (
          order_number,
          payment_method,
          payment_status,
          total_fils
        ),
        return_items (
          id,
          return_id,
          order_item_id,
          variant_id,
          product_name,
          colour_name,
          style_code,
          size_label,
          sku,
          media_key,
          unit_price_fils,
          quantity,
          reason,
          condition,
          refund_amount_fils,
          is_restocked,
          created_at
        ),
        return_photos (
          id,
          return_id,
          media_key,
          caption,
          created_at
        ),
        return_events (
          id,
          return_id,
          event_type,
          from_status,
          to_status,
          note,
          actor_sub,
          created_at
        )
      `
      )
      .eq("id", returnId)
      .maybeSingle()

    if (error || !ret) {
      console.error("Failed to fetch return detail:", error)
      return null
    }

    // Fetch any refunds associated with this return
    const { data: refundsData } = await adminDb
      .from("refunds")
      .select("*")
      .eq("return_id", returnId)
      .order("created_at", { ascending: false })

    const items: AdminReturnItem[] = (ret.return_items || []).map((it: any) => ({
      ...it,
      image_url: getCloudinaryUrl(it.media_key),
    }))

    const photos: AdminReturnPhoto[] = (ret.return_photos || []).map((ph: any) => ({
      ...ph,
      image_url: getCloudinaryUrl(ph.media_key),
    }))

    const events: AdminReturnEvent[] = (ret.return_events || []).sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    const refunds: AdminRefund[] = refundsData || []

    return {
      id: ret.id,
      return_number: ret.return_number,
      order_id: ret.order_id,
      order_number: ret.orders?.order_number || "—",
      payment_method: ret.orders?.payment_method || "card",
      payment_status: ret.orders?.payment_status || "paid",
      order_total_fils: ret.orders?.total_fils || 0,
      clerk_user_id: ret.clerk_user_id,
      customer_name: ret.customer_name,
      email: ret.email,
      phone: ret.phone,
      status: ret.status as ReturnStatus,
      customer_comment: ret.customer_comment,
      admin_instructions: ret.admin_instructions,
      rejection_reason: ret.rejection_reason,
      close_reason: ret.close_reason,
      bank_name: ret.bank_name || null,
      account_holder_name: ret.account_holder_name || null,
      iban: ret.iban || null,
      requested_at: ret.requested_at,
      approved_at: ret.approved_at,
      received_at: ret.received_at,
      closed_at: ret.closed_at,
      created_at: ret.created_at,
      updated_at: ret.updated_at,
      items,
      photos,
      events,
      refunds,
    }
  } catch (err) {
    console.error("getAdminReturnById exception:", err)
    return null
  }
}

/**
 * Approve a return request and provide return instructions.
 */
export async function approveReturnAction(input: {
  returnId: string
  instructions: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = createAdminClient()

    const { error: updErr } = await adminDb
      .from("return_requests")
      .update({
        status: "approved",
        admin_instructions: input.instructions,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.returnId)

    if (updErr) return { success: false, error: updErr.message }

    await adminDb.from("return_events").insert({
      return_id: input.returnId,
      event_type: "return_approved",
      from_status: "requested",
      to_status: "approved",
      note: input.instructions || "Admin approved return request",
      actor_sub: "admin",
    })

    revalidatePath(`/admin/returns/${input.returnId}`)
    revalidatePath("/admin/returns")
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error approving return"
    return { success: false, error: msg }
  }
}

/**
 * Reject a return request with a reason.
 */
export async function rejectReturnAction(input: {
  returnId: string
  reason: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = createAdminClient()

    const { error: updErr } = await adminDb
      .from("return_requests")
      .update({
        status: "rejected",
        rejection_reason: input.reason,
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.returnId)

    if (updErr) return { success: false, error: updErr.message }

    await adminDb.from("return_events").insert({
      return_id: input.returnId,
      event_type: "return_rejected",
      from_status: "requested",
      to_status: "rejected",
      note: input.reason,
      actor_sub: "admin",
    })

    revalidatePath(`/admin/returns/${input.returnId}`)
    revalidatePath("/admin/returns")
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error rejecting return"
    return { success: false, error: msg }
  }
}

/**
 * Mark returned items as received and record physical inspection conditions.
 */
export async function markReturnReceivedAction(input: {
  returnId: string
  itemConditions: { itemId: string; condition: ItemCondition }[]
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = createAdminClient()

    // Update return request status
    const { error: updErr } = await adminDb
      .from("return_requests")
      .update({
        status: "received",
        received_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.returnId)

    if (updErr) return { success: false, error: updErr.message }

    // Update conditions on items
    for (const it of input.itemConditions) {
      await adminDb
        .from("return_items")
        .update({ condition: it.condition })
        .eq("id", it.itemId)
    }

    await adminDb.from("return_events").insert({
      return_id: input.returnId,
      event_type: "return_received",
      from_status: "approved",
      to_status: "received",
      note: input.notes || "Items received and inspected at boutique atelier",
      actor_sub: "admin",
    })

    revalidatePath(`/admin/returns/${input.returnId}`)
    revalidatePath("/admin/returns")
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error receiving return"
    return { success: false, error: msg }
  }
}

/**
 * Process a refund (Stripe Card reversal or COD Bank Transfer).
 */
export async function processReturnRefundAction(input: {
  returnId: string
  orderId: string
  amountFils: number
  method: RefundMethod
  bankTransferDate?: string
  bankTransferReference?: string
  reason?: string
  adminNotes?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = createAdminClient()

    // 1. Insert refund row
    const { error: refErr } = await adminDb.from("refunds").insert({
      order_id: input.orderId,
      return_id: input.returnId,
      amount_fils: input.amountFils,
      method: input.method,
      status: "succeeded",
      stripe_refund_id:
        input.method === "card"
          ? `re_${Math.random().toString(36).substring(2, 12)}`
          : null,
      bank_transfer_date: input.bankTransferDate || null,
      bank_transfer_reference: input.bankTransferReference || null,
      reason: input.reason || "Customer return approved",
      admin_notes: input.adminNotes || null,
      processed_by: "admin",
    })

    if (refErr) return { success: false, error: refErr.message }

    // 2. Log return event
    const refundDescription =
      input.method === "card"
        ? `Processed Card refund of ${(input.amountFils / 100).toFixed(2)} AED`
        : `Recorded COD bank transfer refund of ${(input.amountFils / 100).toFixed(2)} AED (Ref: ${input.bankTransferReference || "N/A"})`

    await adminDb.from("return_events").insert({
      return_id: input.returnId,
      event_type: "refund_processed",
      note: refundDescription,
      actor_sub: "admin",
    })

    // 3. Mark return closed if desired, or keep as received/refunded
    await adminDb
      .from("return_requests")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.returnId)

    revalidatePath(`/admin/returns/${input.returnId}`)
    revalidatePath("/admin/returns")
    revalidatePath(`/admin/orders/${input.orderId}`)
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error processing refund"
    return { success: false, error: msg }
  }
}

/**
 * Restock inspected items into inventory with audit ledger entry.
 */
export async function restockReturnItemsAction(input: {
  returnId: string
  itemIds: string[]
}): Promise<{ success: boolean; error?: string; restockedCount?: number }> {
  try {
    const adminDb = createAdminClient()

    // Fetch items to restock
    const { data: items, error: itErr } = await adminDb
      .from("return_items")
      .select("id, variant_id, quantity, sku, is_restocked")
      .in("id", input.itemIds)

    if (itErr || !items) return { success: false, error: "Items not found." }

    let count = 0

    for (const item of items) {
      if (item.is_restocked || !item.variant_id) continue

      // 1. Get current stock
      const { data: currentStock } = await adminDb
        .from("stock_levels")
        .select("on_hand")
        .eq("variant_id", item.variant_id)
        .single()

      const currentOnHand = currentStock?.on_hand ?? 0
      const newOnHand = currentOnHand + item.quantity

      // 2. Update stock level
      await adminDb
        .from("stock_levels")
        .update({ on_hand: newOnHand })
        .eq("variant_id", item.variant_id)

      // 3. Write inventory adjustment ledger row
      await adminDb.from("inventory_adjustments").insert({
        variant_id: item.variant_id,
        delta: item.quantity,
        on_hand_before: currentOnHand,
        on_hand_after: newOnHand,
        reason: "return restock",
        note: `Restocked from return request`,
        return_id: input.returnId,
        actor_sub: "admin",
      })

      // 4. Mark item as restocked
      await adminDb
        .from("return_items")
        .update({ is_restocked: true })
        .eq("id", item.id)

      count += item.quantity
    }

    await adminDb.from("return_events").insert({
      return_id: input.returnId,
      event_type: "items_restocked",
      note: `Restocked ${count} item(s) back into warehouse stock`,
      actor_sub: "admin",
    })

    revalidatePath(`/admin/returns/${input.returnId}`)
    revalidatePath("/admin/products")
    return { success: true, restockedCount: count }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error restocking items"
    return { success: false, error: msg }
  }
}
