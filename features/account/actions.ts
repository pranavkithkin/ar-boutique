"use server"

import "server-only"
import { auth, currentUser } from "@clerk/nextjs/server"
import { isClerkConfigured } from "@/lib/clerk"
import { getCurrentCustomerAction } from "@/features/auth/actions"
import { createAdminClient } from "@/lib/supabase/server"
import { sendOrderCancelledEmail } from "@/lib/email"
import type { AccountAddress, AccountOrder, AccountOrderItem, AccountUserProfile } from "./types"

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

function mapStatusToAccount(rawStatus: string): {
  status: AccountOrder["status"]
  statusLabel: string
} {
  switch (rawStatus) {
    case "delivered":
      return { status: "delivered", statusLabel: "Delivered" }
    case "shipped":
      return { status: "shipped", statusLabel: "Out for Delivery" }
    case "packed":
      return { status: "packed", statusLabel: "Being Prepared" }
    case "confirmed":
      return { status: "confirmed", statusLabel: "Confirmed" }
    case "awaiting_confirmation":
      return { status: "pending", statusLabel: "Awaiting Confirmation" }
    case "pending":
      return { status: "pending", statusLabel: "Pending Confirmation" }
    case "cancelled":
      return { status: "cancelled", statusLabel: "Cancelled" }
    case "returned_to_sender":
      return { status: "cancelled", statusLabel: "Returned to Boutique" }
    default:
      return { status: "pending", statusLabel: "Pending" }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRawOrderToAccountOrder(order: any): AccountOrder {
  const { status, statusLabel } = mapStatusToAccount(order.status)

  const deliveryAddress: AccountAddress = {
    id: `addr_${order.id}`,
    label: `${order.area || order.emirate || "UAE"} Delivery`,
    isDefault: true,
    recipientName: order.customer_name || "Customer",
    phone: order.phone || "",
    emirate: order.emirate || "Dubai",
    area: order.area || "",
    street: order.street_address || "",
    building: order.building || "",
    apartment: order.apartment || undefined,
    landmark: order.landmark || undefined,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: AccountOrderItem[] = (order.order_items || []).map((it: any) => ({
    id: it.id,
    productName: it.product_name || "Boutique Garment",
    styleCode: it.style_code || it.sku || "AR",
    colourName: it.colour_name || "Editorial",
    sizeLabel: it.size_label || "One Size",
    quantity: it.quantity || 1,
    priceFils: it.unit_price_fils || 0,
    imageSrc: getCloudinaryUrl(it.media_key) || "",
  }))

  return {
    id: order.id,
    orderNumber: order.order_number || `AR-${order.id.slice(0, 4)}`,
    date: formatDate(order.created_at),
    createdAt: order.created_at || undefined,
    deliveredAt: order.delivered_at || undefined,
    status,
    statusLabel,
    trackingNumber: order.tracking_number || undefined,
    courierName: order.courier || order.courier_name || undefined,
    paymentMethod: order.payment_method === "cod" ? "cod" : "card",
    paymentStatus: order.payment_status || "pending",
    cancellationReason: order.cancellation_reason || undefined,
    subtotalFils: order.subtotal_fils || 0,
    deliveryFeeFils: order.delivery_fee_fils || 0,
    vatFils: order.vat_fils || 0,
    totalFils: order.total_fils || 0,
    deliveryAddress,
    items,
  }
}

export interface CustomerAccountDataResult {
  success: boolean
  error?: string
  profile?: AccountUserProfile
  orders?: AccountOrder[]
  addresses?: AccountAddress[]
}

/**
 * Fetch live orders, customer profile, and past delivery addresses from Supabase.
 */
export async function getCustomerAccountDataAction(
  email: string,
  fallbackInfo?: { fullName?: string; phone?: string | null }
): Promise<CustomerAccountDataResult> {
  const cleanEmail = email.toLowerCase().trim()
  if (!cleanEmail) {
    return { success: false, error: "Email is required to fetch account data" }
  }

  try {
    const adminDb = createAdminClient()

    // 1. Fetch Customer Record from `customers`
    const { data: customerRow } = await adminDb
      .from("customers")
      .select("id, full_name, email, phone, created_at, cod_disabled, notes")
      .ilike("email", cleanEmail)
      .maybeSingle()

    // 2. Fetch all orders matching this email
    const { data: rawOrders, error: ordersErr } = await adminDb
      .from("orders")
      .select(`
        id,
        order_number,
        created_at,
        delivered_at,
        email,
        customer_name,
        phone,
        emirate,
        area,
        street_address,
        building,
        apartment,
        landmark,
        status,
        payment_method,
        payment_status,
        subtotal_fils,
        delivery_fee_fils,
        vat_fils,
        total_fils,
        tracking_number,
        courier,
        order_items (
          id,
          product_name,
          colour_name,
          style_code,
          size_label,
          sku,
          quantity,
          unit_price_fils,
          total_fils,
          media_key
        )
      `)
      .ilike("email", cleanEmail)
      .order("created_at", { ascending: false })

    if (ordersErr) {
      console.error("Error fetching customer orders:", ordersErr)
    }

    const orders: AccountOrder[] = (rawOrders || []).map(mapRawOrderToAccountOrder)

    // 3. Extract unique addresses from past orders
    const addressMap = new Map<string, AccountAddress>()
    let addressIdx = 1

    for (const ord of rawOrders || []) {
      if (ord.emirate && ord.street_address) {
        const key = `${ord.emirate}-${ord.area || ""}-${ord.street_address}-${ord.building || ""}`.toLowerCase()
        if (!addressMap.has(key)) {
          addressMap.set(key, {
            id: `addr_saved_${addressIdx++}`,
            label: addressIdx === 2 ? "Primary Residence" : `${ord.area || ord.emirate} Address`,
            isDefault: addressIdx === 2,
            recipientName: ord.customer_name || customerRow?.full_name || "Customer",
            phone: ord.phone || customerRow?.phone || "",
            emirate: ord.emirate,
            area: ord.area || "",
            street: ord.street_address || "",
            building: ord.building || "",
            apartment: ord.apartment || undefined,
            landmark: ord.landmark || undefined,
          })
        }
      }
    }

    const addresses = Array.from(addressMap.values())

    // 4. Calculate VIP Tier from order history
    const totalSpendFils = orders.reduce((sum, o) => sum + o.totalFils, 0)
    const isVip = orders.length >= 3 || totalSpendFils >= 100000 // 1,000 AED in fils

    const rawFullName = (customerRow?.full_name || fallbackInfo?.fullName || "").trim()
    const nameParts = (rawFullName || cleanEmail.split("@")[0] || "Customer").split(" ")
    const firstName = nameParts[0] || "Customer"
    const lastName = nameParts.slice(1).join(" ") || ""
    const phone = customerRow?.phone || fallbackInfo?.phone || (orders[0]?.deliveryAddress.phone ?? "")

    // If customerRow was missing full_name, update it now
    if (customerRow && !customerRow.full_name && rawFullName) {
      try {
        await adminDb
          .from("customers")
          .update({ full_name: rawFullName, phone: phone || null })
          .eq("id", customerRow.id)
      } catch {
        // Non-critical update
      }
    }

    const profile: AccountUserProfile = {
      id: customerRow?.id || `user_${cleanEmail}`,
      firstName,
      lastName,
      email: cleanEmail,
      phone,
      memberSince: formatDate(customerRow?.created_at || new Date().toISOString()),
      tier: isVip ? "Boutique VIP" : "Member",
      preferredLanguage: "en",
      notifyWhatsApp: true,
      notifyEmail: true,
    }

    return {
      success: true,
      profile,
      orders,
      addresses,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load account data"
    console.error("getCustomerAccountDataAction error:", msg)
    return { success: false, error: msg }
  }
}

/**
 * Track a guest order using order number and email.
 */
export async function trackGuestOrderAction(
  orderNumber: string,
  email: string
): Promise<{ success: boolean; order?: AccountOrder; error?: string }> {
  const cleanOrderNum = orderNumber.trim().toUpperCase()
  const cleanEmail = email.toLowerCase().trim()

  if (!cleanOrderNum || !cleanEmail) {
    return { success: false, error: "Order number and email are both required" }
  }

  try {
    const adminDb = createAdminClient()

    const { data: rawOrder, error } = await adminDb
      .from("orders")
      .select(`
        id,
        order_number,
        created_at,
        delivered_at,
        email,
        customer_name,
        phone,
        emirate,
        area,
        street_address,
        building,
        apartment,
        landmark,
        status,
        payment_method,
        payment_status,
        subtotal_fils,
        delivery_fee_fils,
        vat_fils,
        total_fils,
        tracking_number,
        courier,
        order_items (
          id,
          product_name,
          colour_name,
          style_code,
          size_label,
          sku,
          quantity,
          unit_price_fils,
          total_fils,
          media_key
        )
      `)
      .ilike("order_number", cleanOrderNum)
      .ilike("email", cleanEmail)
      .maybeSingle()

    if (error || !rawOrder) {
      return {
        success: false,
        error: "No matching order found. Please check your order reference and email.",
      }
    }

    const order = mapRawOrderToAccountOrder(rawOrder)
    return { success: true, order }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lookup failed"
    return { success: false, error: msg }
  }
}

/**
 * Retrieve a single order by ID or order number, verifying customer authorization.
 */
export async function getCustomerOrderDetailsAction(
  orderIdOrNumber: string,
  userEmail?: string
): Promise<{ success: boolean; order?: AccountOrder; error?: string }> {
  const cleanParam = orderIdOrNumber.trim()
  if (!cleanParam) {
    return { success: false, error: "Order reference is required" }
  }

  // 1. Resolve authorized user email
  let authorizedEmail = userEmail?.toLowerCase().trim()

  if (!authorizedEmail) {
    if (isClerkConfigured()) {
      try {
        const { userId } = await auth()
        if (userId) {
          const clerkUser = await currentUser()
          authorizedEmail = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase().trim()
        }
      } catch {
        // Ignore
      }
    }

    if (!authorizedEmail) {
      try {
        const session = await getCurrentCustomerAction()
        authorizedEmail = session?.email?.toLowerCase().trim()
      } catch {
        // Ignore
      }
    }
  }

  if (!authorizedEmail) {
    return { success: false, error: "Authentication required to view order details" }
  }

  try {
    const adminDb = createAdminClient()

    let query = adminDb
      .from("orders")
      .select(`
        id,
        order_number,
        created_at,
        delivered_at,
        email,
        customer_name,
        phone,
        emirate,
        area,
        street_address,
        building,
        apartment,
        landmark,
        status,
        payment_method,
        payment_status,
        subtotal_fils,
        delivery_fee_fils,
        vat_fils,
        total_fils,
        tracking_number,
        courier,
        order_items (
          id,
          product_name,
          colour_name,
          style_code,
          size_label,
          sku,
          quantity,
          unit_price_fils,
          total_fils,
          media_key
        )
      `)
      .ilike("email", authorizedEmail)

    // Match by UUID or order_number
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanParam)
    if (isUuid) {
      query = query.eq("id", cleanParam)
    } else {
      query = query.ilike("order_number", cleanParam)
    }

    const { data: rawOrder, error } = await query.maybeSingle()

    if (error || !rawOrder) {
      return { success: false, error: "Order not found or unauthorized" }
    }

    const order = mapRawOrderToAccountOrder(rawOrder)
    return { success: true, order }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load order"
    return { success: false, error: msg }
  }
}

/**
 * Customer-initiated cancellation request for an open, unfulfilled order.
 * - Confirms customer authorization.
 * - Ensures order is pre-shipment (not shipped, delivered, or already cancelled).
 * - Updates order status to "cancelled" and records customer reason.
 * - Releases reserved inventory in `stock_levels`.
 * - Records audit timeline event in `order_events`.
 * - Dispatches cancellation confirmation email.
 */
export async function cancelCustomerOrderAction(input: {
  orderIdOrNumber: string
  reason: string
  userEmail?: string
}): Promise<{ success: boolean; error?: string }> {
  const cleanParam = input.orderIdOrNumber.trim()
  const cleanReason = (input.reason || "Customer requested cancellation").trim()

  if (!cleanParam) {
    return { success: false, error: "Order reference is required." }
  }

  // 1. Resolve authorized user email
  let authorizedEmail = input.userEmail?.toLowerCase().trim()

  if (!authorizedEmail) {
    if (isClerkConfigured()) {
      try {
        const { userId } = await auth()
        if (userId) {
          const clerkUser = await currentUser()
          authorizedEmail = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase().trim()
        }
      } catch {
        // Ignore
      }
    }

    if (!authorizedEmail) {
      try {
        const session = await getCurrentCustomerAction()
        authorizedEmail = session?.email?.toLowerCase().trim()
      } catch {
        // Ignore
      }
    }
  }

  if (!authorizedEmail) {
    return { success: false, error: "You must be signed in to cancel this order." }
  }

  try {
    const adminDb = createAdminClient()

    // 2. Fetch order to verify ownership and eligible status
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanParam)
    let query = adminDb
      .from("orders")
      .select("id, order_number, email, status, payment_method, payment_status, total_fils, order_items(variant_id, quantity)")
      .ilike("email", authorizedEmail)

    if (isUuid) {
      query = query.eq("id", cleanParam)
    } else {
      query = query.ilike("order_number", cleanParam)
    }

    const { data: order, error } = await query.maybeSingle()

    if (error || !order) {
      return { success: false, error: "Order not found or you are not authorized to cancel it." }
    }

    // 3. Verify order status allows cancellation
    if (order.status === "cancelled") {
      return { success: false, error: "This order is already cancelled." }
    }
    if (order.status === "shipped" || order.status === "delivered") {
      return {
        success: false,
        error: "This order has already been dispatched. You can request a return after delivery.",
      }
    }
    if (order.status === "returned_to_sender") {
      return { success: false, error: "This order has already been returned." }
    }

    const previousStatus = order.status

    if (order.payment_method === "cod") {
      const { data: cancelled, error: cancellationError } = await adminDb.rpc("cancel_customer_cod_order", {
        p_order_id: order.id,
        p_email: authorizedEmail,
        p_note: cleanReason,
      })
      if (cancellationError) return { success: false, error: "Unable to cancel this order. Please refresh and try again." }
      if (cancelled === true) await sendOrderCancelledEmail(order.id, cleanReason, order.email)
      return { success: true }
    }

    // 4. Update order to cancelled
    const { error: updateErr } = await adminDb
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cleanReason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)

    if (updateErr) {
      return { success: false, error: updateErr.message }
    }

    // 5. Release any reserved inventory back to stock_levels
    if (Array.isArray(order.order_items)) {
      for (const item of order.order_items) {
        if (item.variant_id) {
          const { data: stock } = await adminDb
            .from("stock_levels")
            .select("reserved")
            .eq("variant_id", item.variant_id)
            .maybeSingle()

          if (stock && typeof stock.reserved === "number" && stock.reserved > 0) {
            await adminDb
              .from("stock_levels")
              .update({
                reserved: Math.max(0, stock.reserved - (item.quantity || 1)),
              })
              .eq("variant_id", item.variant_id)
          }
        }
      }
    }

    // 6. Log timeline audit event
    await adminDb.from("order_events").insert({
      order_id: order.id,
      event_type: "customer_order_cancelled",
      from_status: previousStatus,
      to_status: "cancelled",
      note: `Cancelled by customer: ${cleanReason}`,
      actor_sub: authorizedEmail,
    })

    // 7. Dispatch cancellation email in background
    void sendOrderCancelledEmail(order.id, cleanReason, order.email).catch((e) =>
      console.warn("[Account Cancel Order] Email error:", e)
    )

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to cancel order"
    return { success: false, error: msg }
  }
}

