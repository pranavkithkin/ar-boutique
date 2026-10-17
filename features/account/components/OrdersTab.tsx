"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { AccountOrder } from "../types"
import { formatAED } from "@/lib/money"
import { STORE_CONTACT } from "@/lib/contact"
import { Badge } from "@/components/ui/badge"
import { StoreButton } from "@/components/store/StoreButton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MessageCircle,
  MapPin,
} from "lucide-react"

interface OrdersTabProps {
  orders: AccountOrder[]
}

export function OrdersTab({ orders }: OrdersTabProps) {
  const [filter, setFilter] = React.useState<"all" | "active" | "delivered">("all")
  const [selectedOrderForTracking, setSelectedOrderForTracking] =
    React.useState<AccountOrder | null>(null)

  const filteredOrders = React.useMemo(() => {
    if (filter === "active") {
      return orders.filter(
        (order) => order.status === "confirmed" || order.status === "shipped"
      )
    }
    if (filter === "delivered") {
      return orders.filter((order) => order.status === "delivered")
    }
    return orders
  }, [orders, filter])

  const getStatusBadge = (status: AccountOrder["status"], label: string) => {
    switch (status) {
      case "delivered":
        return (
          <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/15 font-sans font-medium text-xs">
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            {label}
          </Badge>
        )
      case "shipped":
        return (
          <Badge className="bg-primary text-primary-foreground font-sans font-medium text-xs">
            <Truck className="mr-1 h-3.5 w-3.5 animate-pulse" />
            {label}
          </Badge>
        )
      case "confirmed":
        return (
          <Badge className="bg-secondary text-secondary-foreground border border-border font-sans font-medium text-xs">
            <Clock className="mr-1 h-3.5 w-3.5" />
            {label}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="font-sans font-medium text-xs">
            {label}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-sans font-semibold tracking-tight text-foreground">Order History</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review past purchases, download invoices, and track active deliveries.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xs border border-border/40 self-start sm:self-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-xs font-sans font-medium rounded-xs transition-colors ${
              filter === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-3 py-1.5 text-xs font-sans font-medium rounded-xs transition-colors ${
              filter === "active"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active (
            {
              orders.filter(
                (o) => o.status === "confirmed" || o.status === "shipped"
              ).length
            }
            )
          </button>
          <button
            onClick={() => setFilter("delivered")}
            className={`px-3 py-1.5 text-xs font-sans font-medium rounded-xs transition-colors ${
              filter === "delivered"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Delivered ({orders.filter((o) => o.status === "delivered").length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-xs">
          <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-60" />
          <h3 className="text-base font-sans font-semibold text-foreground">No orders found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            You currently have no orders matching the selected filter.
          </p>
          <div className="mt-6">
            <Link href="/collections">
              <StoreButton className="text-xs uppercase tracking-widest px-6 h-10">
                Explore Collections
              </StoreButton>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-card border border-border rounded-xs overflow-hidden transition-all hover:border-border/80 shadow-xs"
            >
              {/* Order Header */}
              <div className="p-4 sm:p-5 bg-muted/20 border-b border-border flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div>
                    <span className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Order Number
                    </span>
                    <span className="text-sm font-semibold text-foreground tracking-wide">
                      {order.orderNumber}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Date Placed
                    </span>
                    <span className="text-xs text-foreground font-sans">
                      {order.date}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Payment
                    </span>
                    <span className="text-xs text-foreground font-sans uppercase">
                      {order.paymentMethod === "card" ? "Credit / Debit Card" : "Cash on Delivery"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Total
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatAED(order.totalFils)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(order.status, order.statusLabel)}
                </div>
              </div>

              {/* Order Items */}
              <div className="p-4 sm:p-5 divide-y divide-border/40">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-14 shrink-0 bg-muted/30 overflow-hidden border border-border/50 rounded-xs">
                        <Image
                          src={item.imageSrc}
                          alt={item.productName}
                          fill
                          sizes="56px"
                          className="object-cover object-center"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-sans text-foreground font-medium">
                          {item.productName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>Style: <strong className="font-mono text-foreground font-normal">{item.styleCode}</strong></span>
                          <span>•</span>
                          <span>Colour: <strong className="text-foreground font-normal">{item.colourName}</strong></span>
                          <span>•</span>
                          <span>Size: <strong className="text-foreground font-normal">{item.sizeLabel}</strong></span>
                          <span>•</span>
                          <span>Qty: {item.quantity}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-semibold text-foreground">
                        {formatAED(item.priceFils * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer & Actions */}
              <div className="p-4 bg-muted/10 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate max-w-[260px] sm:max-w-md">
                    Delivering to: {order.deliveryAddress.area}, {order.deliveryAddress.emirate}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {order.status === "shipped" && (
                    <button
                      onClick={() => setSelectedOrderForTracking(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background font-medium rounded-xs hover:bg-foreground/90 transition-colors text-xs"
                    >
                      <Truck className="h-3.5 w-3.5" />
                      Live Tracking
                    </button>
                  )}
                  <a
                    href={STORE_CONTACT.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border text-foreground font-medium rounded-xs hover:bg-muted/40 transition-colors text-xs"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                    Concierge Help
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tracking Modal Dialog */}
      <Dialog
        open={!!selectedOrderForTracking}
        onOpenChange={(open) => !open && setSelectedOrderForTracking(null)}
      >
        <DialogContent className="max-w-lg bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-sans font-semibold tracking-tight">
              Shipment Tracking: {selectedOrderForTracking?.orderNumber}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Courier: {selectedOrderForTracking?.courierName} • Waybill #
              {selectedOrderForTracking?.trackingNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedOrderForTracking && (
            <div className="space-y-6 pt-3">
              {/* Timeline Progress */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                <div className="relative flex items-start gap-3">
                  <div className="absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full bg-success text-success-foreground ring-4 ring-card">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-foreground">Order Confirmed</h5>
                    <p className="text-[11px] text-muted-foreground">Payment verified and items prepared at atelier.</p>
                  </div>
                </div>

                <div className="relative flex items-start gap-3">
                  <div className="absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full bg-success text-success-foreground ring-4 ring-card">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-foreground">Packed in Signature Luxury Packaging</h5>
                    <p className="text-[11px] text-muted-foreground">Carefully inspected and secured with bespoke seals.</p>
                  </div>
                </div>

                <div className="relative flex items-start gap-3">
                  <div className="absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-card animate-pulse">
                    <Truck className="h-3 w-3" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-foreground">Dispatched with Courier</h5>
                    <p className="text-[11px] text-muted-foreground">
                      Package is on van with {selectedOrderForTracking.courierName}. Expected delivery today before 6:00 PM.
                    </p>
                  </div>
                </div>

                <div className="relative flex items-start gap-3 opacity-50">
                  <div className="absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full bg-muted border border-border text-muted-foreground ring-4 ring-card">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-foreground">Delivered</h5>
                    <p className="text-[11px] text-muted-foreground">
                      Recipient signature upon arrival.
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Address Card */}
              <div className="p-3.5 bg-muted/30 border border-border/60 rounded-xs text-xs space-y-1">
                <div className="font-semibold text-foreground">Destination:</div>
                <div className="text-muted-foreground">
                  {selectedOrderForTracking.deliveryAddress.recipientName}
                </div>
                <div className="text-muted-foreground">
                  {selectedOrderForTracking.deliveryAddress.building},{" "}
                  {selectedOrderForTracking.deliveryAddress.street},{" "}
                  {selectedOrderForTracking.deliveryAddress.area},{" "}
                  {selectedOrderForTracking.deliveryAddress.emirate}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <a
                  href={STORE_CONTACT.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground text-background font-medium rounded-xs hover:bg-foreground/90 transition-colors text-xs"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                  WhatsApp Driver / Concierge
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
