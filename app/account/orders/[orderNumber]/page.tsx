import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound, redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"
import { isClerkConfigured } from "@/lib/clerk"
import { getCurrentCustomerAction } from "@/features/auth/actions"
import { getCustomerOrderDetailsAction } from "@/features/account/actions"
import { OrderCancelButton } from "@/features/account/components/OrderCancelButton"
import { AnnouncementBar } from "@/components/store/AnnouncementBar"
import { StoreHeader } from "@/components/store/StoreHeader"
import { StoreFooter } from "@/components/store/StoreFooter"
import { StoreButton } from "@/components/store/StoreButton"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { formatAED } from "@/lib/money"
import { STORE_CONTACT } from "@/lib/contact"
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileText,
  RotateCcw,
  MessageCircle,
  MapPin,
  CreditCard,
  Banknote,
  ShieldCheck,
  AlertCircle,
} from "lucide-react"

interface OrderDetailsPageProps {
  params: Promise<{
    orderNumber: string
  }>
}

export async function generateMetadata({
  params,
}: OrderDetailsPageProps): Promise<Metadata> {
  const { orderNumber } = await params
  return {
    title: `Order ${orderNumber} | AR Boutique`,
    description: `Track doorstep delivery, view item details, and download tax invoices for order ${orderNumber}.`,
  }
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { orderNumber } = await params

  // 1. Resolve customer session
  let email: string | undefined
  if (isClerkConfigured()) {
    try {
      const { userId } = await auth()
      if (userId) {
        const clerkUser = await currentUser()
        email = clerkUser?.primaryEmailAddress?.emailAddress
      }
    } catch {
      // Ignore
    }
  }

  if (!email) {
    try {
      const customer = await getCurrentCustomerAction()
      if (customer) {
        email = customer.email
      }
    } catch {
      // Ignore
    }
  }

  if (!email) {
    redirect(`/sign-in?redirect=/account/orders/${orderNumber}`)
  }

  // 2. Fetch order details with security verification
  const res = await getCustomerOrderDetailsAction(orderNumber, email)
  if (!res.success || !res.order) {
    notFound()
  }

  const order = res.order

  // Timeline step active flags
  const isCancelled = order.status === "cancelled"
  const isDelivered = order.status === "delivered"
  const isShipped = order.status === "shipped" || isDelivered
  const isPacked = order.status === "packed" || isShipped || isDelivered
  const isConfirmed = order.status === "confirmed" || isPacked || isShipped || isDelivered
  const isPending = order.status === "pending"

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 pb-20">
        {/* Masthead */}
        <section className="border-b border-border/50 bg-muted/20 py-8 md:py-10">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="hover:text-foreground">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/account" className="hover:text-foreground">
                    Account
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{order.orderNumber}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <Link
                  href="/account"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2 font-sans"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Orders</span>
                </Link>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-sans font-semibold tracking-tight text-foreground">
                    Order {order.orderNumber}
                  </h1>
                  {order.status === "delivered" && (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-sans font-medium text-xs">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Delivered
                    </Badge>
                  )}
                  {order.status === "shipped" && (
                    <Badge className="bg-primary text-primary-foreground font-sans font-medium text-xs">
                      <Truck className="mr-1 h-3.5 w-3.5 animate-pulse" />
                      Out for Delivery
                    </Badge>
                  )}
                  {order.status === "packed" && (
                    <Badge className="bg-secondary text-secondary-foreground border border-border font-sans font-medium text-xs">
                      <Package className="mr-1 h-3.5 w-3.5" />
                      Being Prepared
                    </Badge>
                  )}
                  {order.status === "confirmed" && (
                    <Badge className="bg-secondary text-secondary-foreground border border-border font-sans font-medium text-xs">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-primary" />
                      Confirmed
                    </Badge>
                  )}
                  {order.status === "pending" && (
                    <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-sans font-medium text-xs">
                      <Clock className="mr-1 h-3.5 w-3.5" />
                      {order.paymentMethod === "cod" ? "Awaiting Confirmation" : "Pending Payment"}
                    </Badge>
                  )}
                  {order.status === "cancelled" && (
                    <Badge variant="destructive" className="font-sans font-medium text-xs">
                      <AlertCircle className="mr-1 h-3.5 w-3.5" />
                      Cancelled
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Placed on {order.date} • {order.items.length} {order.items.length === 1 ? "garment" : "garments"}
                </p>
              </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`/api/invoices/${order.id}?print=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-card border border-border text-foreground font-medium rounded-xs hover:bg-muted/50 transition-colors text-xs"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Tax Invoice PDF</span>
                  </a>
                  <a
                    href={STORE_CONTACT.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-card border border-border text-foreground font-medium rounded-xs hover:bg-muted/50 transition-colors text-xs"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>WhatsApp Concierge</span>
                  </a>
                </div>
              </div>
            </div>
        </section>

        {/* Content Workspace */}
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Tracking Progress Section */}
          {!isCancelled && (
            <div className="bg-card border border-border rounded-xs p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    Delivery Progression
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.courierName
                      ? `Carrier: ${order.courierName} • Waybill #${order.trackingNumber || "Pending"}`
                      : "Handcrafted and prepared with white-glove courier handling across the UAE."}
                  </p>
                </div>
                {order.trackingNumber && (
                  <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-xs border border-border/50 self-start sm:self-auto">
                    Tracking: {order.trackingNumber}
                  </span>
                )}
              </div>

              {/* Progress Milestones */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                {/* 1. Confirmed / Awaiting Confirmation */}
                <div
                  className={`p-4 rounded-xs border transition-colors ${
                    isConfirmed && !isPending
                      ? "bg-muted/30 border-primary/40 text-foreground"
                      : isPending
                      ? "bg-amber-500/5 border-amber-500/30 text-foreground"
                      : "bg-muted/10 border-border/50 text-muted-foreground opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {isConfirmed && !isPending ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : isPending ? (
                      <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      1. {isPending ? "Pending Confirmation" : "Confirmed"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {isPending
                      ? order.paymentMethod === "cod"
                        ? "Order placed. Awaiting concierge phone or WhatsApp confirmation."
                        : "Order initiated. Awaiting card payment confirmation."
                      : "Order confirmed and allocated for atelier preparation."}
                  </p>
                </div>

                {/* 2. Packed */}
                <div
                  className={`p-4 rounded-xs border transition-colors ${
                    order.status === "packed"
                      ? "bg-primary/5 border-primary text-foreground"
                      : isPacked
                      ? "bg-muted/30 border-primary/40 text-foreground"
                      : "bg-muted/10 border-border/50 text-muted-foreground opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Package
                      className={`h-4 w-4 ${
                        order.status === "packed" || isPacked
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      2. Prepared
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Packed in signature luxury packaging with garment tags.
                  </p>
                </div>

                {/* 3. Shipped */}
                <div
                  className={`p-4 rounded-xs border transition-colors ${
                    order.status === "shipped"
                      ? "bg-primary/5 border-primary text-foreground"
                      : isDelivered
                      ? "bg-muted/30 border-primary/40 text-foreground"
                      : "bg-muted/10 border-border/50 text-muted-foreground opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Truck
                      className={`h-4 w-4 ${
                        order.status === "shipped"
                          ? "text-primary animate-pulse"
                          : isDelivered
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      3. Dispatched
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {order.courierName
                      ? `On delivery van with ${order.courierName}.`
                      : "Handed over to courier service."}
                  </p>
                </div>

                {/* 4. Delivered */}
                <div
                  className={`p-4 rounded-xs border transition-colors ${
                    isDelivered
                      ? "bg-emerald-500/10 border-emerald-500/40 text-foreground"
                      : "bg-muted/10 border-border/50 text-muted-foreground opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2
                      className={`h-4 w-4 ${
                        isDelivered
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      4. Delivered
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Doorstep signature confirmed upon recipient arrival.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cancellation Notice */}
          {isCancelled && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xs p-6 flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-destructive">
                  This order was cancelled
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {order.paymentMethod === "card" ? (
                    order.paymentStatus === "refunded" ? (
                      "Your card payment has been refunded via Stripe. Depending on your bank, it will reflect on your statement within 5–10 business days."
                    ) : (
                      "Your order is cancelled. Our boutique administration will process your full refund directly back to your original payment card via Stripe."
                    )
                  ) : (
                    "This order was placed as Cash on Delivery; your reserved items have been released with zero charge."
                  )}
                </p>
                {order.cancellationReason && (
                  <p className="text-xs text-muted-foreground mt-2 italic font-sans">
                    Reason: {order.cancellationReason}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Two-Column Order Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
  {/* Left 2 Cols: Items & Delivery Details */}
  <div className="lg:col-span-2 space-y-6">
    {/* Garment Line Items */}
    <div className="bg-card border border-border rounded-xs overflow-hidden shadow-xs">
      <div className="p-4 sm:p-5 border-b border-border bg-muted/20 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
          Purchased Pieces ({order.items.length})
        </h3>
        <span className="text-xs text-muted-foreground">
          Fils pricing compliant
        </span>
      </div>

      <div className="divide-y divide-border/40 p-4 sm:p-5">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              {/* Portrait 4:5 fashion thumbnail with object-top */}
              <div className="relative w-16 h-20 bg-muted shrink-0 border border-border overflow-hidden rounded-xs">
                {item.imageSrc ? (
                  <Image
                    src={item.imageSrc}
                    alt={item.productName}
                    fill
                    sizes="64px"
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                    No Image
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-sans font-medium text-foreground">
                  {item.productName}
                </h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                  <span>Colour: <strong className="text-foreground font-normal">{item.colourName}</strong></span>
                  <span>•</span>
                  <span>Size: <strong className="text-foreground font-normal">{item.sizeLabel}</strong></span>
                  <span>•</span>
                  <span>Style: <strong className="font-mono text-foreground font-normal">{item.styleCode}</strong></span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground font-mono">
                  Qty: <strong className="text-foreground font-normal">{item.quantity}</strong> × {formatAED(item.priceFils)}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-sm font-semibold text-foreground font-mono">
                {formatAED(item.priceFils * item.quantity)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Delivery Destination & Payment Breakdown */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Destination */}
      <div className="bg-card border border-border rounded-xs p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Delivery Destination
          </h4>
        </div>
        <div className="text-xs space-y-1">
          <div className="font-semibold text-foreground">
            {order.deliveryAddress.recipientName}
          </div>
          <div className="text-muted-foreground font-mono">
            {order.deliveryAddress.phone}
          </div>
          <div className="text-muted-foreground pt-1 leading-relaxed">
            {order.deliveryAddress.building && `${order.deliveryAddress.building}, `}
            {order.deliveryAddress.street && `${order.deliveryAddress.street}, `}
            {order.deliveryAddress.area && `${order.deliveryAddress.area}, `}
            <span className="font-medium text-foreground">{order.deliveryAddress.emirate}</span>
          </div>
          {order.deliveryAddress.landmark && (
            <div className="text-[11px] text-muted-foreground/80 italic pt-0.5">
              Landmark: {order.deliveryAddress.landmark}
            </div>
          )}
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-card border border-border rounded-xs p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
          {order.paymentMethod === "card" ? (
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Banknote className="h-4 w-4 text-muted-foreground" />
          )}
          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Payment Method
          </h4>
        </div>
        <div className="text-xs space-y-1.5">
          <div className="font-semibold text-foreground">
            {order.paymentMethod === "card"
              ? "Online Card Payment"
              : "Cash on Delivery (COD)"}
          </div>
          <p className="text-muted-foreground leading-relaxed text-[11px]">
            {order.paymentMethod === "card"
              ? "Paid securely via Stripe. Verification authorization settled."
              : "Cash to be handed directly to courier driver upon doorstep arrival."}
          </p>
          <div className="pt-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-xs border border-border/50">
              <ShieldCheck className="h-3 w-3 text-primary" />
              Status: {order.status === "cancelled" ? "Cancelled" : "Verified"}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Right 1 Col: Summary & Return Actions */}
  <div className="space-y-6">
    {/* Financial Calculation Card */}
    <div className="bg-card border border-border rounded-xs p-5 shadow-xs space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground border-b border-border/60 pb-3">
        Payment Summary
      </h3>

      <div className="space-y-2.5 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>Items Subtotal</span>
          <span className="font-mono text-foreground">{formatAED(order.subtotalFils)}</span>
        </div>

        <div className="flex justify-between text-muted-foreground">
          <span>Doorstep UAE Delivery</span>
          <span className="font-mono text-foreground">
            {order.deliveryFeeFils === 0 ? "Complimentary" : formatAED(order.deliveryFeeFils)}
          </span>
        </div>

        <div className="flex justify-between text-muted-foreground">
          <span>5% UAE VAT</span>
          <span className="font-mono text-foreground">{formatAED(order.vatFils)}</span>
        </div>

        <div className="pt-3 border-t border-border flex justify-between items-baseline font-semibold text-sm">
          <span className="text-foreground">Total (AED)</span>
          <span className="font-mono text-base text-foreground font-bold">
            {formatAED(order.totalFils)}
          </span>
        </div>
      </div>
    </div>

    {/* Returns & Concierge Assistance Card */}
    <div className="bg-card border border-border rounded-xs p-5 shadow-xs space-y-3 text-xs">
      <h4 className="font-semibold uppercase tracking-wider text-foreground border-b border-border/60 pb-2">
        Need Help or Return?
      </h4>
      <p className="text-muted-foreground leading-relaxed text-[11px]">
        All boutique pieces enjoy complimentary 7-day returns from delivery date, subject to original tags intact.
      </p>

      {order.status === "delivered" && (
        <Link href={`/account?tab=returns&orderId=${order.id}`} className="block pt-1">
          <StoreButton variant="outline" className="w-full text-xs uppercase tracking-wider h-9">
            <RotateCcw className="mr-1.5 h-3.5 w-3.5 text-primary" />
            Request Return
          </StoreButton>
        </Link>
      )}

      {!isCancelled && !isShipped && !isDelivered && (
        <div className="pt-1">
          <OrderCancelButton
            orderNumber={order.orderNumber}
            orderId={order.id}
            totalFils={order.totalFils}
            paymentMethod={order.paymentMethod}
            paymentStatus={order.paymentStatus}
            userEmail={email}
          />
        </div>
      )}

      <a
        href={STORE_CONTACT.whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="block pt-1"
      >
        <StoreButton variant="outline" className="w-full text-xs uppercase tracking-wider h-9">
          <MessageCircle className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
          WhatsApp Atelier Concierge
        </StoreButton>
      </a>
    </div>
  </div>
</div>
        </div>
      </main>

      <StoreFooter />
    </div>
  )
}
