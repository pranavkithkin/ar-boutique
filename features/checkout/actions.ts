"use server"

import "server-only"
import { headers } from "next/headers"
import { auth, currentUser } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/server"
import { isClerkConfigured } from "@/lib/clerk"
import { getCurrentCustomerAction } from "@/features/auth/actions"
import { getStoreSettings } from "@/features/admin/settings/actions"
import { checkoutFormSchema, type CheckoutFormValues } from "./schemas"
import type { CartItem } from "@/features/cart/types"
import type {
  CheckoutConfig,
  CheckoutPageData,
  CodEligibilityStatus,
  CustomerCheckoutContext,
  PlaceOrderResult,
  SavedAddressCandidate,
} from "./types"
import { calculateVatPortion } from "@/lib/money"
import { createStripeCheckoutSession } from "./stripe"
import { placeCodOrder } from "./cod-service"

/**
 * Fetch checkout delivery and payment configuration from database settings.
 */
export async function getCheckoutConfigAction(): Promise<CheckoutConfig> {
  try {
    const settings = await getStoreSettings()
    return {
      deliveryFeeFils: settings.delivery_fee_fils,
      freeDeliveryThresholdFils: settings.free_delivery_over_fils,
      vatEnabled: Boolean(settings.vat_enabled),
      vatRatePct: settings.vat_rate_pct,
      cardEnabled: settings.card_enabled,
      codEnabled: settings.cod_enabled,
      codFeeFils: settings.cod_fee_fils,
      codMaxOrderFils: settings.cod_max_order_fils,
      codConfirmHours: settings.cod_confirm_hours || 24,
      codRefusedBlockCount: settings.cod_refused_block_count || 2,
    }
  } catch (err) {
    console.error("Failed to fetch checkout config:", err)
    return {
      deliveryFeeFils: 2500, // 25 AED fallback
      freeDeliveryThresholdFils: 20000, // 200 AED free delivery
      vatEnabled: false,
      vatRatePct: 5,
      cardEnabled: true,
      codEnabled: true,
      codFeeFils: 0,
      codMaxOrderFils: 100000, // 1,000 AED max COD
      codConfirmHours: 24,
      codRefusedBlockCount: 2,
    }
  }
}

/**
 * Comprehensive server-side loader for the checkout page:
 * - Reads live store settings and fees
 * - Inspects active Clerk / Supabase customer session
 * - Pulls verified past UAE delivery addresses from orders
 * - Evaluates full Cash on Delivery eligibility rules
 */
