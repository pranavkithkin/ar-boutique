import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { AnnouncementBar } from "@/components/store/AnnouncementBar"
import { StoreHeader } from "@/components/store/StoreHeader"
import { StoreFooter } from "@/components/store/StoreFooter"
import { StoreButton } from "@/components/store/StoreButton"
import { Badge } from "@/components/ui/badge"
import { createAdminClient } from "@/lib/supabase/server"
import { formatAED } from "@/lib/money"
import { STORE_CONTACT } from "@/lib/contact"
import {
  CheckCircle2,
  PhoneCall,
  MessageCircle,
  MapPin,
  Clock,
  Package,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"

interface ReceivedPageProps {
  params: Promise<{
    orderNumber: string
  }>
}

export async function generateMetadata({
  params,
}: ReceivedPageProps): Promise<Metadata> {
  const { orderNumber } = await params
  return {
    title: `Order Received #${orderNumber} | AR Boutique`,
    description: `Your AR Boutique order #${orderNumber} has been received. Cash on delivery confirmation in progress.`,
  }
}

export default async function CodOrderReceivedPage({ params }: ReceivedPageProps) {
  const { orderNumber } = await params
  const decodedOrderNumber = decodeURIComponent(orderNumber)

  const supabase = createAdminClient()
  const { data: order } = await supabase
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
        media_key,
        unit_price_fils,
        quantity,
        total_fils
      )
    `
    )
    .eq("order_number", decodedOrderNumber)
    .maybeSingle()

  const phoneToCall = order?.phone || STORE_CONTACT.phone
  const totalToPayFils = order?.total_fils || 0

  const whatsappHref = `${STORE_CONTACT.whatsappHref}?text=${encodeURIComponent(
    `Hello AR Boutique Concierge, I placed order ${decodedOrderNumber} via Cash on Delivery and would like to confirm my delivery.`
  )}`

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-8">
        {/* Order Received Header Banner */}
        <div className="bg-card border border-border rounded-xs p-6 sm:p-10 shadow-xs text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
                Order Placed Successfully
              </span>
              <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-[10px] uppercase font-semibold">
                Awaiting Confirmation
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-sans font-semibold tracking-tight text-foreground">
              Order Received
            </h1>
            <p className="text-base font-mono text-muted-foreground">
              Reference #{decodedOrderNumber}
            </p>
          </div>

          {/* Prominent Amount to Pay on Delivery per ADR-033 */}
          <div className="max-w-md mx-auto p-4 bg-secondary/50 rounded-xs border border-border mt-4">
            <span className="block text-xs uppercase font-medium tracking-wider text-muted-foreground mb-1">
              Amount to Pay Upon Doorstep Delivery
            </span>
            <span className="block text-3xl sm:text-4xl font-sans font-semibold text-foreground tabular-nums">
              {formatAED(totalToPayFils)}
            </span>
            <span className="block text-[11px] text-muted-foreground mt-1">
              Please have exact cash ready for the courier. No payment is taken now.
            </span>
          </div>

          <div className="max-w-lg mx-auto text-xs text-muted-foreground leading-relaxed pt-2">
            <p>
              We will call or message you on{" "}
              <strong className="text-foreground font-mono">{phoneToCall}</strong> within{" "}
              <strong>24 hours</strong> to verify your delivery address and schedule delivery.
            </p>
          </div>

          {/* Direct WhatsApp Concierge Confirmation Button */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background font-medium text-xs uppercase tracking-wider rounded-none hover:bg-foreground/90 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Confirm via WhatsApp Concierge</span>
            </a>
          </div>
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Destination Details */}
          <div className="bg-card border border-border rounded-xs p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Delivery Destination
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
                  {order.landmark && (
                    <p className="italic text-[11px] text-muted-foreground">
                      Landmark: {order.landmark}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Your delivery destination has been registered. Our concierge team will confirm prior to dispatch.
              </p>
            )}
          </div>

          {/* Next Steps Card */}
          <div className="bg-card border border-border rounded-xs p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                What Happens Next?
              </h3>
            </div>

            <ul className="text-xs text-muted-foreground space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[11px] font-mono shrink-0 mt-0.5 text-foreground font-semibold">
                  1
                </span>
                <span>Our boutique concierge will call or message your phone to verify the delivery slot.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[11px] font-mono shrink-0 mt-0.5 text-foreground font-semibold">
                  2
                </span>
                <span>Your garment is packed in luxury signature packaging and dispatched across the UAE.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[11px] font-mono shrink-0 mt-0.5 text-foreground font-semibold">
                  3
                </span>
                <span>Hand exact cash to our delivery driver upon doorstep delivery.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Ordered Pieces Table */}
        {order && order.order_items && order.order_items.length > 0 && (
          <div className="bg-card border border-border rounded-xs p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Package className="w-4 h-4 text-primary" />
                Reserved Pieces ({order.order_items.length})
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Stock held for your order
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

            {/* Financial Summary */}
            <div className="border-t border-border pt-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums font-mono">{formatAED(order.subtotal_fils)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Doorstep Delivery</span>
                <span className="tabular-nums font-mono">
                  {order.delivery_fee_fils === 0 ? "FREE" : formatAED(order.delivery_fee_fils)}
                </span>
              </div>
              {order.cod_fee_fils > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>COD Service Fee</span>
                  <span className="tabular-nums font-mono">{formatAED(order.cod_fee_fils)}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] text-muted-foreground/80">
                <span>Included 5% UAE VAT</span>
                <span className="tabular-nums font-mono">{formatAED(order.vat_fils)}</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between font-semibold text-foreground text-sm">
                <span>Total to Pay in Cash</span>
                <span className="tabular-nums font-mono text-base">
                  {formatAED(order.total_fils)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link href="/account" className="w-full sm:w-auto">
            <StoreButton variant="outline" className="w-full sm:w-auto h-11 px-8 text-xs uppercase tracking-widest">
              View in My Account
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
