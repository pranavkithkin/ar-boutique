import "server-only"
import { Resend } from "resend"
import { createAdminClient } from "@/lib/supabase/server"
import { formatAED, calculateVatPortion } from "@/lib/money"
import { getStoreSettings } from "@/features/admin/settings/actions"
import {
  OrderConfirmationEmail,
  type OrderItemEmailData,
} from "@/components/emails/OrderConfirmationEmail"
import { AdminNewOrderEmail } from "@/components/emails/AdminNewOrderEmail"
import { OrderShippedEmail } from "@/components/emails/OrderShippedEmail"
import { OrderCancelledEmail } from "@/components/emails/OrderCancelledEmail"
import { ReturnRequestedEmail } from "@/components/emails/ReturnRequestedEmail"
import { ReturnDecisionEmail } from "@/components/emails/ReturnDecisionEmail"
import { RefundConfirmationEmail } from "@/components/emails/RefundConfirmationEmail"

/**
 * Lazily instantiate Resend to avoid errors during static builds if the key is missing.
 */
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("[Email Service] RESEND_API_KEY is not set. Emails will be logged to console.")
    return null
  }
  return new Resend(apiKey)
}

/**
 * Returns the verified or default sender address.
 * Resend free accounts without custom domains can only send from onboarding@resend.dev.
 */
function getSenderAddress(storeName: string): string {
  if (process.env.RESEND_FROM_EMAIL) {
    return process.env.RESEND_FROM_EMAIL
  }
  return `${storeName} <orders@thearboutique.com>`
}

export interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Sends a luxury Order Confirmation email to the customer for a given order ID.
 */