export async function getCheckoutInitialDataAction(): Promise<CheckoutPageData> {
  const supabase = createAdminClient()
  const config = await getCheckoutConfigAction()

  let email: string | undefined
  let fullName: string | undefined
  let phone: string | undefined
  let isSignedIn = false

  try {
    if (isClerkConfigured()) {
      const { userId } = await auth()
      if (userId) {
        isSignedIn = true
        const clerkUser = await currentUser()
        if (clerkUser) {
          email = clerkUser.primaryEmailAddress?.emailAddress
          fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || undefined
          phone = clerkUser.primaryPhoneNumber?.phoneNumber || undefined
        }
      }
    }

    if (!isSignedIn) {
      const session = await getCurrentCustomerAction()
      if (session) {
        isSignedIn = true
        email = session.email
        fullName = `${session.firstName} ${session.lastName}`.trim() || undefined
        phone = session.phone || undefined
      }
    }
  } catch (err) {
    console.warn("Could not inspect customer auth in checkout initial data:", err)
  }

  const savedAddresses: SavedAddressCandidate[] = []
  let codEligible = config.codEnabled
  let codReason: string | undefined
  let hasOpenCodOrder = false
  let isBlocked = false
  let refusalsCount = 0

  if (email) {
    const cleanEmail = email.toLowerCase().trim()

    // 1. Check Customer record in `customers` table
    const { data: customerRow } = await supabase
      .from("customers")
      .select("id, full_name, phone, cod_disabled, cod_disabled_reason")
      .ilike("email", cleanEmail)
      .maybeSingle()

    if (customerRow) {
      if (customerRow.full_name && !fullName) fullName = customerRow.full_name
      if (customerRow.phone && !phone) phone = customerRow.phone
      if (customerRow.cod_disabled) {
        isBlocked = true
        codEligible = false
        codReason =
          customerRow.cod_disabled_reason || "Cash on delivery has been restricted for this account."
      }
    }

    // 2. Fetch past orders for address reuse & COD policy checks
    const { data: pastOrders } = await supabase
      .from("orders")
      .select(
        "id, customer_name, phone, emirate, area, street_address, building, apartment, landmark, status, payment_method, created_at"
      )
      .ilike("email", cleanEmail)
      .order("created_at", { ascending: false })
      .limit(20)

    if (pastOrders && pastOrders.length > 0) {
      const addressSignatures = new Set<string>()

      for (const ord of pastOrders) {
        if (!ord.street_address || !ord.emirate) continue

        const sig = `${ord.emirate.toLowerCase()}|${(ord.area || "").toLowerCase()}|${ord.street_address.toLowerCase()}|${(ord.building || "").toLowerCase()}`
        if (!addressSignatures.has(sig)) {
          addressSignatures.add(sig)
          savedAddresses.push({
            id: `past_addr_${ord.id}`,
            label: `${ord.area || ord.emirate} Delivery`,
            recipientName: ord.customer_name || fullName || "Customer",
            phone: ord.phone || phone || "+971 ",
            emirate: ord.emirate,
            area: ord.area || "",
            street: ord.street_address,
            building: ord.building || "",
            apartment: ord.apartment || undefined,
            landmark: ord.landmark || undefined,
            isDefault: savedAddresses.length === 0,
          })
        }

        // Active open COD order check
        // Refused / returned order count
        if (ord.status === "returned_to_sender") {
          refusalsCount++
        }
      }

      if (refusalsCount >= config.codRefusedBlockCount) {
        isBlocked = true
        codEligible = false
        codReason = "Cash on delivery is disabled due to past parcel delivery refusals."
      }
    }
  } else {
    // Guest checkout: COD defaults to signed-in accounts only per ADR-033
    codEligible = false
    codReason = "Sign in to your account to pay with Cash on Delivery."
  }

  const codEligibility: CodEligibilityStatus = {
    eligible: codEligible,
    reason: codReason,
    isSignedIn,
    hasOpenCodOrder,
    isBlocked,
    refusalsCount,
    maxOrderFils: config.codMaxOrderFils,
  }

  const customerContext: CustomerCheckoutContext = {
    isSignedIn,
    email,
    fullName,
    phone,
    savedAddresses,
    codEligibility,
  }

  return {
    config,
    customerContext,
  }
}

/**
 * Generates a unique order number using the database sequence shared with COD.
 */
async function generateOrderNumber(supabase: ReturnType<typeof createAdminClient>): Promise<string> {
  const { data, error } = await supabase.rpc("next_order_number")
  if (error || typeof data !== "string") throw new Error("Could not generate an order number. Please retry.")
  return data
}

/**
 * Place a customer order with complete server-side verification:
 * - Re-prices each SKU against live database prices (preventing browser tampering)
 * - Evaluates live stock availability & reserves inventory
 * - Evaluates Cash on Delivery eligibility rules (max order value, settings status)
 * - Inserts the order, line item snapshots, and initial timeline audit row
 */
import { calculateCouponDiscount } from "@/features/coupons/service"
import type { Coupon } from "@/features/coupons/types"

