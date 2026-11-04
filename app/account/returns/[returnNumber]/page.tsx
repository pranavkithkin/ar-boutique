import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound, redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"
import { isClerkConfigured } from "@/lib/clerk"
import { getCurrentCustomerAction } from "@/features/auth/actions"
import { getCustomerReturnDetailsAction } from "@/features/account/returns/actions"
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
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Truck,
  MessageCircle,
  Building2,
  AlertCircle,
  FileCheck2,
  PackageCheck,
  ShieldCheck,
  Camera,
  ExternalLink,
} from "lucide-react"
import { CancelReturnButton } from "@/features/account/returns/components/CancelReturnButton"

interface ReturnDetailsPageProps {
  params: Promise<{
    returnNumber: string
  }>
}

export async function generateMetadata({
  params,
}: ReturnDetailsPageProps): Promise<Metadata> {
  const { returnNumber } = await params
  return {
    title: `Return ${returnNumber} | AR Boutique`,
    description: `Track return progress, atelier inspection, courier collection instructions, and refund status for return ${returnNumber}.`,
  }
}

export default async function ReturnDetailsPage({ params }: ReturnDetailsPageProps) {
  const { returnNumber } = await params

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
    redirect(`/sign-in?redirect=/account/returns/${returnNumber}`)
  }

  // 2. Fetch return details with customer email ownership verification
  const res = await getCustomerReturnDetailsAction(returnNumber, email)
  if (!res.success || !res.returnRequest) {
    notFound()
  }

  const ret = res.returnRequest

  // Status flags
  const isRequested = ret.status === "requested"
  const isApproved = ret.status === "approved"
  const isReceived = ret.status === "received"
  const isClosed = ret.status === "closed"
  const isRejected = ret.status === "rejected"

  // Step milestone states
  const step1Done = true // Requested is always complete
  const step2Done = isApproved || isReceived || isClosed
  const step3Done = isReceived || isClosed
  const step4Done = isClosed

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
                  <BreadcrumbLink href="/account?tab=returns" className="hover:text-foreground">
                    Returns
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{ret.returnNumber}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <Link
                  href="/account?tab=returns"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2 font-sans"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Returns</span>
                </Link>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-sans font-semibold tracking-tight text-foreground">
                    Return {ret.returnNumber}
                  </h1>
                  {isClosed && (
                    <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 font-sans font-medium text-xs">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Refund Completed
                    </Badge>
                  )}
                  {isReceived && (
                    <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 font-sans font-medium text-xs">
                      <PackageCheck className="mr-1 h-3.5 w-3.5" />
                      Inspecting at Atelier
                    </Badge>
                  )}
                  {isApproved && (
                    <Badge className="bg-primary text-primary-foreground font-sans font-medium text-xs">
                      <Truck className="mr-1 h-3.5 w-3.5 animate-pulse" />
                      Courier Pickup Approved
                    </Badge>
                  )}
                  {isRequested && (
                    <Badge className="bg-secondary text-secondary-foreground border border-border font-sans font-medium text-xs">
                      <Clock className="mr-1 h-3.5 w-3.5" />
                      Pending Atelier Review
                    </Badge>
                  )}
                  {isRejected && (
                    <Badge variant="destructive" className="font-sans font-medium text-xs">
                      <AlertCircle className="mr-1 h-3.5 w-3.5" />
                      Return Closed
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Submitted on {ret.createdAt} • Associated with{" "}
                  <Link
                    href={`/account/orders/${ret.orderNumber}`}
                    className="underline hover:text-foreground font-medium"
                  >
                    Order #{ret.orderNumber}
                  </Link>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {isRequested && (
                  <CancelReturnButton
                    returnId={ret.id}
                    returnNumber={ret.returnNumber}
                    customerEmail={email}
                  />
                )}
                <a
                  href={STORE_CONTACT.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-card border border-border text-foreground font-medium rounded-xs hover:bg-muted/50 transition-colors text-xs"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Atelier Concierge Help</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Content Workspace */}
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Milestone Step Progress */}
          {!isRejected && (
            <div className="bg-card border border-border rounded-xs p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    Return Progression & Milestone Steps
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Complimentary white-glove doorstep courier collection and atelier inspection.
                  </p>
                </div>
                <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-xs border border-border/50 self-start sm:self-auto">
                  {ret.statusLabel}
                </span>
              </div>

              {/* 4 Milestones */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                {/* 1. Request Submitted */}
                <div
                  className={`p-4 rounded-xs border transition-colors ${
                    step1Done
                      ? "bg-muted/30 border-primary/40 text-foreground"
                      : "bg-muted/10 border-border/50 text-muted-foreground opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2
                      className={`h-4 w-4 ${step1Done ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      1. Requested
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Submitted online with garment reasons and bank details.
                  </p>
                </div>

                {/* 2. Courier Pickup Approved */}
                <div
                  className={`p-4 rounded-xs border transition-colors ${
                    step2Done
                      ? "bg-muted/30 border-primary/40 text-foreground"
                      : isRequested
                      ? "bg-primary/5 border-primary text-foreground"
                      : "bg-muted/10 border-border/50 text-muted-foreground opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Truck
                      className={`h-4 w-4 ${
                        step2Done
                          ? "text-primary"
                          : isRequested
                          ? "text-primary animate-pulse"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      2. Collection
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {ret.adminInstructions
                      ? "Courier assigned; pickup instructions issued."
                      : "Atelier reviewing request for courier dispatch."}
                  </p>
                </div>

                {/* 3. Atelier Inspection */}
                <div
                  className={`p-4 rounded-xs border transition-colors ${
                    step3Done
                      ? "bg-muted/30 border-primary/40 text-foreground"
                      : "bg-muted/10 border-border/50 text-muted-foreground opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileCheck2
                      className={`h-4 w-4 ${step3Done ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      3. Inspection
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Tags and unworn garment condition checked at boutique atelier.
                  </p>
                </div>

                {/* 4. Refund Issued */}
                <div
                  className={`p-4 rounded-xs border transition-colors ${
                    step4Done
                      ? "bg-emerald-500/10 border-emerald-500/40 text-foreground"
                      : "bg-muted/10 border-border/50 text-muted-foreground opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2
                      className={`h-4 w-4 ${step4Done ? "text-emerald-600" : "text-muted-foreground"}`}
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      4. Refunded
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Settled to original payment card or direct UAE bank transfer.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rejection / Cancellation Notice */}
          {isRejected && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xs p-6 flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-destructive">
                  This return request has been closed
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {ret.rejectionReason ||
                    "This return request was closed. For inquiries or garment assistance, please contact our concierge team."}
                </p>
              </div>
            </div>
          )}

          {/* Courier Instructions Banner */}
          {ret.adminInstructions && !isRejected && (
            <div className="bg-primary/5 border border-primary/20 rounded-xs p-5 flex items-start gap-3.5">
              <Truck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-semibold text-foreground block">
                  Courier Pickup Instructions:
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  {ret.adminInstructions}
                </p>
              </div>
            </div>
          )}

          {/* Two-Column Grid: Left Details & Right Financial / Refunds */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left 2 Cols: Garments, Photos & Audit Events */}
            <div className="lg:col-span-2 space-y-6">
              {/* Garment Items Card */}
              <div className="bg-card border border-border rounded-xs overflow-hidden shadow-xs">
                <div className="p-4 sm:p-5 border-b border-border bg-muted/20 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    Returned Pieces ({ret.items.length})
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Estimated Total: {formatAED(ret.totalRefundFils)}
                  </span>
                </div>

                <div className="divide-y divide-border/40 p-4 sm:p-5">
                  {ret.items.map((item) => (
                    <div
                      key={item.id}
                      className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-16 rounded-xs bg-muted border border-border relative shrink-0 overflow-hidden">
                          {item.mediaKey ? (
                            <Image
                              src={
                                item.mediaKey.startsWith("http")
                                  ? item.mediaKey
                                  : `https://res.cloudinary.com/${
                                      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"
                                    }/image/upload/f_auto,q_auto,c_limit,w_200/${item.mediaKey}`
                              }
                              alt={item.productName}
                              fill
                              sizes="48px"
                              className="object-cover object-top"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-muted-foreground">
                              Piece
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-sans font-medium text-foreground">
                            {item.productName}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                            <span>
                              Colour: <strong className="text-foreground font-normal">{item.colourName}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Size: <strong className="text-foreground font-normal">{item.sizeLabel}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              SKU: <strong className="font-mono text-foreground font-normal">{item.sku}</strong>
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Qty: <strong className="text-foreground font-normal">{item.quantity}</strong> • Reason:{" "}
                            <span className="italic text-foreground">{item.reason}</span>
                          </div>
                          {item.condition && (
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              Atelier Condition Assessment:{" "}
                              <span className="font-medium text-foreground capitalize">
                                {item.condition.replace(/_/g, " ")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-semibold font-mono text-foreground">
                          {formatAED(item.refundAmountFils || item.unitPriceFils * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Uploaded Condition Photos */}
              {ret.photos && ret.photos.length > 0 && (
                <div className="bg-card border border-border rounded-xs p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Attached Garment Photos ({ret.photos.length})
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {ret.photos.map((p) => {
                      const photoUrl = p.mediaKey.startsWith("http")
                        ? p.mediaKey
                        : `https://res.cloudinary.com/${
                            process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"
                          }/image/upload/f_auto,q_auto,c_limit,w_600/${p.mediaKey}`

                      return (
                        <a
                          key={p.id}
                          href={photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative h-20 w-20 rounded-xs border border-border overflow-hidden bg-muted group block"
                        >
                          <Image
                            src={photoUrl}
                            alt="Garment condition photo"
                            fill
                            sizes="80px"
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ExternalLink className="h-4 w-4" />
                          </div>
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Customer Comments */}
              {ret.customerComment && (
                <div className="bg-card border border-border rounded-xs p-5 shadow-xs space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground border-b border-border/50 pb-2">
                    Customer Fitting & Condition Notes
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    &ldquo;{ret.customerComment}&rdquo;
                  </p>
                </div>
              )}

              {/* Timeline Audit Events */}
              {ret.events && ret.events.length > 0 && (
                <div className="bg-card border border-border rounded-xs p-5 shadow-xs space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground border-b border-border/50 pb-2">
                    Return Activity & Timeline
                  </h4>
                  <div className="relative pl-6 space-y-4 border-l border-border/80 ml-2">
                    {ret.events.map((ev) => (
                      <div key={ev.id} className="relative group">
                        {/* Dot */}
                        <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-background border-2 border-primary" />
                        <div className="text-xs space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-foreground capitalize">
                              {ev.eventType.replace(/_/g, " ")}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {ev.createdAt}
                            </span>
                          </div>
                          {ev.note && (
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {ev.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right 1 Col: Financial Summary, Bank Info & Refunds */}
            <div className="space-y-6">
              {/* Estimated Refund Card */}
              <div className="bg-card border border-border rounded-xs p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground border-b border-border/60 pb-3">
                  Refund Summary
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Return Pieces Count</span>
                    <span className="font-mono text-foreground font-medium">
                      {ret.items.reduce((s, it) => s + it.quantity, 0)} piece(s)
                    </span>
                  </div>

                  <div className="flex justify-between text-muted-foreground">
                    <span>Estimated Total Refund</span>
                    <span className="font-mono text-foreground font-semibold">
                      {formatAED(ret.totalRefundFils)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground leading-relaxed">
                    Refund is confirmed and authorized upon physical inspection by boutique atelier specialists.
                  </div>
                </div>
              </div>

              {/* UAE Bank Transfer Details (for COD orders) */}
              {ret.iban && (
                <div className="bg-card border border-border rounded-xs p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Designated UAE Bank Account
                    </h4>
                  </div>
                  <div className="text-xs space-y-1.5">
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Bank Name</span>
                      <strong className="text-foreground">{ret.bankName || "UAE Bank"}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Beneficiary Name</span>
                      <strong className="text-foreground">{ret.accountHolderName || "Account Holder"}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">IBAN</span>
                      <strong className="font-mono text-foreground tracking-wide">{ret.iban}</strong>
                    </div>
                    <p className="text-[10px] text-muted-foreground pt-1 leading-relaxed">
                      Encrypted and stored per UAE boutique banking guidelines for direct electronic refund transfer.
                    </p>
                  </div>
                </div>
              )}

              {/* Settled Refunds Record (if any) */}
              {ret.refunds && ret.refunds.length > 0 && (
                <div className="bg-card border border-border rounded-xs p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Disbursed Refunds
                    </h4>
                  </div>
                  <div className="space-y-3 text-xs">
                    {ret.refunds.map((rf) => (
                      <div
                        key={rf.id}
                        className="p-3 bg-muted/20 border border-border/60 rounded-xs space-y-1"
                      >
                        <div className="flex justify-between items-baseline font-mono">
                          <span className="text-foreground font-semibold">
                            {formatAED(rf.amountFils)}
                          </span>
                          <span className="text-[10px] uppercase font-sans text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-xs border border-emerald-500/20">
                            {rf.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Method:{" "}
                          <span className="capitalize text-foreground font-medium">
                            {rf.method === "card" ? "Original Card Reversal" : "UAE Bank Transfer"}
                          </span>
                        </div>
                        {rf.bankTransferReference && (
                          <div className="text-[11px] text-muted-foreground font-mono">
                            Ref: {rf.bankTransferReference}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground">
                          Processed: {rf.bankTransferDate || rf.createdAt}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assistance Card */}
              <div className="bg-card border border-border rounded-xs p-5 shadow-xs space-y-3 text-xs">
                <h4 className="font-semibold uppercase tracking-wider text-foreground border-b border-border/60 pb-2">
                  Have questions about your return?
                </h4>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  Our bespoke concierge team is available on WhatsApp daily (9 AM – 9 PM GST) to answer queries regarding courier pickup or refund timing.
                </p>
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
