"use client"

import * as React from "react"
import Link from "next/link"
import { STORE_CONTACT } from "@/lib/contact"
import { StoreButton } from "@/components/store/StoreButton"
import { formatAED } from "@/lib/money"
import {
  RotateCcw,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  ChevronRight,
  Package,
  Truck,
  AlertCircle,
  Building2,
  Loader2,
} from "lucide-react"
import type { AccountOrder } from "../types"
import type { CustomerReturnRequest } from "../returns/types"
import { getCustomerReturnsAction } from "../returns/actions"
import { ReturnRequestModal } from "./ReturnRequestModal"

interface ReturnsTabProps {
  orders: AccountOrder[]
  customerEmail: string
  preselectedOrderId?: string
  onClearPreselectedOrder?: () => void
}

export function ReturnsTab({
  orders,
  customerEmail,
  preselectedOrderId,
  onClearPreselectedOrder,
}: ReturnsTabProps) {
  const [returnsList, setReturnsList] = React.useState<CustomerReturnRequest[]>([])
  const [isLoadingReturns, setIsLoadingReturns] = React.useState(false)
  const [userOpenedModal, setUserOpenedModal] = React.useState(false)
  const [modalOrderId, setModalOrderId] = React.useState<string | undefined>(undefined)

  const isModalOpen = userOpenedModal || Boolean(preselectedOrderId)
  const effectiveModalOrderId = modalOrderId || preselectedOrderId

  // Fetch returns list on mount or when customerEmail changes
  React.useEffect(() => {
    if (!customerEmail) return
    let active = true

    getCustomerReturnsAction(customerEmail)
      .then((res) => {
        if (active && res.success && res.returns) {
          setReturnsList(res.returns)
        }
      })
      .catch((err) => {
        console.warn("Failed to load customer returns:", err)
      })
      .finally(() => {
        if (active) {
          setIsLoadingReturns(false)
        }
      })

    return () => {
      active = false
    }
  }, [customerEmail])

  const handleOpenModal = (orderId?: string) => {
    setModalOrderId(orderId)
    setUserOpenedModal(true)
  }

  const handleCloseModal = () => {
    setUserOpenedModal(false)
    setModalOrderId(undefined)
    if (onClearPreselectedOrder) {
      onClearPreselectedOrder()
    }
  }

  const handleReturnSubmitted = () => {
    if (!customerEmail) return
    setIsLoadingReturns(true)
    getCustomerReturnsAction(customerEmail)
      .then((res) => {
        if (res.success && res.returns) {
          setReturnsList(res.returns)
        }
      })
      .finally(() => {
        setIsLoadingReturns(false)
      })
  }

  // Delivered orders that could be eligible for return
  const deliveredOrders = React.useMemo(() => {
    return orders.filter((o) => o.status === "delivered")
  }, [orders])

  const returnWhatsappUrl = `${STORE_CONTACT.whatsappHref}?text=${encodeURIComponent(
    "Hello AR Boutique Concierge, I would like to inquire about a garment exchange or return."
  )}`

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-sans font-semibold tracking-tight text-foreground">
            Returns & Exchanges
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complimentary doorstep courier collection across all 7 UAE Emirates within 7 days.
          </p>
        </div>

        <StoreButton
          type="button"
          onClick={() => handleOpenModal()}
          className="h-10 px-5 text-xs uppercase tracking-wider self-start sm:self-auto"
        >
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
          Request a Return
        </StoreButton>
      </div>

      {/* Active & Past Returns Section */}
      {isLoadingReturns ? (
        <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
          <p>Loading your return history...</p>
        </div>
      ) : returnsList.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Your Return Requests ({returnsList.length})
            </h3>
            <span className="text-xs text-muted-foreground">
              Live status from atelier inspection
            </span>
          </div>

          <div className="space-y-4">
            {returnsList.map((ret) => {
              const isApproved = ret.status === "approved"
              const isReceived = ret.status === "received"
              const isClosed = ret.status === "closed"
              const isRejected = ret.status === "rejected"

              return (
                <div
                  key={ret.id}
                  className="p-5 rounded-xs border border-border bg-card shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-sm text-foreground">
                        {ret.returnNumber}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Order #{ret.orderNumber} • Submitted {ret.createdAt}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center px-2.5 py-1 text-[11px] font-sans font-medium rounded-full ${
                        isClosed
                          ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                          : isApproved
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : isReceived
                          ? "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                          : isRejected
                          ? "bg-destructive/10 text-destructive border border-destructive/20"
                          : "bg-muted text-foreground border border-border"
                      }`}
                    >
                      {ret.statusLabel}
                    </span>
                  </div>

                  {/* Courier pickup instructions banner */}
                  {ret.adminInstructions && (
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xs text-xs text-foreground space-y-1">
                      <div className="font-semibold flex items-center gap-1.5 text-primary">
                        <Truck className="h-3.5 w-3.5" />
                        Courier Collection Instructions:
                      </div>
                      <p className="leading-relaxed text-muted-foreground">
                        {ret.adminInstructions}
                      </p>
                    </div>
                  )}

                  {/* Rejection banner */}
                  {ret.rejectionReason && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xs text-xs text-destructive space-y-1">
                      <div className="font-semibold flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Atelier Notice:
                      </div>
                      <p className="leading-relaxed">{ret.rejectionReason}</p>
                    </div>
                  )}

                  {/* Returned Garments List */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground block">
                      Returned Garment Piece(s)
                    </span>
                    <div className="divide-y divide-border/30">
                      {ret.items.map((it) => (
                        <div
                          key={it.id}
                          className="py-2.5 flex items-center justify-between text-xs gap-3"
                        >
                          <div className="min-w-0">
                            <span className="font-medium text-foreground block truncate">
                              {it.productName}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {it.colourName} • {it.sizeLabel} • Qty: {it.quantity} • Reason:{" "}
                              <span className="italic">{it.reason}</span>
                            </span>
                          </div>

                          <span className="font-mono font-medium text-foreground shrink-0">
                            {formatAED(it.refundAmountFils)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary & Bank Info */}
                  <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                    {ret.iban ? (
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>
                          Refund Bank: <strong className="text-foreground">{ret.bankName}</strong> ({ret.iban})
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        Refund processed to original payment method.
                      </span>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="font-mono text-xs">
                        <span className="text-muted-foreground mr-2">Estimated Refund:</span>
                        <strong className="text-foreground font-semibold">
                          {formatAED(ret.totalRefundFils)}
                        </strong>
                      </div>
                      <Link
                        href={`/account/returns/${ret.returnNumber}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background font-medium rounded-xs hover:bg-foreground/90 transition-colors text-xs font-sans"
                      >
                        <span>Timeline & Details</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* Eligible Delivered Orders Shortcut */}
      {deliveredOrders.length > 0 && (
        <div className="p-6 rounded-xs border border-border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Delivered Orders Eligible for Return
            </h3>
            <span className="text-xs text-muted-foreground">
              7-day complimentary window
            </span>
          </div>

          <div className="divide-y divide-border/50 border border-border/70 rounded-xs overflow-hidden">
            {deliveredOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-semibold text-foreground">
                      {ord.orderNumber}
                    </span>
                    <span className="text-muted-foreground">• Delivered {ord.date}</span>
                    <span className="text-muted-foreground">• {ord.items.length} piece(s)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {ord.items.map((i) => i.productName).join(", ")}
                  </p>
                </div>

                <StoreButton
                  type="button"
                  onClick={() => handleOpenModal(ord.id)}
                  variant="outline"
                  className="h-8 px-4 text-xs shrink-0 self-start sm:self-auto"
                >
                  <RotateCcw className="mr-1.5 h-3 w-3" />
                  Return Items
                </StoreButton>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3 Step Process Banner */}
      <div className="p-6 rounded-xs border border-border bg-card shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-muted rounded-xs text-foreground shrink-0">
              <RotateCcw className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-sans font-semibold text-foreground">
                Complimentary UAE White-Glove Return Pickup
              </h3>
              <p className="text-xs text-muted-foreground">
                We accept returns on all non-final sale pieces in original, unworn condition with tags attached.
              </p>
            </div>
          </div>

          <a
            href={returnWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background font-medium text-xs uppercase tracking-wider rounded-none hover:bg-foreground/90 transition-colors shrink-0"
          >
            <MessageCircle className="h-4 w-4 text-emerald-400" />
            WhatsApp Concierge
          </a>
        </div>

        {/* 3 Simple Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-muted/20 border border-border/40 rounded-xs space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
                1
              </span>
              Submit Online
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Select delivered items, specify your return reason, and attach optional garment condition photos.
            </p>
          </div>

          <div className="p-4 bg-muted/20 border border-border/40 rounded-xs space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
                2
              </span>
              Doorstep Pickup
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our courier will collect the sealed package directly from your UAE delivery address within 1-2 business days.
            </p>
          </div>

          <div className="p-4 bg-muted/20 border border-border/40 rounded-xs space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
                3
              </span>
              Inspection & Refund
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upon atelier inspection, card refunds process to your original card in 5-7 business days; COD orders receive direct UAE bank transfer.
            </p>
          </div>
        </div>
      </div>

      {/* Garment Condition Checklist */}
      <div className="p-6 rounded-xs border border-border bg-card space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          Garment Return Guidelines
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <span>Garment must be unworn, unwashed, and free from any fragrance, makeup, or alterations.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <span>Original AR Boutique garment tags and security ribbon must remain intact.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <span>Include all original designer packaging, dust bags, and fabric swatches provided.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <span>Items marked as &ldquo;Final Sale&rdquo; or bespoke tailored garments are non-returnable.</span>
          </div>
        </div>

        <div className="pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">
            Questions regarding our policy terms?
          </span>
          <Link
            href="/policies/returns"
            className="text-foreground font-medium underline underline-offset-4 hover:opacity-75 flex items-center gap-1"
          >
            Read Full Returns Policy <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Modal */}
      <ReturnRequestModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        orders={orders}
        preselectedOrderId={effectiveModalOrderId}
        onReturnSubmitted={handleReturnSubmitted}
        existingReturns={returnsList}
        customerEmail={customerEmail}
      />
    </div>
  )
}
