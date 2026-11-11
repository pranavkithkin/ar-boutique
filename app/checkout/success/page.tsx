import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { AnnouncementBar } from "@/components/store/AnnouncementBar"
import { StoreHeader } from "@/components/store/StoreHeader"
import { StoreFooter } from "@/components/store/StoreFooter"
import { StoreButton } from "@/components/store/StoreButton"
import { Badge } from "@/components/ui/badge"
import { createAdminClient } from "@/lib/supabase/server"
import { getStripeServer } from "@/lib/stripe"
import { formatAED } from "@/lib/money"
import { ClearCartOnSuccess } from "@/features/checkout/components/ClearCartOnSuccess"
import {
  CheckCircle2,
  Package,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Order Status | AR Boutique",
  robots: { index: false, follow: false },
  description: "Your AR Boutique order details and fulfillment status.",
}

interface SuccessOrderItem {
  id: string
  product_name: string
  colour_name?: string | null
  size_label?: string | null
  sku: string
  unit_price_fils: number
  quantity: number
  total_fils: number
}

interface SuccessOrder {
  clerk_user_id?: string | null
  stripe_session_id?: string | null
  id: string
  order_number: string
  customer_name: string
  email: string
  phone: string
  building: string
  apartment?: string | null
  street_address: string
  area: string
  emirate: string
  payment_method: string
  payment_status: string
  status: string
  subtotal_fils?: number
  discount_fils?: number
  total_fils: number
  order_items: SuccessOrderItem[]
}

interface SuccessPageProps {
  searchParams: Promise<{
    orderNumber?: string
    session_id?: string
  }>
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { orderNumber, session_id } = await searchParams
  const decodedOrderNumber = orderNumber ? decodeURIComponent(orderNumber) : null

  // 1. Fetch current signed-in customer (if any)
  let clerkUserId: string | null = null
  try {
    const authState = await auth()
    clerkUserId = authState.userId
  } catch {
    // Guest checkout
  }

