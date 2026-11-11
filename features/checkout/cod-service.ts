import "server-only"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { sendOrderConfirmationEmail, sendAdminNewOrderNotification } from "@/lib/email"
import type { CheckoutFormValues } from "./schemas"
import type { PlaceOrderResult } from "./types"

const codLinesSchema = z.array(z.object({
  variantId: z.string().uuid().or(z.literal("")),
  sku: z.string().min(1),
  quantity: z.number().int().min(1).max(5),
})).min(1).max(100)

const codResultSchema = z.object({
  order_id: z.string().uuid(),
  order_number: z.string(),
  created: z.boolean(),
})

export async function placeCodOrder(
  customer: CheckoutFormValues,
  items: unknown,
  userId: string | null,
  checkoutKey?: string,
  couponCode?: string,
): Promise<PlaceOrderResult> {
  const key = z.string().uuid().safeParse(checkoutKey)
  const lines = codLinesSchema.safeParse(items)
  if (!key.success || !lines.success) {
    return { success: false, error: "Please refresh checkout and check the quantities in your bag." }
  }
  const db = createAdminClient()
  const { data, error } = await db.rpc("place_cod_order", {
    p_key: key.data,
    p_customer: customer,
    p_items: lines.data.map(line => ({ variant_id: line.variantId || null, sku: line.sku, quantity: line.quantity })),
    p_user_id: userId,
    p_coupon_code: couponCode?.trim() || null,
  })
  if (error) {
    return { success: false, error: error.code === "P0001" ? error.message : "Unable to place your COD order. Please retry." }
  }
  const result = codResultSchema.safeParse(data)
  if (!result.success) return { success: false, error: "Unable to verify the order response. Please retry." }

  if (result.data.created) {
    // Only the request that created the order dispatches notifications.
    await Promise.allSettled([
      sendOrderConfirmationEmail(result.data.order_id),
      sendAdminNewOrderNotification(result.data.order_id),
    ])
  }
  return {
    success: true,
    orderId: result.data.order_id,
    orderNumber: result.data.order_number,
    paymentMethod: "cod",
    redirectUrl: `/checkout/received/${encodeURIComponent(result.data.order_number)}`,
  }
}