export async function sendOrderConfirmationEmail(
  orderId: string,
  recipientEmail?: string
): Promise<SendEmailResult> {
  try {
    const supabase = createAdminClient()
    const settings = await getStoreSettings()

    // 1. Fetch order details
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single()

    if (orderErr || !order) {
      console.error("[Email Service] Order not found for confirmation email:", orderId, orderErr)
      return { success: false, error: "Order not found" }
    }

    const toEmail = recipientEmail?.trim() || order.email
    if (!toEmail) {
      return { success: false, error: "Order has no email address" }
    }

    // 2. Fetch order items
    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)

    if (itemsErr) {
      console.error("[Email Service] Failed to fetch order items:", itemsErr)
    }

    const orderItems: OrderItemEmailData[] = (items || []).map((it) => {
      const lineTotalFils = (it.price_fils || 0) * (it.quantity || 1)
      return {
        id: it.id,
        product_name: it.product_name || "Garment",
        colour_name: it.colour_name || "Standard",
        size_name: it.size_name || null,
        sku: it.sku || null,
        quantity: it.quantity || 1,
        unit_price_aed: formatAED(it.price_fils || 0),
        total_aed: formatAED(lineTotalFils),
      }
    })

    const totalFils = order.total_fils || 0
    const deliveryFeeFils = order.delivery_fee_fils || 0
    const subtotalFils = totalFils - deliveryFeeFils
    const vatFils = calculateVatPortion(totalFils)

    const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString("en-AE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const isCod = order.payment_method === "cod"
    const sender = getSenderAddress(settings.store_name || "AR Boutique")
    const subject = isCod
      ? `Cash on Delivery Order #${order.order_number} Received - AR Boutique`
      : `Order Confirmation #${order.order_number} - AR Boutique`

    const resend = getResendClient()
    if (!resend) {
      console.log(`[Email Mock] Would send confirmation email to ${toEmail} for order ${order.order_number}`)
      return { success: true, id: "mock_id" }
    }

    const { data: result, error: sendErr } = await resend.emails.send({
      from: sender,
      to: [toEmail],
      subject,
      react: OrderConfirmationEmail({
        orderNumber: order.order_number,
        orderDate,
        customerName: order.customer_name || "Valued Patron",
        customerEmail: toEmail,
        customerPhone: order.phone || "",
        paymentMethod: isCod ? "cod" : "card",
        items: orderItems,
        subtotalAed: formatAED(subtotalFils),
        deliveryFeeAed: deliveryFeeFils === 0 ? "Complimentary" : formatAED(deliveryFeeFils),
        vatAed: formatAED(vatFils),
        totalAed: formatAED(totalFils),
        address: {
          street: order.street_address || "",
          building: order.building || undefined,
          apartment: order.apartment || undefined,
          area: order.area || "",
          emirate: order.emirate || "Dubai",
          landmark: order.landmark || undefined,
        },
        storeEmail: settings.store_email || "concierge@arboutique.ae",
        storePhone: settings.store_phone || "+971 50 123 4567",
        invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://arboutique.ae"}/api/invoices/${orderId}?download=1`,
      }),
    })

    if (sendErr) {
      console.error("[Email Service] Resend error:", sendErr)
      await supabase.from("order_events").insert({
        order_id: orderId,
        event_type: "email_failed",
        from_status: null,
        to_status: null,
        note: `Confirmation email failed via Resend (${toEmail}): ${sendErr.message}`,
        actor_sub: "system_resend",
      })
      return { success: false, error: sendErr.message }
    }

    // Log the event in `order_events`
    await supabase.from("order_events").insert({
      order_id: orderId,
      event_type: "email_sent",
      from_status: null,
      to_status: null,
      note: `Confirmation email successfully sent via Resend (Msg ID: ${result?.id || "ok"}) to ${toEmail}`,
      actor_sub: "system_resend",
    })

    return { success: true, id: result?.id }
  } catch (err: unknown) {
    console.error("[Email Service] Unexpected error sending confirmation:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    }
  }
}

/**
 * Sends a notification to the Boutique Admin / Operations team for a new order.
 */
export async function sendAdminNewOrderNotification(orderId: string): Promise<SendEmailResult> {
  try {
    const supabase = createAdminClient()
    const settings = await getStoreSettings()

    const adminEmail = settings.admin_notification_email || settings.store_email
    if (!adminEmail) {
      return { success: false, error: "No admin notification email configured in Store Settings" }
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single()

    if (orderErr || !order) {
      return { success: false, error: "Order not found" }
    }

    const { count: itemCount } = await supabase
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .eq("order_id", orderId)

    const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString("en-AE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    const isCod = order.payment_method === "cod"
    const totalAed = formatAED(order.total_fils || 0)
    const sender = getSenderAddress(settings.store_name || "AR Boutique")
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://arboutique.ae"
    const adminOrderUrl = `${appUrl}/admin/orders/${order.id}`

    const resend = getResendClient()
    if (!resend) {
      console.log(`[Email Mock] Would send admin notification to ${adminEmail} for order ${order.order_number}`)
      return { success: true, id: "mock_id" }
    }

    const { data: result, error: sendErr } = await resend.emails.send({
      from: sender,
      to: [adminEmail],
      subject: `[New Order] #${order.order_number} - ${order.customer_name || "Customer"} (${totalAed})`,
      react: AdminNewOrderEmail({
        orderNumber: order.order_number,
        orderDate,
        customerName: order.customer_name || "Valued Patron",
        customerEmail: order.email || "No email",
        customerPhone: order.phone || "No phone",
        paymentMethod: isCod ? "cod" : "card",
        totalAed,
        itemCount: itemCount || 1,
        adminOrderUrl,
        emirate: order.emirate || "Dubai",
      }),
    })

    if (sendErr) {
      console.error("[Email Service] Resend admin alert error:", sendErr)
      return { success: false, error: sendErr.message }
    }

    return { success: true, id: result?.id }
  } catch (err: unknown) {
    console.error("[Email Service] Unexpected error sending admin notification:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    }
  }
}

/**
 * Sends an Order Shipped email with courier name and tracking details to the customer.
 */
export async function sendOrderShippedEmail(
  orderId: string,
  courier?: string,
  trackingNumber?: string,
  recipientEmail?: string
): Promise<SendEmailResult> {
  try {
    const supabase = createAdminClient()
    const settings = await getStoreSettings()

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single()

    const toEmail = recipientEmail?.trim() || order?.email
    if (orderErr || !order || !toEmail) {
      return { success: false, error: "Order not found or has no email" }
    }

    const { data: items } = await supabase
      .from("order_items")
      .select("product_name, colour_name, size_name, sku, quantity")
      .eq("order_id", orderId)

    const shippedItems = (items || []).map((it) => ({
      product_name: it.product_name || "Garment",
      colour_name: it.colour_name || "Standard",
      size_name: it.size_name || null,
      sku: it.sku || null,
      quantity: it.quantity || 1,
    }))

    const sender = getSenderAddress(settings.store_name || "AR Boutique")
    const resend = getResendClient()
    if (!resend) {
      console.log(`[Email Mock] Would send shipped email to ${toEmail} for order ${order.order_number}`)
      return { success: true, id: "mock_id" }
    }

    const deliveryAddress = [
      order.building,
      order.street_address,
      order.area,
      order.emirate ? `${order.emirate}, UAE` : "UAE",
    ]
      .filter(Boolean)
      .join(", ")

    const { data: result, error: sendErr } = await resend.emails.send({
      from: sender,
      to: [toEmail],
      subject: `Your AR Boutique Order #${order.order_number} has Shipped`,
      react: OrderShippedEmail({
        orderNumber: order.order_number,
        customerName: order.customer_name || "Valued Patron",
        customerPhone: order.phone || "",
        courier: courier || order.courier || "Express Boutique Courier",
        trackingNumber: trackingNumber || order.tracking_number || undefined,
        items: shippedItems,
        deliveryAddress,
        storeEmail: settings.store_email || "concierge@arboutique.ae",
        storePhone: settings.store_phone || "+971 50 123 4567",
      }),
    })

    if (sendErr) {
      console.error("[Email Service] Resend shipped error:", sendErr)
      return { success: false, error: sendErr.message }
    }

    await supabase.from("order_events").insert({
      order_id: orderId,
      event_type: "email_sent",
      note: `Shipped notification email sent via Resend (Msg ID: ${result?.id || "ok"}) to ${toEmail}`,
      actor_sub: "system_resend",
    })

    return { success: true, id: result?.id }
  } catch (err: unknown) {
    console.error("[Email Service] Error sending shipped email:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

/**
 * Sends an Order Cancellation email to the customer.
 */
export async function sendOrderCancelledEmail(
  orderId: string,
  cancellationReason?: string,
  recipientEmail?: string
): Promise<SendEmailResult> {
  try {
    const supabase = createAdminClient()
    const settings = await getStoreSettings()

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single()

    const toEmail = recipientEmail?.trim() || order?.email
    if (orderErr || !order || !toEmail) {
      return { success: false, error: "Order not found or has no email" }
    }

    const sender = getSenderAddress(settings.store_name || "AR Boutique")
    const resend = getResendClient()
    if (!resend) {
      console.log(`[Email Mock] Would send cancelled email to ${toEmail} for order ${order.order_number}`)
      return { success: true, id: "mock_id" }
    }

    const { data: result, error: sendErr } = await resend.emails.send({
      from: sender,
      to: [toEmail],
      subject: `Order #${order.order_number} Cancellation - AR Boutique`,
      react: OrderCancelledEmail({
        orderNumber: order.order_number,
        customerName: order.customer_name || "Valued Patron",
        cancellationReason: cancellationReason || order.cancellation_reason || undefined,
        paymentMethod: order.payment_method === "cod" ? "cod" : "card",
        storeEmail: settings.store_email || "concierge@arboutique.ae",
        storePhone: settings.store_phone || "+971 50 123 4567",
      }),
    })

    if (sendErr) {
      console.error("[Email Service] Resend cancellation error:", sendErr)
      return { success: false, error: sendErr.message }
    }

    await supabase.from("order_events").insert({
      order_id: orderId,
      event_type: "email_sent",
      note: `Cancellation email sent via Resend (Msg ID: ${result?.id || "ok"}) to ${toEmail}`,
      actor_sub: "system_resend",
    })

    return { success: true, id: result?.id }
  } catch (err: unknown) {
    console.error("[Email Service] Error sending cancellation email:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

/**
 * Sends return acknowledgement to the customer and alert to the admin operations team.
 */
export async function sendReturnRequestedEmails(returnId: string): Promise<SendEmailResult> {
  try {
    const supabase = createAdminClient()
    const settings = await getStoreSettings()

    // 1. Fetch return details
    const { data: ret, error: retErr } = await supabase
      .from("return_requests")
      .select("*, orders(order_number, payment_method)")
      .eq("id", returnId)
      .single()

    if (retErr || !ret || !ret.email) {
      return { success: false, error: "Return request not found or has no email" }
    }

    // 2. Fetch return items
    const { data: items } = await supabase
      .from("return_items")
      .select("product_name, colour_name, size_label, quantity, reason")
      .eq("return_id", returnId)

    const returnItems = (items || []).map((it) => ({
      product_name: it.product_name || "Garment",
      colour_name: it.colour_name || "Standard",
      size_name: it.size_label || null,
      quantity: it.quantity || 1,
      reason: it.reason || "General return",
    }))

    const orderNumber = (ret.orders as any)?.order_number || "Order"
    const sender = getSenderAddress(settings.store_name || "AR Boutique")
    const resend = getResendClient()
    if (!resend) {
      console.log(`[Email Mock] Would send return confirmation to ${ret.email} for return ${ret.return_number}`)
      return { success: true, id: "mock_id" }
    }

    // Send customer acknowledgement
    await resend.emails.send({
      from: sender,
      to: [ret.email],
      subject: `Return Request Received #${ret.return_number} - AR Boutique`,
      react: ReturnRequestedEmail({
        returnNumber: ret.return_number,
        orderNumber,
        customerName: ret.customer_name || "Valued Patron",
        items: returnItems,
        customerComment: ret.customer_comment || undefined,
        isBankTransferRefund: Boolean(ret.iban),
        bankDetails: ret.iban
          ? {
              bankName: ret.bank_name || "UAE Bank",
              accountHolderName: ret.account_holder_name || ret.customer_name || "Account Holder",
              iban: ret.iban,
            }
          : undefined,
        storeEmail: settings.store_email || "concierge@arboutique.ae",
        storePhone: settings.store_phone || "+971 50 123 4567",
      }),
    })

    // Alert admin if configured
    const adminEmail = settings.admin_notification_email || settings.store_email
    if (adminEmail) {
      await resend.emails.send({
        from: sender,
        to: [adminEmail],
        subject: `[New Return Request] #${ret.return_number} from ${ret.customer_name || "Customer"}`,
        react: AdminNewOrderEmail({
          orderNumber: `${ret.return_number} (${orderNumber})`,
          orderDate: new Date().toLocaleDateString("en-AE"),
          customerName: ret.customer_name || "Customer",
          customerEmail: ret.email,
          customerPhone: ret.phone || "N/A",
          paymentMethod: (ret.orders as any)?.payment_method === "cod" ? "cod" : "card",
          totalAed: "Review items",
          itemCount: returnItems.length,
          adminOrderUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://arboutique.ae"}/admin/returns/${ret.id}`,
          emirate: "UAE",
        }),
      }).catch((e) => console.warn("Admin return alert email warning:", e))
    }

    await supabase.from("return_events").insert({
      return_id: returnId,
      event_type: "email_sent",
      note: `Return request confirmation email sent to ${ret.email}`,
      actor_sub: "system_resend",
    })

    return { success: true }
  } catch (err: unknown) {
    console.error("[Email Service] Error sending return emails:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

/**
 * Sends return decision email (Approved with instructions OR Rejected with reason).
 */
export async function sendReturnDecisionEmail(
  returnId: string,
  status: "approved" | "rejected",
  instructionsOrReason: string
): Promise<SendEmailResult> {
  try {
    const supabase = createAdminClient()
    const settings = await getStoreSettings()

    const { data: ret, error: retErr } = await supabase
      .from("return_requests")
      .select("*, orders(order_number)")
      .eq("id", returnId)
      .single()

    if (retErr || !ret || !ret.email) {
      return { success: false, error: "Return request not found or has no email" }
    }

    const orderNumber = (ret.orders as any)?.order_number || "Order"
    const sender = getSenderAddress(settings.store_name || "AR Boutique")
    const resend = getResendClient()
    if (!resend) {
      console.log(`[Email Mock] Would send return ${status} to ${ret.email} for return ${ret.return_number}`)
      return { success: true, id: "mock_id" }
    }

    const subject =
      status === "approved"
        ? `Return Approved: Instructions for Return #${ret.return_number} - AR Boutique`
        : `Update on Return Request #${ret.return_number} - AR Boutique`

    const { data: result, error: sendErr } = await resend.emails.send({
      from: sender,
      to: [ret.email],
      subject,
      react: ReturnDecisionEmail({
        returnNumber: ret.return_number,
        orderNumber,
        customerName: ret.customer_name || "Valued Patron",
        status,
        instructionsOrReason,
        storeEmail: settings.store_email || "concierge@arboutique.ae",
        storePhone: settings.store_phone || "+971 50 123 4567",
      }),
    })

    if (sendErr) {
      return { success: false, error: sendErr.message }
    }

    await supabase.from("return_events").insert({
      return_id: returnId,
      event_type: "email_sent",
      note: `Return ${status} email sent via Resend to ${ret.email}`,
      actor_sub: "system_resend",
    })

    return { success: true, id: result?.id }
  } catch (err: unknown) {
    console.error("[Email Service] Error sending return decision email:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

/**
 * Sends a Refund Confirmation email to the customer for a processed card reversal or COD bank transfer.
 */
export async function sendRefundConfirmationEmail(input: {
  refundId?: string
  returnId?: string
  orderId: string
  amountFils: number
  method: "card" | "bank_transfer"
  bankTransferDate?: string
  bankTransferReference?: string
}): Promise<SendEmailResult> {
  try {
    const supabase = createAdminClient()
    const settings = await getStoreSettings()

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("order_number, email, customer_name")
      .eq("id", input.orderId)
      .single()

    if (orderErr || !order || !order.email) {
      return { success: false, error: "Order not found or has no email" }
    }

    let returnNumber: string | undefined
    if (input.returnId) {
      const { data: ret } = await supabase
        .from("return_requests")
        .select("return_number")
        .eq("id", input.returnId)
        .single()
      if (ret) returnNumber = ret.return_number
    }

    const sender = getSenderAddress(settings.store_name || "AR Boutique")
    const resend = getResendClient()
    if (!resend) {
      console.log(`[Email Mock] Would send refund email to ${order.email} for order ${order.order_number}`)
      return { success: true, id: "mock_id" }
    }

    const refundAmountAed = formatAED(input.amountFils)

    const { data: result, error: sendErr } = await resend.emails.send({
      from: sender,
      to: [order.email],
      subject: `Refund Processed: ${refundAmountAed} - AR Boutique`,
      react: RefundConfirmationEmail({
        orderNumber: order.order_number,
        returnNumber,
        customerName: order.customer_name || "Valued Patron",
        refundAmountAed,
        method: input.method,
        bankTransferDate: input.bankTransferDate || new Date().toLocaleDateString("en-AE"),
        bankTransferReference: input.bankTransferReference || undefined,
        storeEmail: settings.store_email || "concierge@arboutique.ae",
        storePhone: settings.store_phone || "+971 50 123 4567",
      }),
    })

    if (sendErr) {
      return { success: false, error: sendErr.message }
    }

    await supabase.from("order_events").insert({
      order_id: input.orderId,
      event_type: "email_sent",
      note: `Refund confirmation email of ${refundAmountAed} sent via Resend to ${order.email}`,
      actor_sub: "system_resend",
    })

    return { success: true, id: result?.id }
  } catch (err: unknown) {
    console.error("[Email Service] Error sending refund email:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

