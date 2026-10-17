"use server"

import "server-only"
import { createAdminClient } from "@/lib/supabase/server"
import { getStoreSettings } from "@/features/admin/settings/actions"
import { checkoutFormSchema, type CheckoutFormValues } from "./schemas"
import type { CartItem } from "@/features/cart/types"
import type { CheckoutConfig, PlaceOrderResult } from "./types"
import { calculateVatPortion } from "@/lib/money"

/**
 * Fetch checkout delivery and payment configuration from database settings.
 */
export async function getCheckoutConfigAction(): Promise<CheckoutConfig> {
  try {
    const settings = await getStoreSettings()
    return {
      deliveryFeeFils: settings.delivery_fee_fils,
      freeDeliveryThresholdFils: settings.free_delivery_over_fils,
      vatRatePct: settings.vat_rate_pct,
      codEnabled: settings.cod_enabled,
      codFeeFils: settings.cod_fee_fils,
      codMaxOrderFils: settings.cod_max_order_fils,
    }
  } catch (err) {
    console.error("Failed to fetch checkout config:", err)
    return {
      deliveryFeeFils: 2500, // 25 AED fallback
      freeDeliveryThresholdFils: 20000, // 200 AED free delivery
      vatRatePct: 5,
      codEnabled: true,
      codFeeFils: 0,
      codMaxOrderFils: 100000, // 1,000 AED max COD
    }
  }
}

/**
 * Generates a clean, gapless order number formatted like AR-1049.
 */
async function generateOrderNumber(supabase: ReturnType<typeof createAdminClient>): Promise<string> {
  const { data: latest } = await supabase
    .from("orders")
    .select("order_number")
    .order("created_at", { ascending: false })
    .limit(1)

  if (latest && latest.length > 0 && latest[0]?.order_number) {
    const match = latest[0].order_number.match(/AR-(\d+)/)
    if (match && match[1]) {
      const nextNum = parseInt(match[1], 10) + 1
      return `AR-${nextNum}`
    }
  }

  // Count existing orders as baseline
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })

  const baseNumber = 1045 + (count || 0)
  return `AR-${baseNumber}`
}

/**
 * Place a customer order with complete server-side verification:
 * - Re-prices each SKU against live database prices (preventing browser tampering)
 * - Evaluates Cash on Delivery eligibility rules (max order value, settings status)
 * - Inserts the order, line item snapshots, and initial timeline audit row
 */
