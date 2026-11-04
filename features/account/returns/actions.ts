"use server"

import "server-only"
import { revalidatePath } from "next/cache"
import crypto from "crypto"
import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/server"
import { isClerkConfigured } from "@/lib/clerk"
import { getCurrentCustomerAction } from "@/features/auth/actions"
import { sendReturnRequestedEmails } from "@/lib/email"
import {
  customerReturnFormSchema,
  type CustomerReturnFormValues,
} from "./schemas"
import {
  evaluateOrderReturnEligibility,
  type OrderForEligibility,
} from "./eligibility"
import type { CustomerReturnRequest, CustomerReturnItem } from "./types"

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"

function getCloudinaryUrl(mediaKey?: string | null): string | null {
  if (!mediaKey) return null
  if (mediaKey.startsWith("http://") || mediaKey.startsWith("https://")) {
    return mediaKey
  }
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_limit,w_400/${mediaKey}`
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return isoString
  }
}

function mapStatusToLabel(status: string): string {
  switch (status) {
    case "approved":
      return "Approved — Awaiting Courier Pickup"
    case "received":
      return "Received at Atelier — Inspecting"
    case "rejected":
      return "Return Rejected"
    case "closed":
      return "Completed & Refunded"
    case "requested":
    default:
      return "Request Submitted"
  }
}

/**
 * Upload a customer garment condition photo to Cloudinary
 */
export async function uploadReturnPhotoAction(
  formData: FormData
): Promise<{ success: boolean; error?: string; mediaKey?: string; url?: string }> {
  const file = formData.get("file") as File | null
  if (!file) {
    return { success: false, error: "No photo provided." }
  }

  // Validate file type
  const validTypes = ["image/jpeg", "image/png", "image/webp"]
  if (!validTypes.includes(file.type)) {
    return {
      success: false,
      error: "Please upload a valid image file (JPEG, PNG, or WebP).",
    }
  }

  // Validate size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "Image file exceeds 10MB limit." }
  }

  const folder = `${process.env.CLOUDINARY_FOLDER || "ar-dev"}/returns/photos`
  const apiKey = process.env.CLOUDINARY_API_KEY || "822299811143611"
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "EjPgkhLeSanX8bJ1N7VrlfaDeLU"

  const publicId = `ret-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  const timestamp = Math.floor(Date.now() / 1000)
  const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
  const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex")

  try {
    const uploadForm = new FormData()
    uploadForm.append("file", file)
    uploadForm.append("api_key", apiKey)
    uploadForm.append("timestamp", timestamp.toString())
    uploadForm.append("folder", folder)
    uploadForm.append("public_id", publicId)
    uploadForm.append("signature", signature)

    const cRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadForm,
      }
    )

    const cData = await cRes.json()
    if (!cRes.ok || !cData.public_id) {
      console.error("Cloudinary return photo upload error:", cData)
      return {
        success: false,
        error: cData.error?.message || "Failed to upload photo to Cloudinary.",
      }
    }

    return {
      success: true,
      mediaKey: cData.public_id,
      url: cData.secure_url || getCloudinaryUrl(cData.public_id) || undefined,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Upload failed"
    console.error("uploadReturnPhotoAction error:", msg)
    return { success: false, error: msg }
  }
}

/**
 * Fetch all return requests submitted by or associated with a customer email
 */