export async function placeCheckoutOrderAction(
  formData: CheckoutFormValues,
  cartItems: CartItem[],
  couponCode?: string,
  checkoutKey?: string,
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

    // 2. Resolve Authenticated Customer (if signed in)
    let clerkUserId: string | null = null
    try {
      if (isClerkConfigured()) {
        const { userId } = await auth()
        if (userId) clerkUserId = userId
      }
    } catch {
      // Guest or local session
    }

    // COD pricing, eligibility, items, holds and coupon redemption are one transaction.
    // Do not perform stock prechecks before this call: retries must work after stock is reserved.
    if (data.paymentMethod === "cod") {
      return placeCodOrder(data, cartItems, clerkUserId, checkoutKey, couponCode)
    }

    // 3. Re-price all cart items on the server from the product_variants database
    // Handle both variant UUID and fallback SKU lookups
    const rawVariantIds = cartItems.map((i) => i.variantId).filter(Boolean)
    const skus = cartItems.map((i) => i.sku).filter(Boolean)

    let query = supabase
      .from("product_variants")
      .select("id, product_id, product_colour_id, price_fils, is_active, sku, product_colours(style_code)")
    if (rawVariantIds.length > 0 && skus.length > 0) {
      query = query.or(`id.in.(${rawVariantIds.join(",")}),sku.in.(${skus.join(",")})`)
    } else if (rawVariantIds.length > 0) {
      query = query.in("id", rawVariantIds)
    } else if (skus.length > 0) {
      query = query.in("sku", skus)
    }

    const { data: dbVariants } = await query

    const variantPriceMap = new Map<string, number>()
    const variantDetailsMap = new Map<
      string,
      { id: string; productId: string; colourId: string; styleCode?: string; price_fils: number }
    >()
    const skuToVariantMap = new Map<
      string,
      { id: string; productId: string; colourId: string; styleCode?: string; price_fils: number }
    >()

    if (dbVariants) {
      for (const v of dbVariants as any[]) {
        if (typeof v.price_fils === "number") {
          const styleCode = v.product_colours?.style_code || undefined
          const detail = {
            id: v.id,
            productId: v.product_id,
            colourId: v.product_colour_id,
            styleCode,
            price_fils: v.price_fils,
          }
          variantPriceMap.set(v.id, v.price_fils)
          variantDetailsMap.set(v.id, detail)
          if (v.sku) {
            skuToVariantMap.set(v.sku.toLowerCase(), detail)
          }
        }
      }
    }

    const resolvedVariantIds = cartItems
      .map((item) => {
        if (item.variantId && variantPriceMap.has(item.variantId)) return item.variantId
        if (item.sku) return skuToVariantMap.get(item.sku.toLowerCase())?.id
        return null
      })
      .filter((id): id is string => Boolean(id))

    // 4. Verify inventory stock levels
    if (resolvedVariantIds.length > 0) {
      const { data: stockLevels } = await supabase
        .from("stock_levels")
        .select("variant_id, on_hand, reserved")
        .in("variant_id", resolvedVariantIds)

      if (stockLevels) {
        const stockMap = new Map<string, { on_hand: number; reserved: number }>()
        for (const st of stockLevels) {
          stockMap.set(st.variant_id, {
            on_hand: st.on_hand ?? 0,
            reserved: st.reserved ?? 0,
          })
        }

        for (const item of cartItems) {
          const matchedVariantId =
            (item.variantId && variantPriceMap.has(item.variantId))
              ? item.variantId
              : (item.sku ? skuToVariantMap.get(item.sku.toLowerCase())?.id : null)

          if (!matchedVariantId) continue
          const stock = stockMap.get(matchedVariantId)
          if (stock) {
            const available = stock.on_hand - stock.reserved
            if (available < item.quantity) {
              const label = item.sizeLabel ? `${item.productName} (${item.sizeLabel})` : item.productName
              return {
                success: false,
                error:
                  available <= 0
                    ? `Sorry, ${label} is currently sold out.`
                    : `Sorry, only ${available} unit(s) remaining for ${label}. Please adjust your quantity.`,
              }
            }
          }
        }
      }
    }

    // Verify every single item has a valid server price in product_variants (ADR-035 & backend security)
    for (const item of cartItems) {
      const fallbackVariant = item.sku ? skuToVariantMap.get(item.sku.toLowerCase()) : null
      const variantDetails = item.variantId ? variantDetailsMap.get(item.variantId) : null
      const resolvedDetails = variantDetails || fallbackVariant
      const serverPrice =
        resolvedDetails?.price_fils ??
        (item.variantId ? variantPriceMap.get(item.variantId) : null)

      if (typeof serverPrice !== "number") {
        return {
          success: false,
          error: `Price could not be verified from the server catalogue for "${item.productName || item.sku || "item"}". Please remove or re-add this piece.`,
        }
      }
    }

    let subtotalFils = 0
    const verifiedLines = cartItems.map((item) => {
      const fallbackVariant = item.sku ? skuToVariantMap.get(item.sku.toLowerCase()) : null
      const variantDetails = item.variantId ? variantDetailsMap.get(item.variantId) : null
      const resolvedDetails = variantDetails || fallbackVariant

      const actualVariantId = resolvedDetails?.id || item.variantId || null
      const actualProductId = item.productId || resolvedDetails?.productId || null
      const actualColourId = resolvedDetails?.colourId || null
      const actualStyleCode = resolvedDetails?.styleCode || item.sku || "N/A"

      const verifiedUnitPrice = (
        resolvedDetails?.price_fils ??
        (actualVariantId ? variantPriceMap.get(actualVariantId) : null)
      )!

      const lineTotal = verifiedUnitPrice * item.quantity
      subtotalFils += lineTotal
      return {
        ...item,
        productId: actualProductId,
        productColourId: actualColourId,
        variantId: actualVariantId,
        styleCode: actualStyleCode,
        unitPriceFils: verifiedUnitPrice,
        lineTotalFils: lineTotal,
      }
    })

    // 5. Evaluate Promo Code / Coupon (if provided)
    let discountFils = 0
    let appliedCoupon: Coupon | null = null
    let appliedDeliveryFeeFils =
      subtotalFils >= settings.free_delivery_over_fils ? 0 : settings.delivery_fee_fils

    if (couponCode && couponCode.trim()) {
      const normalizedCode = couponCode.toUpperCase().trim()
      const { data: dbCoupon } = await supabase
        .from("coupons")
        .select("*")
        .ilike("code", normalizedCode)
        .maybeSingle()

      if (dbCoupon) {
        const cleanEmail = data.email.toLowerCase().trim()
        const { count: custRedemptions } = await supabase
          .from("coupon_redemptions")
          .select("id", { count: "exact", head: true })
          .eq("coupon_id", dbCoupon.id)
          .ilike("customer_email", cleanEmail)

        const evalResult = calculateCouponDiscount({
          subtotalFils,
          deliveryFeeFils: appliedDeliveryFeeFils,
          coupon: dbCoupon as Coupon,
          customerRedemptionsCount: custRedemptions || 0,
        })

        if (evalResult.valid) {
          appliedCoupon = dbCoupon as Coupon
          discountFils = evalResult.discountFils
          if (evalResult.freeShipping) {
            appliedDeliveryFeeFils = 0
          }
        }
      }
    }

    const deliveryFeeFils = appliedDeliveryFeeFils
    const codFeeFils = 0 // COD has already returned through place_cod_order().
    const totalFils = Math.max(0, subtotalFils - discountFils) + deliveryFeeFils + codFeeFils
    const isVatEnabled = Boolean(settings.vat_enabled)
    const vatFils = isVatEnabled ? calculateVatPortion(totalFils) : 0

    // 6. Validate Payment Method availability rules
    if (!settings.card_enabled) {
      return {
        success: false,
        error: "Online card payment is currently disabled. Please select Cash on Delivery.",
      }
    }

    // 7. Generate Order Number
    const orderNumber = await generateOrderNumber(supabase)

    // 8. Card checkout holds stock for 31 minutes.
    const confirmBy = null
    const holdExpiresAt = new Date(Date.now() + 31 * 60 * 1000).toISOString()

    // 9. Insert Order Header into `orders`
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
        internal_notes: data.instructions ? `Customer delivery notes: ${data.instructions}` : null,
        status: "pending",
        payment_method: data.paymentMethod,
        payment_status: "pending",
        subtotal_fils: subtotalFils,
        discount_fils: discountFils,
        delivery_fee_fils: deliveryFeeFils,
        cod_fee_fils: codFeeFils,
        vat_fils: vatFils,
        total_fils: totalFils,
        vat_rate_bps: isVatEnabled ? settings.vat_rate_pct * 100 : 0,
        confirm_by: confirmBy,
        hold_expires_at: holdExpiresAt,
        confirmed_at: null,
        paid_at: null,
        clerk_user_id: clerkUserId,
      })
      .select("id")
      .single()

    if (orderError || !insertedOrder) {
      console.error("Failed to insert order:", orderError)
      return { success: false, error: "Failed to create order record. Please try again." }
    }

    const orderId = insertedOrder.id

    const isUuid = (val: unknown): val is string =>
      typeof val === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim())

    // 10. Insert Order Items Snapshot
    const orderItemsPayload = verifiedLines.map((line) => {
      const fallbackVariant = line.sku ? skuToVariantMap.get(line.sku.toLowerCase()) : null
      const variantDetails = (line.variantId && isUuid(line.variantId)) ? variantDetailsMap.get(line.variantId) : null
      const resolved = variantDetails || fallbackVariant

      const variantId = isUuid(line.variantId)
        ? line.variantId
        : (isUuid(resolved?.id) ? resolved.id : null)

      const productId = isUuid(line.productId)
        ? line.productId
        : (isUuid(resolved?.productId) ? resolved.productId : null)

      const colourId = isUuid(line.productColourId)
        ? line.productColourId
        : (isUuid(resolved?.colourId) ? resolved.colourId : null)

      const unitPriceFils = Math.max(0, Math.round(Number(line.unitPriceFils) || 0))
      const quantity = Math.max(1, Math.round(Number(line.quantity) || 1))
      const totalFils = Math.max(0, Math.round(Number(line.lineTotalFils) || unitPriceFils * quantity))

      // Clean media key: if it is a full Cloudinary URL, extract public_id or keep raw key
      let mediaKey: string | null = null
      if (line.image && typeof line.image === "string") {
        if (!line.image.startsWith("http") && !line.image.startsWith("/")) {
          mediaKey = line.image
        } else if (line.image.includes("/upload/")) {
          const parts = line.image.split("/upload/")
          if (parts[1]) {
            mediaKey = parts[1].replace(/^v\d+\//, "").replace(/\.[^.]+$/, "") || null
          }
        }
      }

      return {
        order_id: orderId,
        product_id: productId,
        product_colour_id: colourId,
        variant_id: variantId,
        product_name: String(line.productName || "Boutique Piece"),
        colour_name: String(line.colourName || "Standard"),
        style_code: String(resolved?.styleCode || line.styleCode || line.sku || "N/A"),
        size_label: line.sizeLabel ? String(line.sizeLabel) : null,
        sku: String(line.sku || "N/A"),
        media_key: mediaKey,
        unit_price_fils: unitPriceFils,
        quantity,
        total_fils: totalFils,
        is_final_sale: false,
      }
    })

    const { error: itemsError } = await supabase.from("order_items").insert(orderItemsPayload)
    if (itemsError) {
      console.error("Failed to insert order items:", itemsError)
      return {
        success: false,
        error: `Failed to record order items (${itemsError.message || "database error"}). Please try again.`,
      }
    }

    // 11. Reserve stock through a conditional database update so concurrent checkouts cannot oversell.
    const reservedLines: Array<{ variantId: string; quantity: number }> = []
    for (const line of verifiedLines) {
      const fallbackVariant = line.sku ? skuToVariantMap.get(line.sku.toLowerCase()) : null
      const actualVariantId = (line.variantId && isUuid(line.variantId))
        ? line.variantId
        : (isUuid(fallbackVariant?.id) ? fallbackVariant.id : null)

      if (actualVariantId) {
        const { data: didReserve, error: reserveError } = await supabase.rpc("reserve_stock", {
          p_variant_id: actualVariantId,
          p_quantity: line.quantity,
        })

        if (reserveError || didReserve !== true) {
          for (const reserved of reservedLines) {
            await supabase.rpc("release_reserved_stock", {
              p_variant_id: reserved.variantId,
              p_quantity: reserved.quantity,
            })
          }
          await supabase.from("order_items").delete().eq("order_id", orderId)
          await supabase.from("orders").delete().eq("id", orderId)
          return {
            success: false,
            error: `Sorry, ${line.productName} is no longer available in the requested quantity. Please update your bag.`,
          }
        }

        reservedLines.push({ variantId: actualVariantId, quantity: line.quantity })
      }
    }

    // 12. Insert Audit Event in `order_events`
    await supabase.from("order_events").insert({
      order_id: orderId,
      event_type: "card_order_placed",
      from_status: null,
      to_status: "pending",
      note: "Order initiated. Awaiting card payment confirmation from Stripe.",
      actor_sub: clerkUserId || "storefront_shopper",
    })

    // Card coupon redemption is recorded only by the verified Stripe webhook.
    const cleanEmail = data.email.toLowerCase().trim()

    // 14. Sync customer profile in `customers` table
    try {
      await supabase.from("customers").upsert(
        {
          email: cleanEmail,
          full_name: data.fullName.trim(),
          phone: data.phone.trim(),
          clerk_user_id: clerkUserId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email", ignoreDuplicates: false }
      )
    } catch (custSyncErr) {
      console.warn("Failed to update customer registry on checkout:", custSyncErr)
    }

    // 15. Create the card payment session. COD has already returned above.
    let redirectUrl: string

    {
      let detectedOrigin: string | null = null
      try {
        const headerList = await headers()
        const host = headerList.get("x-forwarded-host") || headerList.get("host")
        const proto = headerList.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https")
        detectedOrigin = headerList.get("origin") || (host ? `${proto}://${host}` : null)
      } catch {
        // Fall back to environment variables
      }

      const siteUrl =
        detectedOrigin ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://www.thearboutique.com")
      const successUrl = `${siteUrl}/checkout/success?orderNumber=${encodeURIComponent(orderNumber)}&session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = `${siteUrl}/checkout`

      try {
        const stripeSession = await createStripeCheckoutSession({
          orderId,
          orderNumber,
          customerEmail: data.email.toLowerCase().trim(),
          customerName: data.fullName.trim(),
          items: verifiedLines.map((l) => ({
            name: `${l.productName}${l.sizeLabel ? ` - ${l.sizeLabel}` : ""}${l.colourName ? ` (${l.colourName})` : ""}`,
            sku: l.sku,
            quantity: l.quantity,
            unitPriceFils: l.unitPriceFils,
          })),
          deliveryFeeFils,
          discountFils,
          promoCode: appliedCoupon?.code || couponCode?.trim() || undefined,
          vatFils,
          successUrl,
          cancelUrl,
        })

        if (!stripeSession.url) {
          throw new Error("Stripe did not return a checkout session URL.")
        }

        // Try updating stripe_session_id on orders if column exists
        try {
          await supabase
            .from("orders")
            .update({ stripe_session_id: stripeSession.id })
            .eq("id", orderId)
        } catch {
          // Ignore if column is absent
        }

        redirectUrl = stripeSession.url
      } catch (stripeErr: unknown) {
        console.error("Failed to create Stripe checkout session:", stripeErr)
        const stripeMsg =
          stripeErr instanceof Error ? stripeErr.message : "Failed to initialize Stripe payment."

        // Release reserved stock hold since session failed
        for (const line of verifiedLines) {
          if (line.variantId) {
            const { data: curStock } = await supabase
              .from("stock_levels")
              .select("reserved")
              .eq("variant_id", line.variantId)
              .maybeSingle()

            if (curStock && curStock.reserved > 0) {
              await supabase
                .from("stock_levels")
                .update({ reserved: Math.max(0, curStock.reserved - line.quantity) })
                .eq("variant_id", line.variantId)
            }
          }
        }

        // Mark order as cancelled
        await supabase
          .from("orders")
          .update({
            status: "cancelled",
            cancellation_reason: `Stripe session creation error: ${stripeMsg}`,
          })
          .eq("id", orderId)

        return {
          success: false,
          error: `Card payment gateway error: ${stripeMsg}`,
        }
      }
    }

    return {
      success: true,
      orderNumber,
      orderId,
      paymentMethod: data.paymentMethod,
      redirectUrl,
    }
  } catch (err: unknown) {
    console.error("placeCheckoutOrderAction error:", err)
    const errorMessage =
      err instanceof Error ? err.message : "An unexpected error occurred while placing your order."
    return {
      success: false,
      error: errorMessage,
    }
  }
}
