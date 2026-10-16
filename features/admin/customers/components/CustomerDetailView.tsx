"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AdminCustomerDetail } from "../types"
import { toggleCustomerCodAction, updateCustomerNotesAction } from "../actions"
import { formatAED } from "@/lib/money"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  User,
  Clock,
} from "lucide-react"

interface CustomerDetailViewProps {
  customer: AdminCustomerDetail
}

export function CustomerDetailView({ customer: initialCustomer }: CustomerDetailViewProps) {
  const router = useRouter()
  const [customer, setCustomer] = React.useState<AdminCustomerDetail>(initialCustomer)

  // COD state
  const [codDisabled, setCodDisabled] = React.useState(customer.codDisabled)
  const [codReason, setCodReason] = React.useState(customer.codDisabledReason || "")
  const [isUpdatingCod, setIsUpdatingCod] = React.useState(false)
  const [codSuccessMsg, setCodSuccessMsg] = React.useState<string | null>(null)
  const [codErrorMsg, setCodErrorMsg] = React.useState<string | null>(null)

  // Notes state
  const [notes, setNotes] = React.useState(customer.notes || "")
  const [isUpdatingNotes, setIsUpdatingNotes] = React.useState(false)
  const [notesSuccessMsg, setNotesSuccessMsg] = React.useState<string | null>(null)

  async function handleToggleCod(e: React.FormEvent) {
    e.preventDefault()
    setIsUpdatingCod(true)
    setCodSuccessMsg(null)
    setCodErrorMsg(null)

    try {
      const res = await toggleCustomerCodAction({
        customerId: customer.id,
        codDisabled,
        codDisabledReason: codDisabled ? codReason : null,
      })

      if (res.success) {
        setCodSuccessMsg(
          codDisabled
            ? "Cash on Delivery is now blocked for this customer."
            : "Cash on Delivery is now permitted."
        )
        setCustomer((prev) => ({
          ...prev,
          codDisabled,
          codDisabledReason: codDisabled ? codReason : null,
        }))
        router.refresh()
      } else {
        setCodErrorMsg(res.error || "Failed to update COD restriction.")
      }
    } catch {
      setCodErrorMsg("Unexpected network error occurred.")
    } finally {
      setIsUpdatingCod(false)
    }
  }

  async function handleSaveNotes() {
    setIsUpdatingNotes(true)
    setNotesSuccessMsg(null)

    try {
      const res = await updateCustomerNotesAction({
        customerId: customer.id,
        notes,
      })

      if (res.success) {
        setNotesSuccessMsg("Notes saved successfully.")
        setCustomer((prev) => ({ ...prev, notes }))
        router.refresh()
      }
    } finally {
      setIsUpdatingNotes(false)
    }
  }

  const displayName = customer.fullName || "Guest Customer"
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="space-y-6">
      {/* Back button and breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/customers"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-none h-8 px-2.5 text-xs font-sans tracking-wide inline-flex items-center"
          )}
        >
          <ArrowLeft className="size-3.5 mr-1" />
          Back to Customers
        </Link>
        <span className="text-muted-foreground/40 text-xs">/</span>
        <span className="text-xs font-sans text-muted-foreground truncate max-w-xs">
          {displayName}
        </span>
      </div>

      {/* Main Profile Header Banner */}
      <div className="bg-card border border-border p-6 rounded-none space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="size-14 bg-primary/10 border border-primary/20 text-primary font-sans font-semibold text-xl flex items-center justify-center shrink-0">
              {initial}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground">
                  {displayName}
                </h1>
                {customer.clerkUserId ? (
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider rounded-none border-primary/30 text-primary font-sans">
                    Registered Account
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wider rounded-none text-muted-foreground font-sans">
                    Guest Buyer
                  </Badge>
                )}
                {customer.totalSpendFils >= 100000 && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] uppercase tracking-wider rounded-none font-sans">
                    VIP Client
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Customer ID: {customer.id}
              </p>
            </div>
          </div>

          {/* Quick contact tags */}
          <div className="flex flex-col sm:items-end gap-1.5 text-xs font-sans">
            <div className="flex items-center gap-2 text-foreground font-mono">
              <Mail className="size-3.5 text-muted-foreground shrink-0" />
              <span>{customer.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="size-3.5 text-muted-foreground shrink-0" />
              <span>{customer.phone || "No phone provided"}</span>
            </div>
          </div>
        </div>

        {/* 4 Metric Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border">
          <div className="p-3 bg-muted/20 border border-border">
            <p className="text-[10px] font-sans font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Total Spend
            </p>
            <p className="text-lg font-sans font-semibold tracking-tight text-foreground mt-0.5">
              {formatAED(customer.totalSpendFils)}
            </p>
          </div>

          <div className="p-3 bg-muted/20 border border-border">
            <p className="text-[10px] font-sans font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Orders Placed
            </p>
            <p className="text-lg font-sans font-semibold tracking-tight text-foreground mt-0.5">
              {customer.totalOrders}
            </p>
          </div>

          <div className="p-3 bg-muted/20 border border-border">
            <p className="text-[10px] font-sans font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              COD Refusals
            </p>
            <p className={`text-lg font-sans font-semibold tracking-tight mt-0.5 ${customer.codRefusals > 0 ? "text-destructive" : "text-foreground"}`}>
              {customer.codRefusals}
            </p>
          </div>

          <div className="p-3 bg-muted/20 border border-border">
            <p className="text-[10px] font-sans font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Return Requests
            </p>
            <p className="text-lg font-sans font-semibold tracking-tight text-foreground mt-0.5">
              {customer.returnsCount}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Orders & Addresses (left) vs COD & Notes (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 spans): Order History & Delivery Addresses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Complete Order History */}
          <div className="bg-card border border-border p-5 rounded-none space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                <ShoppingBag className="size-4 text-muted-foreground" />
                Order History ({customer.orders.length})
              </h3>
            </div>

            {customer.orders.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground italic border border-dashed border-border">
                No orders have been recorded for this customer yet.
              </div>
            ) : (
              <div className="space-y-3">
                {customer.orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 border border-border bg-muted/15 hover:bg-muted/30 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Link
                          href={`/admin/orders`}
                          className="font-mono font-semibold text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          {ord.orderNumber}
                          <ExternalLink className="size-3" />
                        </Link>
                        <Badge variant="outline" className="rounded-none text-[10px] uppercase font-sans">
                          {ord.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground uppercase font-sans tracking-wider text-[10px]">
                          {ord.paymentMethod} • {ord.paymentStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-sans">
                          <Clock className="size-3" />
                          {new Date(ord.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="font-sans font-semibold text-sm text-foreground">
                          {formatAED(ord.totalFils)}
                        </span>
                      </div>
                    </div>

                    {ord.itemsSummary.length > 0 && (
                      <div className="text-xs text-muted-foreground space-y-1 bg-background/50 p-2.5 border border-border/40">
                        {ord.itemsSummary.map((item, i) => (
                          <p key={i} className="truncate">• {item}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* UAE Delivery Addresses */}
          <div className="bg-card border border-border p-5 rounded-none space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                Recorded UAE Addresses ({customer.addresses.length})
              </h3>
            </div>

            {customer.addresses.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No physical addresses on record.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customer.addresses.map((addr, idx) => (
                  <div key={idx} className="p-3.5 border border-border bg-muted/10 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground font-sans">{addr.emirate}</span>
                      {addr.area && (
                        <Badge variant="secondary" className="rounded-none text-[10px] font-sans">
                          {addr.area}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground leading-relaxed font-sans">
                      {addr.streetAddress}
                      {addr.building && `, ${addr.building}`}
                      {addr.apartment && `, Apt ${addr.apartment}`}
                    </p>
                    {addr.landmark && (
                      <p className="text-[11px] text-muted-foreground italic font-sans">Near {addr.landmark}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 span): COD Controls & Notes */}
        <div className="space-y-6">
          {/* Cash on Delivery (COD) Control Panel */}
          <div className="bg-card border border-border p-5 rounded-none space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                {customer.codDisabled ? (
                  <ShieldAlert className="size-4 text-destructive" />
                ) : (
                  <ShieldCheck className="size-4 text-emerald-600" />
                )}
                <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-foreground">
                  Cash on Delivery
                </h3>
              </div>
              {customer.codDisabled ? (
                <Badge variant="destructive" className="rounded-none text-[10px] uppercase font-sans">
                  Blocked
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-none text-[10px] uppercase text-emerald-600 border-emerald-500/30 bg-emerald-500/5 font-sans">
                  Allowed
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              Enable or restrict Cash on Delivery payment for this customer during checkout.
            </p>

            {customer.codDisabled && customer.codDisabledReason && (
              <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold font-sans">Restriction Reason:</p>
                  <p className="mt-0.5 font-sans">{customer.codDisabledReason}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleToggleCod} className="space-y-3.5 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-sans">
                <input
                  type="checkbox"
                  checked={codDisabled}
                  onChange={(e) => setCodDisabled(e.target.checked)}
                  className="size-4 rounded-none border-input text-destructive focus:ring-destructive"
                />
                <span className="font-medium text-foreground">
                  Block COD payment for this customer
                </span>
              </label>

              {codDisabled && (
                <div className="space-y-1.5 pl-6">
                  <Label htmlFor="codReason" className="text-[11px] font-sans text-muted-foreground">
                    Reason for restriction (recorded in audit log):
                  </Label>
                  <Input
                    id="codReason"
                    value={codReason}
                    onChange={(e) => setCodReason(e.target.value)}
                    placeholder="e.g. Refused multiple COD deliveries"
                    className="h-8 text-xs font-sans rounded-none border-input"
                  />
                </div>
              )}

              <div className="pt-1 space-y-2">
                <Button
                  type="submit"
                  disabled={isUpdatingCod}
                  size="sm"
                  variant={codDisabled ? "destructive" : "default"}
                  className="w-full rounded-none text-xs h-8 font-sans font-medium"
                >
                  {isUpdatingCod && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                  {codDisabled ? "Enforce COD Restriction" : "Allow COD Payment"}
                </Button>

                {codSuccessMsg && (
                  <p className="text-[11px] font-sans text-emerald-600 flex items-center justify-center gap-1">
                    <CheckCircle2 className="size-3.5" />
                    {codSuccessMsg}
                  </p>
                )}
                {codErrorMsg && (
                  <p className="text-[11px] font-sans text-destructive flex items-center justify-center gap-1">
                    <AlertTriangle className="size-3.5" />
                    {codErrorMsg}
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* Internal Boutique Notes */}
          <div className="bg-card border border-border p-5 rounded-none space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                Admin Notes
              </h3>
              {notesSuccessMsg && (
                <span className="text-[11px] font-sans text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" />
                  {notesSuccessMsg}
                </span>
              )}
            </div>

            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record fitting preferences, special delivery instructions, or VIP client requests..."
              rows={4}
              className="text-xs font-sans rounded-none border-input focus-visible:ring-1"
            />

            <Button
              onClick={handleSaveNotes}
              disabled={isUpdatingNotes}
              size="sm"
              variant="outline"
              className="w-full rounded-none text-xs h-8 font-sans"
            >
              {isUpdatingNotes && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
              Save Notes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