export async function getCustomerReturnsAction(
  email: string
): Promise<{ success: boolean; returns?: CustomerReturnRequest[]; error?: string }> {
  const cleanEmail = email.toLowerCase().trim()
  if (!cleanEmail) {
    return { success: false, error: "Email required to fetch returns" }
  }

  try {
    const adminDb = createAdminClient()

    const { data: rawReturns, error } = await adminDb
      .from("return_requests")
      .select(
        `
        id,
        return_number,
        order_id,
        status,
        customer_comment,
        admin_instructions,
        rejection_reason,
        bank_name,
        account_holder_name,
        iban,
        created_at,
        orders (
          order_number
        ),
        return_items (
          id,
          order_item_id,
          variant_id,
          product_name,
          colour_name,
          size_label,
          sku,
          quantity,
          unit_price_fils,
          refund_amount_fils,
          reason,
          condition,
          media_key
        ),
        return_photos (
          id,
          media_key,
          caption
        )
      `
      )
      .ilike("email", cleanEmail)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to query customer returns:", error)
      return { success: false, error: error.message }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const returns: CustomerReturnRequest[] = (rawReturns || []).map((r: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: CustomerReturnItem[] = (r.return_items || []).map((it: any) => ({
        id: it.id,
        orderItemId: it.order_item_id,
        variantId: it.variant_id || undefined,
        productName: it.product_name,
        colourName: it.colour_name,
        sizeLabel: it.size_label,
        sku: it.sku,
        quantity: it.quantity,
        unitPriceFils: it.unit_price_fils,
        refundAmountFils: it.refund_amount_fils,
        reason: it.reason,
        condition: it.condition || undefined,
        mediaKey: it.media_key || undefined,
      }))

      const totalRefundFils = items.reduce(
        (sum, it) => sum + (it.refundAmountFils || it.unitPriceFils * it.quantity),
        0
      )

      return {
        id: r.id,
        returnNumber: r.return_number || `RET-${r.id.slice(0, 4)}`,
        orderId: r.order_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orderNumber: (r.orders as any)?.order_number || "Order",
        status: r.status,
        statusLabel: mapStatusToLabel(r.status),
        createdAt: formatDate(r.created_at),
        customerComment: r.customer_comment || undefined,
        adminInstructions: r.admin_instructions || undefined,
        rejectionReason: r.rejection_reason || undefined,
        bankName: r.bank_name || undefined,
        accountHolderName: r.account_holder_name || undefined,
        iban: r.iban || undefined,
        totalRefundFils,
        items,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        photos: (r.return_photos || []).map((p: any) => ({
          id: p.id,
          mediaKey: p.media_key,
          caption: p.caption || undefined,
        })),
      }
    })

    return { success: true, returns }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load returns"
    console.error("getCustomerReturnsAction error:", msg)
    return { success: false, error: msg }
  }
}

/**
 * Fetch a single customer return request with full timeline events, items, photos, and refunds.
 */
