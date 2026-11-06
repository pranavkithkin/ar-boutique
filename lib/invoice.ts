import "server-only"
import { createAdminClient } from "@/lib/supabase/server"
import { getStoreSettings } from "@/features/admin/settings/actions"
import { calculateVatPortion } from "@/lib/money"

export interface InvoiceLineItem {
  id: string
  productName: string
  colourName: string
  sizeLabel?: string | null
  styleCode?: string | null
  sku?: string | null
  quantity: number
  unitPriceGrossFils: number
  unitPriceNetFils: number
  vatFils: number
  totalGrossFils: number
  totalNetFils: number
}

export interface InvoiceData {
  invoiceNumber: string
  issuedAt: string
  orderId: string
  orderNumber: string
  orderDate: string
  paymentMethod: "card" | "cod"
  paymentStatus: string
  // Supplier details (UAE FTA required)
  supplier: {
    nameEn: string
    nameAr: string
    trn: string
    addressEn: string
    addressAr: string
    email: string
    phone: string
  }
  // Customer details
  customer: {
    name: string
    email: string
    phone: string
    address: {
      building?: string
      apartment?: string
      street: string
      area: string
      emirate: string
      country: string
    }
  }
  // Items & Financials
  items: InvoiceLineItem[]
  subtotalNetFils: number
  discountFils?: number
  deliveryFeeFils: number
  totalVatFils: number
  totalGrossFils: number
  vatRatePct: number
}

/**
 * Returns the existing gapless sequential invoice number or generates the next one.
 * Persists sequence in `order_events` (INV-YYYY-XXXX).
 */
export async function getOrAssignInvoiceNumber(orderId: string): Promise<string> {
  const adminDb = createAdminClient()
  const currentYear = new Date().getFullYear()

  // 1. Check if invoice has already been issued for this order
  const { data: existingEvent } = await adminDb
    .from("order_events")
    .select("note")
    .eq("order_id", orderId)
    .eq("event_type", "invoice_generated")
    .maybeSingle()

  if (existingEvent?.note && existingEvent.note.startsWith("INV-")) {
    return existingEvent.note.trim()
  }

  // 2. Query highest invoice number assigned for this year
  const prefix = `INV-${currentYear}-`
  const { data: allInvoiceEvents } = await adminDb
    .from("order_events")
    .select("note")
    .eq("event_type", "invoice_generated")

  let maxSeq = 1000
  if (allInvoiceEvents && allInvoiceEvents.length > 0) {
    for (const ev of allInvoiceEvents) {
      if (ev.note && ev.note.startsWith(prefix)) {
        const numPart = parseInt(ev.note.replace(prefix, ""), 10)
        if (!isNaN(numPart) && numPart > maxSeq) {
          maxSeq = numPart
        }
      }
    }
  }

  const newInvoiceNumber = `${prefix}${maxSeq + 1}`

  // 3. Persist the invoice assignment in `order_events`
  await adminDb.from("order_events").insert({
    order_id: orderId,
    event_type: "invoice_generated",
    note: newInvoiceNumber,
    actor_sub: "system_invoice",
  })

  return newInvoiceNumber
}

/**
 * Generates all structured bilingual data required for UAE FTA Tax Invoice.
 */
export async function getInvoiceData(orderId: string): Promise<InvoiceData | null> {
  try {
    const adminDb = createAdminClient()
    const settings = await getStoreSettings()

    // 1. Fetch order
    const { data: order, error: orderErr } = await adminDb
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .maybeSingle()

    if (orderErr || !order) {
      console.error("[Invoice] Order not found:", orderId, orderErr)
      return null
    }

    // 2. Get or assign gapless invoice number
    const invoiceNumber = await getOrAssignInvoiceNumber(order.id)

    const issuedAt = new Date().toLocaleDateString("en-AE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString("en-AE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const vatRatePct = settings.vat_rate_pct || 5
    const deliveryFeeFils = order.delivery_fee_fils || 0
    const totalGrossFils = order.total_fils || 0

    // Compute item level tax splits
    const rawItems = (order.order_items || []) as Array<{
      id: string
      product_name?: string | null
      colour_name?: string | null
      size_name?: string | null
      size_label?: string | null
      style_code?: string | null
      sku?: string | null
      quantity?: number | null
      price_fils?: number | null
    }>
    const items: InvoiceLineItem[] = rawItems.map((it) => {
      const grossTotal = (it.price_fils || 0) * (it.quantity || 1)
      const vat = calculateVatPortion(grossTotal)
      const netTotal = grossTotal - vat
      const unitGross = it.price_fils || 0
      const unitNet = Math.round((unitGross * 100) / (100 + vatRatePct))

      return {
        id: it.id,
        productName: it.product_name || "Boutique Garment",
        colourName: it.colour_name || "Standard",
        sizeLabel: it.size_name || null,
        styleCode: it.style_code || null,
        sku: it.sku || null,
        quantity: it.quantity || 1,
        unitPriceGrossFils: unitGross,
        unitPriceNetFils: unitNet,
        vatFils: vat,
        totalGrossFils: grossTotal,
        totalNetFils: netTotal,
      }
    })

    const totalVatFils = calculateVatPortion(totalGrossFils)
    const subtotalNetFils = totalGrossFils - deliveryFeeFils - totalVatFils

    return {
      invoiceNumber,
      issuedAt,
      orderId: order.id,
      orderNumber: order.order_number,
      orderDate,
      paymentMethod: order.payment_method === "cod" ? "cod" : "card",
      paymentStatus: order.payment_status || "confirmed",
      supplier: {
        nameEn: settings.store_name || "AR Boutique Atelier LLC",
        nameAr: "أي آر بوتيك لتصميم الأزياء ذ.م.م",
        trn: (settings.trn || "").trim(),
        addressEn: settings.store_address || "Al Wasl Road, Jumeirah, Dubai, United Arab Emirates",
        addressAr: "طريق الوصل، جميرا، دبي، الإمارات العربية المتحدة",
        email: settings.store_email || "concierge@arboutique.ae",
        phone: settings.store_phone || "+971 50 123 4567",
      },
      customer: {
        name: order.customer_name || "Valued Patron",
        email: order.email || "",
        phone: order.phone || "",
        address: {
          building: order.building || undefined,
          apartment: order.apartment || undefined,
          street: order.street_address || "",
          area: order.area || "",
          emirate: order.emirate || "Dubai",
          country: "United Arab Emirates",
        },
      },
      items,
      subtotalNetFils,
      discountFils: order.discount_fils || 0,
      deliveryFeeFils,
      totalVatFils,
      totalGrossFils,
      vatRatePct,
    }
  } catch (err) {
    console.error("[Invoice] Error generating invoice data:", err)
    return null
  }
}
