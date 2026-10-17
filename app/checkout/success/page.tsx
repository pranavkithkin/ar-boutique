import type { Metadata } from "next"
import Link from "next/link"
import { AnnouncementBar } from "@/components/store/AnnouncementBar"
import { StoreHeader } from "@/components/store/StoreHeader"
import { StoreFooter } from "@/components/store/StoreFooter"
import { StoreButton } from "@/components/store/StoreButton"
import { Badge } from "@/components/ui/badge"
import { createAdminClient } from "@/lib/supabase/server"
import { formatAED } from "@/lib/money"
import {
  CheckCircle2,
  Package,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Order Confirmed | AR Boutique",
  description: "Your payment has been confirmed and your AR Boutique order is being processed.",
}

interface SuccessPageProps {
  searchParams: Promise<{
    orderNumber?: string
  }>
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { orderNumber } = await searchParams
  const decodedOrderNumber = orderNumber ? decodeURIComponent(orderNumber) : null

  let order: any = null
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
    order = data
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-8">
        {/* Success Header Banner */}
        <div className="bg-card border border-border rounded-xs p-6 sm:p-10 shadow-xs text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
                Payment Authorized
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[10px] uppercase font-semibold">
                Confirmed & Paid
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-sans font-semibold tracking-tight text-foreground">
              Thank You for Your Order
            </h1>
            {decodedOrderNumber && (
              <p className="text-base font-mono text-muted-foreground">
                Order #{decodedOrderNumber}
              </p>
            )}
          </div>

          <div className="max-w-md mx-auto text-xs text-muted-foreground leading-relaxed pt-2">
            <p>
              Your payment has been successfully authorized and confirmed. A confirmation receipt
              has been recorded and sent to your email.
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
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground text-sm">
                  {order.customer_name}
                </p>
                <p>{order.email}</p>
                <p className="font-mono">{order.phone}</p>
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
                <span>Payment confirmed & verified securely with 256-bit SSL encryption.</span>
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

        {/* Ordered Pieces Table (if available) */}
        {order && order.order_items && order.order_items.length > 0 && (
          <div className="bg-card border border-border rounded-xs p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Package className="w-4 h-4 text-primary" />
                Purchased Pieces ({order.order_items.length})
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Paid in Full
              </span>
            </div>

            <div className="divide-y divide-border/50">
              {order.order_items.map((item: any) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">
                      {item.product_name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {item.colour_name} • Size: {item.size_label || "Standard"} • Qty: {item.quantity}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      SKU: {item.sku}
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-foreground tabular-nums font-mono">
                    {formatAED(item.total_fils)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 flex justify-between font-semibold text-foreground text-sm">
              <span>Total Paid</span>
              <span className="tabular-nums font-mono text-base">
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