export async function getCustomerReturnDetailsAction(
  returnIdentifier: string,
  customerEmail: string
): Promise<{ success: boolean; returnRequest?: CustomerReturnRequest; error?: string }> {
  const cleanEmail = customerEmail.toLowerCase().trim()
  const cleanId = returnIdentifier.trim()

  if (!cleanEmail || !cleanId) {
    return { success: false, error: "Return identifier and customer email required." }
  }

  try {
    const adminDb = createAdminClient()

    let query = adminDb
      .from("return_requests")
      .select(
        `
        id,
        return_number,
        order_id,
        status,
        customer_comment,
        admin_instructions,
        rejection_reason,
        bank_name,
        account_holder_name,
        iban,
        created_at,
        email,
        orders (
          order_number
        ),
        return_items (
          id,
          order_item_id,
          variant_id,
          product_name,
          colour_name,
          size_label,
          sku,
          quantity,
          unit_price_fils,
          refund_amount_fils,
          reason,
          condition,
          media_key
        ),
        return_photos (
          id,
          media_key,
          caption
        ),
        return_events (
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
      .ilike("email", cleanEmail)

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)
    if (isUuid) {
      query = query.eq("id", cleanId)
    } else {
      query = query.ilike("return_number", cleanId)
    }

    const { data: rawReturn, error } = await query.maybeSingle()

    if (error || !rawReturn) {
      console.warn("Return lookup failed:", error || "not found")
      return { success: false, error: "Return request not found or unauthorized." }
    }

    // Also fetch any issued refunds for this return
    const { data: refundsData } = await adminDb
      .from("refunds")
      .select("id, amount_fils, method, status, bank_transfer_date, bank_transfer_reference, created_at")
      .eq("return_id", rawReturn.id)
      .order("created_at", { ascending: false })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: CustomerReturnItem[] = (rawReturn.return_items || []).map((it: any) => ({
      id: it.id,
      orderItemId: it.order_item_id,
      variantId: it.variant_id || undefined,
      productName: it.product_name,
      colourName: it.colour_name,
      sizeLabel: it.size_label,
      sku: it.sku,
      quantity: it.quantity,
      unitPriceFils: it.unit_price_fils,
      refundAmountFils: it.refund_amount_fils,
      reason: it.reason,
      condition: it.condition || undefined,
      mediaKey: it.media_key || undefined,
    }))

    const totalRefundFils = items.reduce(
      (sum, it) => sum + (it.refundAmountFils || it.unitPriceFils * it.quantity),
      0
    )

    // Format events chronologically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events = (rawReturn.return_events || []).map((ev: any) => ({
      id: ev.id,
      eventType: ev.event_type,
      fromStatus: ev.from_status,
      toStatus: ev.to_status,
      note: ev.note,
      createdAt: formatDate(ev.created_at),
    })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const refunds = (refundsData || []).map((rf: any) => ({
      id: rf.id,
      amountFils: rf.amount_fils,
      method: rf.method,
      status: rf.status,
      bankTransferDate: rf.bank_transfer_date ? formatDate(rf.bank_transfer_date) : null,
      bankTransferReference: rf.bank_transfer_reference,
      createdAt: formatDate(rf.created_at),
    }))

    const returnRequest: CustomerReturnRequest = {
      id: rawReturn.id,
      returnNumber: rawReturn.return_number || `RET-${rawReturn.id.slice(0, 4)}`,
      orderId: rawReturn.order_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      orderNumber: (rawReturn.orders as any)?.order_number || "Order",
      status: rawReturn.status,
      statusLabel: mapStatusToLabel(rawReturn.status),
      createdAt: formatDate(rawReturn.created_at),
      customerComment: rawReturn.customer_comment || undefined,
      adminInstructions: rawReturn.admin_instructions || undefined,
      rejectionReason: rawReturn.rejection_reason || undefined,
      bankName: rawReturn.bank_name || undefined,
      accountHolderName: rawReturn.account_holder_name || undefined,
      iban: rawReturn.iban || undefined,
      totalRefundFils,
      items,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      photos: (rawReturn.return_photos || []).map((p: any) => ({
        id: p.id,
        mediaKey: p.media_key,
        caption: p.caption || undefined,
      })),
      events,
      refunds,
    }

    return { success: true, returnRequest }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load return details"
    console.error("getCustomerReturnDetailsAction error:", msg)
    return { success: false, error: msg }
  }
}

/**
 * Allow a customer to cancel an unapproved/pending return request.
 */
export async function cancelCustomerReturnAction(
  returnId: string,
  customerEmail: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = customerEmail.toLowerCase().trim()
  if (!returnId || !cleanEmail) {
    return { success: false, error: "Invalid cancellation request." }
  }

  try {
    const adminDb = createAdminClient()

    // 1. Verify return ownership and state
    const { data: ret, error: fetchErr } = await adminDb
      .from("return_requests")
      .select("id, status, email, return_number")
      .eq("id", returnId)
      .ilike("email", cleanEmail)
      .maybeSingle()

    if (fetchErr || !ret) {
      return { success: false, error: "Return request not found or unauthorized." }
    }

    if (ret.status !== "requested") {
      return {
        success: false,
        error: `Cannot cancel return in '${ret.status}' status. Only pending requests can be cancelled.`,
      }
    }

    const nowIso = new Date().toISOString()

    // 2. Update status to rejected with close_reason 'cancelled_by_customer'
    const { error: updateErr } = await adminDb
      .from("return_requests")
      .update({
        status: "rejected",
        rejection_reason: "Cancelled by customer online.",
        close_reason: "Customer withdrew return request",
        updated_at: nowIso,
      })
      .eq("id", returnId)

    if (updateErr) {
      return { success: false, error: "Failed to update return status." }
    }

    // 3. Log event
    await adminDb.from("return_events").insert({
      return_id: returnId,
      event_type: "return_cancelled_by_customer",
      from_status: "requested",
      to_status: "rejected",
      note: "Customer cancelled the return request from their account portal.",
      actor_sub: cleanEmail,
      created_at: nowIso,
    })

    revalidatePath("/account")
    revalidatePath("/admin/returns")
    revalidatePath(`/account/returns/${ret.return_number}`)

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Cancellation failed"
    return { success: false, error: msg }
  }
}

/**
 * Generate gapless sequential return number: RET-1001, RET-1002, etc.
 */
async function getNextReturnNumber(): Promise<string> {
  const adminDb = createAdminClient()
  try {
    const { data } = await adminDb
      .from("return_requests")
      .select("return_number")
      .order("created_at", { ascending: false })
      .limit(50)

    let maxNum = 1000
    if (data && data.length > 0) {
      for (const row of data) {
        if (row.return_number && row.return_number.startsWith("RET-")) {
          const num = parseInt(row.return_number.replace("RET-", ""), 10)
          if (!isNaN(num) && num > maxNum) {
            maxNum = num
          }
        }
      }
    }
    return `RET-${maxNum + 1}`
  } catch {
    return `RET-${Date.now().toString().slice(-4)}`
  }
}

/**
 * Submit a customer return request online
 */
export async function submitCustomerReturnAction(
  data: CustomerReturnFormValues
): Promise<{ success: boolean; returnNumber?: string; returnId?: string; error?: string }> {
  // 1. Zod validation
  const parsed = customerReturnFormSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid return submission details.",
    }
  }

  const payload = parsed.data
  const adminDb = createAdminClient()

  // 2. Identify customer
  let clerkUserId: string | null = null
  let customerEmail: string | null = null

  if (isClerkConfigured()) {
    const { userId } = await auth()
    clerkUserId = userId
  } else {
    const cust = await getCurrentCustomerAction()
    customerEmail = cust?.email || null
  }

  try {
    // 3. Fetch order to verify eligibility and ownership
    const { data: order, error: orderErr } = await adminDb
      .from("orders")
      .select(
        `
        id,
        order_number,
        clerk_user_id,
        email,
        customer_name,
        phone,
        status,
        payment_method,
        delivered_at,
        created_at,
        order_items (
          id,
          variant_id,
          product_name,
          colour_name,
          style_code,
          size_label,
          sku,
          quantity,
          unit_price_fils,
          is_final_sale,
          media_key
        )
      `
      )
      .eq("id", payload.orderId)
      .maybeSingle()

    if (orderErr || !order) {
      return { success: false, error: "Order not found." }
    }

    // Check ownership if authenticated
    if (customerEmail && order.email.toLowerCase() !== customerEmail.toLowerCase()) {
      return { success: false, error: "You are not authorized to return this order." }
    }

    // 4. Fetch existing return items for this order to check quantity eligibility
    const { data: existingReturns } = await adminDb
      .from("return_requests")
      .select(
        `
        id,
        status,
        return_items (
          order_item_id,
          quantity
        )
      `
      )
      .eq("order_id", order.id)

    const existingReturnedItems = (existingReturns || []).flatMap((r) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r.return_items || []).map((it: any) => ({
        orderItemId: it.order_item_id,
        quantity: it.quantity,
        status: r.status,
      }))
    )

    // Run pure eligibility verification
    const orderForCheck: OrderForEligibility = {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      deliveredAt: order.delivered_at,
      createdAt: order.created_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (order.order_items || []).map((it: any) => ({
        id: it.id,
        quantity: it.quantity,
        isFinalSale: it.is_final_sale,
      })),
    }

    const eligibility = evaluateOrderReturnEligibility(
      orderForCheck,
      existingReturnedItems
    )

    if (!eligibility.isEligible) {
      return {
        success: false,
        error:
          eligibility.ineligibleReason ||
          "This order is no longer eligible for a return.",
      }
    }

    // Validate each requested item quantity against remaining returnable quantity
    for (const reqItem of payload.items) {
      const itemElig = eligibility.items.find(
        (e) => e.orderItemId === reqItem.orderItemId
      )
      if (!itemElig || !itemElig.isEligible) {
        return {
          success: false,
          error: `Item "${reqItem.productName}" is not eligible for return.`,
        }
      }
      if (reqItem.quantity > itemElig.maxReturnableQuantity) {
        return {
          success: false,
          error: `Cannot return ${reqItem.quantity} units of "${reqItem.productName}". Maximum returnable is ${itemElig.maxReturnableQuantity}.`,
        }
      }
    }

    // 5. Generate gapless return number
    const returnNumber = await getNextReturnNumber()
    const nowIso = new Date().toISOString()

    // 6. Insert return_requests row
    const { data: insertedReturn, error: returnInsertErr } = await adminDb
      .from("return_requests")
      .insert({
        return_number: returnNumber,
        order_id: order.id,
        clerk_user_id: clerkUserId || order.clerk_user_id || null,
        customer_name: order.customer_name,
        email: order.email,
        phone: order.phone,
        status: "requested",
        customer_comment: payload.customerComment?.trim() || null,
        bank_name: payload.bankName?.trim() || null,
        account_holder_name: payload.accountHolderName?.trim() || null,
        iban: payload.iban ? payload.iban.replace(/\s+/g, "").toUpperCase() : null,
        requested_at: nowIso,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select("id, return_number")
      .single()

    if (returnInsertErr || !insertedReturn) {
      console.error("Failed to insert return_request:", returnInsertErr)
      return { success: false, error: "Failed to create return request record." }
    }

    const returnId = insertedReturn.id

    // 7. Insert return_items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderItemsMap = new Map((order.order_items || []).map((it: any) => [it.id, it]))

    const returnItemsToInsert = payload.items.map((it) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const original = orderItemsMap.get(it.orderItemId) as any
      const refundAmountFils = it.unitPriceFils * it.quantity

      return {
        return_id: returnId,
        order_item_id: it.orderItemId,
        variant_id: it.variantId || original?.variant_id || null,
        product_name: it.productName,
        colour_name: it.colourName,
        style_code: it.styleCode || original?.style_code || null,
        size_label: it.sizeLabel,
        sku: it.sku,
        media_key: it.mediaKey || original?.media_key || null,
        unit_price_fils: it.unitPriceFils,
        quantity: it.quantity,
        reason: it.reason,
        refund_amount_fils: refundAmountFils,
        condition: "pending_inspection",
        is_restocked: false,
        created_at: nowIso,
      }
    })

    const { error: itemsErr } = await adminDb
      .from("return_items")
      .insert(returnItemsToInsert)

    if (itemsErr) {
      console.error("Failed to insert return_items:", itemsErr)
      await adminDb.from("return_requests").delete().eq("id", returnId)
      return { success: false, error: "Failed to record return items." }
    }

    // 8. Insert return_photos if any
    if (payload.photoKeys && payload.photoKeys.length > 0) {
      const photosToInsert = payload.photoKeys.map((key) => ({
        return_id: returnId,
        media_key: key,
        caption: "Customer garment condition photo",
        created_at: nowIso,
      }))

      const { error: photosErr } = await adminDb
        .from("return_photos")
        .insert(photosToInsert)

      if (photosErr) {
        console.warn("Could not insert return photos:", photosErr)
      }
    }

    // 9. Insert initial audit trail in return_events
    const totalPieces = payload.items.reduce((sum, it) => sum + it.quantity, 0)
    await adminDb.from("return_events").insert({
      return_id: returnId,
      event_type: "return_requested",
      from_status: null,
      to_status: "requested",
      note: `Customer requested return online for ${totalPieces} piece(s). Reason: ${payload.items[0]?.reason || "Online Return"}`,
      actor_sub: clerkUserId || "customer",
      created_at: nowIso,
    })

    // Trigger return request confirmation & admin notification asynchronously
    void sendReturnRequestedEmails(returnId).catch((err) =>
      console.warn("[Returns] Background return email error:", err)
    )

    revalidatePath("/account")
    revalidatePath("/admin/returns")

    return {
      success: true,
      returnNumber: insertedReturn.return_number,
      returnId,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Return submission failed."
    console.error("submitCustomerReturnAction error:", msg)
    return { success: false, error: msg }
  }
}
