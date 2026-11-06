import "server-only"
import { createAdminClient } from "@/lib/supabase/server"

export interface TrackedOrder {
  orderId: string
  orderNumber?: string
  status: string
  courier: string | null
  trackingNumber: string | null
}

const statusLabels: Record<string, string> = {
  pending_payment: "Awaiting payment",
  awaiting_confirmation: "Awaiting confirmation",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  expired: "Expired",
  returned_to_sender: "Returned to sender",
}

/** Guest access requires both the Order Number (or UUID) and the exact checkout email. */
export async function findTrackedOrder(orderIdentifier: string, email: string): Promise<TrackedOrder | null> {
  const db = createAdminClient()
  const trimmed = orderIdentifier.trim()
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)

  let query = db
    .from("orders")
    .select("id, order_number, status, payment_method, courier, tracking_number")
    .ilike("email", email.trim())

  if (isUuid) {
    query = query.eq("id", trimmed)
  } else {
    const normalized = trimmed.toUpperCase().startsWith("AR-")
      ? trimmed.toUpperCase()
      : `AR-${trimmed.replace(/^AR-?/i, "")}`
    query = query.or(`order_number.ilike.${trimmed},order_number.ilike.${normalized}`)
  }

  const { data, error } = await query.maybeSingle()

  if (error) throw new Error("Order tracking lookup failed")
  if (!data) return null

  const status = data.status === "pending"
    ? (data.payment_method === "cod" ? "Awaiting confirmation" : "Awaiting payment")
    : statusLabels[data.status] || "Processing"

  return {
    orderId: data.id,
    orderNumber: data.order_number,
    status,
    courier: data.courier || null,
    trackingNumber: data.tracking_number || null,
  }
}