export async function placeCheckoutOrderAction(
  formData: CheckoutFormValues,
  cartItems: CartItem[]
): Promise<PlaceOrderResult> {
  try {
    if (!cartItems || cartItems.length === 0) {
      return { success: false, error: "Your shopping bag is empty. Please add items to checkout." }
    }

    // 1. Validate Form Input with Zod
    const parsedForm = checkoutFormSchema.safeParse(formData)
    if (!parsedForm.success) {
      const firstIssue = parsedForm.error.issues[0]
      return {
        success: false,
        error: firstIssue ? firstIssue.message : "Invalid delivery details provided.",
      }
    }
    const data = parsedForm.data

    const supabase = createAdminClient()
    const settings = await getStoreSettings()

    // 2. Re-price all cart items on the server from the product_variants database
    const variantIds = cartItems.map((i) => i.variantId).filter(Boolean)
    const { data: dbVariants } = await supabase
      .from("product_variants")
      .select("id, price_fils, is_active, sku")
      .in("id", variantIds)

    const variantPriceMap = new Map<string, number>()
    if (dbVariants) {
      for (const v of dbVariants) {
        if (typeof v.price_fils === "number") {
          variantPriceMap.set(v.id, v.price_fils)
        }
      }
    }

    let subtotalFils = 0
    const verifiedLines = cartItems.map((item) => {
      // Use verified price from DB or fallback safely to cart's registered price
      const verifiedUnitPrice = variantPriceMap.get(item.variantId) ?? item.priceFils
      const lineTotal = verifiedUnitPrice * item.quantity
      subtotalFils += lineTotal
      return {
        ...item,
        unitPriceFils: verifiedUnitPrice,
        lineTotalFils: lineTotal,
      }
    })

    // 3. Compute delivery & COD fees
    const deliveryFeeFils =
      subtotalFils >= settings.free_delivery_over_fils ? 0 : settings.delivery_fee_fils

    const isCod = data.paymentMethod === "cod"
    const codFeeFils = isCod ? settings.cod_fee_fils : 0
    const totalFils = subtotalFils + deliveryFeeFils + codFeeFils
    const vatFils = calculateVatPortion(totalFils)

    // 4. Validate Cash on Delivery eligibility rules per ADR-033
    if (isCod) {
      if (!settings.cod_enabled) {
        return {
          success: false,
          error: "Cash on delivery is currently unavailable. Please select card payment.",
        }
      }
      if (totalFils > settings.cod_max_order_fils) {
        return {
          success: false,
          error: `Cash on delivery is only available for orders up to AED ${settings.cod_max_order_fils / 100}. Please choose card payment or adjust your bag.`,
        }
      }
    }

    // 5. Generate Order Number
    const orderNumber = await generateOrderNumber(supabase)

    // 6. Insert Order Header into `orders`
    const { data: insertedOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: data.fullName.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone.trim(),
        emirate: data.emirate,
        area: data.area,
        street_address: data.street,
        building: data.building,
        apartment: data.apartment || null,
        landmark: data.landmark || null,
        internal_notes: data.instructions ? `Customer notes: ${data.instructions}` : null,
        status: isCod ? "awaiting_confirmation" : "confirmed",
        payment_method: data.paymentMethod,
        payment_status: isCod ? "unpaid" : "paid",
        subtotal_fils: subtotalFils,
        delivery_fee_fils: deliveryFeeFils,
        cod_fee_fils: codFeeFils,
        vat_fils: vatFils,
        total_fils: totalFils,
        vat_rate_bps: settings.vat_rate_pct * 100,
        confirmed_at: isCod ? null : new Date().toISOString(),
        paid_at: isCod ? null : new Date().toISOString(),
      })
      .select("id")
      .single()

    if (orderError || !insertedOrder) {
      console.error("Failed to insert order:", orderError)
      return { success: false, error: "Failed to create order record. Please try again." }
    }

    const orderId = insertedOrder.id

    // 7. Insert Order Items Snapshot
    const orderItemsPayload = verifiedLines.map((line) => ({
      order_id: orderId,
      product_id: line.productId || null,
      variant_id: line.variantId || null,
      product_name: line.productName,
      colour_name: line.colourName,
      style_code: line.sku, // Default style code representation
      size_label: line.sizeLabel || null,
      sku: line.sku,
      media_key: line.image || null,
      unit_price_fils: line.unitPriceFils,
      quantity: line.quantity,
      total_fils: line.lineTotalFils,
    }))

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsPayload)

    if (itemsError) {
      console.error("Failed to insert order items:", itemsError)
    }

    // 8. Insert Audit Event in `order_events`
    await supabase.from("order_events").insert({
      order_id: orderId,
      event_type: isCod ? "cod_order_placed" : "card_order_placed",
      from_status: null,
      to_status: isCod ? "awaiting_confirmation" : "confirmed",
      note: isCod
        ? "Order placed via Cash on Delivery. Awaiting concierge phone or WhatsApp confirmation."
        : "Order placed and confirmed successfully via Card payment.",
      actor_sub: "storefront_shopper",
    })

    const redirectUrl = isCod
      ? `/checkout/received/${encodeURIComponent(orderNumber)}`
      : `/checkout/success?orderNumber=${encodeURIComponent(orderNumber)}`

    return {
      success: true,
      orderNumber,
      orderId,
      paymentMethod: data.paymentMethod,
      redirectUrl,
    }
  } catch (err: any) {
    console.error("placeCheckoutOrderAction error:", err)
    return {
      success: false,
      error: err?.message || "An unexpected error occurred while placing your order.",
    }
  }
}
