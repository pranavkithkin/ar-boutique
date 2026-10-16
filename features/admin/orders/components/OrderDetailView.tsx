"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { AdminOrderDetail, AdminOrderItem, AdminOrderEvent, OrderStatus } from "../types"
import { updateOrderStatusAction, updateOrderNotesAction } from "../actions"
import { formatAED } from "@/lib/money"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Banknote,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  Loader2,
  Save,
} from "lucide-react"

interface OrderDetailViewProps {
  order: AdminOrderDetail
}

const STATUS_BADGE_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  confirmed: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  packed: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30",
  shipped: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30",
  delivered: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  cancelled: "bg-muted text-muted-foreground border-border",
  returned: "bg-destructive/10 text-destructive border-destructive/30",
}

export function OrderDetailView({ order }: OrderDetailViewProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [courier, setCourier] = React.useState(order.courier || "")
  const [trackingNumber, setTrackingNumber] = React.useState(order.tracking_number || "")
  const [notes, setNotes] = React.useState(order.internal_notes || "")
  const [isSavingNotes, setIsSavingNotes] = React.useState(false)
  const [notesSaved, setNotesSaved] = React.useState(false)

  async function handleStatusChange(newStatus: OrderStatus) {
    if (isUpdating) return
    setIsUpdating(true)
    const res = await updateOrderStatusAction({
      orderId: order.id,
      newStatus,
      courier: newStatus === "shipped" ? courier : undefined,
      trackingNumber: newStatus === "shipped" ? trackingNumber : undefined,
    })
    setIsUpdating(false)
    if (res.success) {
      router.refresh()
    } else {
      alert(res.error || "Failed to update status")
    }
  }

  async function handleSaveNotes() {
    setIsSavingNotes(true)
    setNotesSaved(false)
    const res = await updateOrderNotesAction(order.id, notes)
    setIsSavingNotes(false)
    if (res.success) {
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 3000)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-1.5 border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors rounded-none"
            title="Back to Orders"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Order
              </span>
              <span
                className={`text-[10px] uppercase font-mono px-2 py-0.5 border font-medium ${
                  STATUS_BADGE_STYLES[order.status]
                }`}
              >
                {order.status}
              </span>
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-0.5">
              #{order.order_number}
            </h1>
          </div>
        </div>

        {/* Action Buttons depending on status */}
        <div className="flex flex-wrap items-center gap-2">
          {order.status === "pending" && (
            <Button
              onClick={() => handleStatusChange("confirmed")}
              disabled={isUpdating}
              className="h-9 px-4 text-xs font-sans font-medium uppercase tracking-[0.08em] rounded-none bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              {isUpdating ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
              Confirm Order
            </Button>
          )}

          {order.status === "confirmed" && (
            <Button
              onClick={() => handleStatusChange("packed")}
              disabled={isUpdating}
              className="h-9 px-4 text-xs font-sans font-medium uppercase tracking-[0.08em] rounded-none bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            >
              {isUpdating ? <Loader2 className="size-3.5 animate-spin" /> : <Package className="size-3.5" />}
              Mark as Packed
            </Button>
          )}

          {order.status === "packed" && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Courier (e.g. Careem / Fetchr)"
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                className="h-9 w-44 text-xs font-sans rounded-none"
              />
              <Input
                placeholder="Tracking Number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="h-9 w-40 text-xs font-mono rounded-none"
              />
              <Button
                onClick={() => handleStatusChange("shipped")}
                disabled={isUpdating}
                className="h-9 px-4 text-xs font-sans font-medium uppercase tracking-[0.08em] rounded-none bg-sky-600 hover:bg-sky-700 text-white gap-1.5"
              >
                {isUpdating ? <Loader2 className="size-3.5 animate-spin" /> : <Truck className="size-3.5" />}
                Ship Order
              </Button>
            </div>
          )}

          {order.status === "shipped" && (
            <Button
              onClick={() => handleStatusChange("delivered")}
              disabled={isUpdating}
              className="h-9 px-4 text-xs font-sans font-medium uppercase tracking-[0.08em] rounded-none bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isUpdating ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
              Mark Delivered
            </Button>
          )}

          {order.status !== "cancelled" && order.status !== "delivered" && order.status !== "returned" && (
            <Button
              onClick={() => {
                if (confirm("Are you sure you want to cancel this order?")) {
                  handleStatusChange("cancelled")
                }
              }}
              disabled={isUpdating}
              variant="outline"
              className="h-9 px-3 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 rounded-none border-border"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* ── Order Layout Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Line Items & Payment Summary */}
        <div className="lg:col-span-8 space-y-6">
          {/* Items Card */}
          <div className="bg-card border border-border p-5 rounded-none space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="font-sans text-sm font-semibold text-foreground flex items-center gap-2">
                <Package className="size-4 text-muted-foreground" />
                <span>Order Items ({order.items.length})</span>
              </h2>
              <span className="font-mono text-xs text-muted-foreground">
                Placed {new Date(order.created_at).toLocaleString("en-AE")}
              </span>
            </div>

            <div className="divide-y divide-border">
              {order.items.map((item: AdminOrderItem) => (
                <div key={item.id} className="py-3 flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="size-16 bg-muted shrink-0 border border-border overflow-hidden relative">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.product_name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-sans text-sm font-medium text-foreground truncate">
                      {item.product_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                      <span>Colour: <strong className="text-foreground font-normal">{item.colour_name}</strong></span>
                      {item.size_label && (
                        <span>Size: <strong className="text-foreground font-normal">{item.size_label}</strong></span>
                      )}
                      <span>Style: <strong className="font-mono text-foreground font-normal">{item.style_code}</strong></span>
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                      SKU: <span className="text-foreground">{item.sku}</span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-medium text-foreground">
                      {formatAED(item.total_fils)}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      {item.quantity} × {formatAED(item.unit_price_fils)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t border-border space-y-2 text-xs font-sans">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono text-foreground">{formatAED(order.subtotal_fils)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Fee</span>
                <span className="font-mono text-foreground">
                  {order.delivery_fee_fils === 0 ? "Complimentary" : formatAED(order.delivery_fee_fils)}
                </span>
              </div>
              {order.payment_method === "cod" && order.cod_fee_fils > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Cash on Delivery Handling Fee</span>
                  <span className="font-mono text-foreground">{formatAED(order.cod_fee_fils)}</span>
                </div>
              )}
              {order.discount_fils > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount</span>
                  <span className="font-mono">-{formatAED(order.discount_fils)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border text-sm font-medium">
                <span className="text-foreground">Total</span>
                <span className="font-mono text-base font-bold text-foreground">
                  {formatAED(order.total_fils)}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline Audit Events */}
          <div className="bg-card border border-border p-5 rounded-none space-y-4">
            <h2 className="font-sans text-sm font-semibold text-foreground flex items-center gap-2 pb-3 border-b border-border">
              <Clock className="size-4 text-muted-foreground" />
              <span>Timeline & Audit Trail</span>
            </h2>

            {order.events.length === 0 ? (
              <p className="text-xs text-muted-foreground">No history logged yet.</p>
            ) : (
              <div className="space-y-4">
                {order.events.map((ev: AdminOrderEvent) => (
                  <div key={ev.id} className="flex items-start gap-3 text-xs">
                    <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground capitalize">
                          {ev.note || ev.event_type.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {new Date(ev.created_at).toLocaleString("en-AE")}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Actor: {ev.actor_sub}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Customer, Delivery Address, Payment & Internal Notes */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Details */}
          <div className="bg-card border border-border p-5 rounded-none space-y-3">
            <h2 className="font-sans text-sm font-semibold text-foreground flex items-center gap-2 pb-2 border-b border-border">
              <User className="size-4 text-muted-foreground" />
              <span>Client Information</span>
            </h2>

            <div className="space-y-2 text-xs">
              <div className="font-medium text-foreground text-sm">
                {order.customer_name}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-3.5 shrink-0" />
                <a href={`mailto:${order.email}`} className="font-mono hover:underline">
                  {order.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-3.5 shrink-0" />
                <a href={`tel:${order.phone}`} className="font-mono hover:underline">
                  {order.phone}
                </a>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-card border border-border p-5 rounded-none space-y-3">
            <h2 className="font-sans text-sm font-semibold text-foreground flex items-center gap-2 pb-2 border-b border-border">
              <MapPin className="size-4 text-muted-foreground" />
              <span>UAE Delivery Address</span>
            </h2>

            <div className="space-y-1 text-xs text-muted-foreground leading-relaxed">
              <p className="font-medium text-foreground">{order.emirate}</p>
              {order.area && <p>{order.area}</p>}
              <p>{order.street_address}</p>
              {(order.building || order.apartment) && (
                <p>
                  {[order.building, order.apartment].filter(Boolean).join(", ")}
                </p>
              )}
              {order.landmark && (
                <p className="text-[11px] text-foreground/80 italic pt-1">
                  Landmark: {order.landmark}
                </p>
              )}
            </div>
          </div>

          {/* Payment Method Details */}
          <div className="bg-card border border-border p-5 rounded-none space-y-3">
            <h2 className="font-sans text-sm font-semibold text-foreground flex items-center gap-2 pb-2 border-b border-border">
              {order.payment_method === "card" ? (
                <CreditCard className="size-4 text-muted-foreground" />
              ) : (
                <Banknote className="size-4 text-muted-foreground" />
              )}
              <span>Payment Details</span>
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="uppercase font-medium text-foreground">
                  {order.payment_method === "cod" ? "Cash on Delivery" : "Card Payment"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Status</span>
                <span
                  className={`capitalize font-mono px-1.5 py-0.5 border text-[10px] ${
                    order.payment_status === "paid"
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-700 border-amber-500/30"
                  }`}
                >
                  {order.payment_status}
                </span>
              </div>
              {order.courier && (
                <div className="pt-2 border-t border-border flex justify-between">
                  <span className="text-muted-foreground">Courier</span>
                  <span className="text-foreground">{order.courier}</span>
                </div>
              )}
              {order.tracking_number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tracking</span>
                  <span className="font-mono text-foreground font-semibold">
                    {order.tracking_number}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Internal Staff Notes */}
          <div className="bg-card border border-border p-5 rounded-none space-y-3">
            <h2 className="font-sans text-sm font-semibold text-foreground flex items-center gap-2 pb-2 border-b border-border">
              <FileText className="size-4 text-muted-foreground" />
              <span>Internal Notes</span>
            </h2>

            <Textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Private staff instructions, special delivery requests, customer preferences…"
              className="text-xs font-sans rounded-none resize-y"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans">
                {notesSaved && "✓ Notes saved"}
              </span>
              <Button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                size="sm"
                className="h-7 px-3 text-[11px] font-sans rounded-none gap-1 bg-primary text-primary-foreground"
              >
                {isSavingNotes ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                Save Notes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