  // 2. Fetch order record
  let order: SuccessOrder | null = null
  if (decodedOrderNumber) {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          id,
          product_name,
          colour_name,
          size_label,
          sku,
          unit_price_fils,
          quantity,
          total_fils
        )
      `
      )
      .eq("order_number", decodedOrderNumber)
      .maybeSingle()
    order = (data as unknown) as SuccessOrder | null
  }

  // 3. Verify Stripe checkout session (if provided)
  let isSessionVerified = false
  let stripePaymentStatus: string | null = null

  if (session_id) {
    try {
      const stripe = getStripeServer()
      const session = await stripe.checkout.sessions.retrieve(session_id)
      stripePaymentStatus = session.payment_status

      if (
        order &&
        (order.id === session.client_reference_id ||
          order.id === session.metadata?.order_id ||
          order.order_number === session.metadata?.order_number)
      ) {
        isSessionVerified = true
      }
    } catch (err) {
      console.warn("[Checkout Success] Stripe session verification error:", err)
    }
  }

  // 4. Determine verified viewer permissions (prevents leaking PII if orderNumber is guessed)
  const isAuthorizedViewer =
    Boolean(isSessionVerified) ||
    Boolean(clerkUserId && order?.clerk_user_id && clerkUserId === order.clerk_user_id)

  const isPaid =
    order?.payment_status === "paid" ||
    (isSessionVerified && stripePaymentStatus === "paid")

  const isCod = order?.payment_method === "cod"

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Only clear cart on genuine confirmed payment or COD submission */}
      {(isPaid || isCod) && <ClearCartOnSuccess />}
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-8">
        {/* Success / Status Header Banner */}
        <div className="bg-card border border-border rounded-xs p-6 sm:p-10 shadow-xs text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2">
              <span className="text-[11px] font-sans font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {isPaid ? "Payment Verified" : isCod ? "Order Placed" : "Payment Processing"}
              </span>
              <Badge
                className={`text-[10px] uppercase font-semibold ${
                  isPaid
                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                    : isCod
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-amber-500/10 text-amber-700 border-amber-500/30"
                }`}
              >
                {isPaid ? "Confirmed & Paid" : isCod ? "Cash on Delivery" : "Awaiting Confirmation"}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-sans font-semibold tracking-tight text-foreground">
              {isPaid
                ? "Thank You for Your Order"
                : isCod
                ? "Your COD Order is Received"
                : "Payment Being Confirmed"}
            </h1>
            {decodedOrderNumber && (
              <p className="text-base font-sans font-medium text-muted-foreground">
                Order #{decodedOrderNumber}
              </p>
            )}
          </div>

          <div className="max-w-md mx-auto text-xs text-muted-foreground leading-relaxed pt-2">
            <p>
              {isPaid
                ? "Your payment has been successfully authorized and confirmed. A confirmation receipt has been recorded and sent to your email."
                : isCod
                ? "Your order has been recorded. Our concierge team will reach out to confirm your delivery schedule."
                : "Your payment has been received and is currently being confirmed by your payment provider. Your receipt will be emailed once settled."}
            </p>
          </div>
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Destination Details */}
          <div className="bg-card border border-border rounded-xs p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Delivery Details
              </h3>
            </div>

            {order ? (
              isAuthorizedViewer ? (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground text-sm">
                    {order.customer_name}
                  </p>
                  <p>{order.email}</p>
                  <p className="font-sans">{order.phone}</p>
                  <div className="pt-2 border-t border-border/40 mt-2 space-y-0.5">
                    <p>
                      {order.building}
                      {order.apartment ? `, ${order.apartment}` : ""}
                    </p>
                    <p>{order.street_address}</p>
                    <p className="font-medium text-foreground">
                      {order.area}, {order.emirate}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground space-y-2">
                  <div className="flex items-center gap-1.5 text-foreground font-medium">
                    <ShieldCheck className="size-4 text-primary" />
                    <span>Privacy Protected</span>
                  </div>
                  <p className="leading-relaxed">
                    Personal delivery information is hidden. To view complete order milestones or request updates, please visit{" "}
                    <Link href="/track-order" className="underline font-medium text-foreground">
                      Track Order
                    </Link>{" "}
                    with your email address.
                  </p>
                </div>
              )
            ) : (
              <p className="text-xs text-muted-foreground">
                Your order is confirmed and will be dispatched to your registered address across the UAE.
              </p>
            )}
          </div>

          {/* Fulfillment Milestones */}
          <div className="bg-card border border-border rounded-xs p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Delivery Schedule
              </h3>
            </div>

            <ul className="text-xs text-muted-foreground space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-[11px] font-mono shrink-0 mt-0.5 font-semibold">
                  ✓
                </span>
                <span>
                  {isPaid
                    ? "Payment confirmed & verified securely with 256-bit SSL encryption."
                    : isCod
                    ? "Cash on delivery registered. Amount due upon courier handover."
                    : "Payment processing securely with 256-bit SSL encryption."}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[11px] font-mono shrink-0 mt-0.5 text-foreground font-semibold">
                  2
                </span>
                <span>Packed with luxury garment care and dispatched in 1–2 working days.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[11px] font-mono shrink-0 mt-0.5 text-foreground font-semibold">
                  3
                </span>
                <span>Track doorstep delivery milestones directly inside your client account.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Ordered Pieces Table */}
        {order && order.order_items && order.order_items.length > 0 && isAuthorizedViewer && (
          <div className="bg-card border border-border rounded-xs p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Package className="w-4 h-4 text-primary" />
                Purchased Pieces ({order.order_items.length})
              </h3>
              <span className="text-[11px] text-muted-foreground">
                {isPaid ? "Paid in Full" : isCod ? "Pay on Delivery" : "Payment Pending"}
              </span>
            </div>

            <div className="divide-y divide-border/50">
              {order.order_items.map((item: SuccessOrderItem) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">
                      {item.product_name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {item.colour_name} • Size: {item.size_label || "Standard"} • Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-foreground font-sans">
                    {formatAED(item.total_fils)}
                  </div>
                </div>
              ))}
            </div>

            {!!order.discount_fils && order.discount_fils > 0 && (
              <div className="border-t border-border pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-sans">{formatAED(order.subtotal_fils || 0)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                  <span>Promotional Discount</span>
                  <span className="tabular-nums font-sans">-{formatAED(order.discount_fils)}</span>
                </div>
              </div>
            )}

            <div className="border-t border-border/60 pt-3 flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Total Order Amount</span>
              <span className="text-sm font-bold text-foreground font-sans">
                {formatAED(order.total_fils)}
              </span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link href="/account" className="w-full sm:w-auto">
            <StoreButton variant="outline" className="w-full sm:w-auto h-11 px-8 text-xs uppercase tracking-widest">
              View Order in Account
            </StoreButton>
          </Link>

          <Link href="/collections" className="w-full sm:w-auto">
            <StoreButton className="w-full sm:w-auto h-11 px-8 text-xs uppercase tracking-widest flex items-center justify-center gap-2">
              <span>Continue Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </StoreButton>
          </Link>
        </div>
      </main>

      <StoreFooter />
    </div>
  )
}
