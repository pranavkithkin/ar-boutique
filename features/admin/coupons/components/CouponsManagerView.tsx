"use client"

import * as React from "react"
import type { Coupon, CouponRedemption, DiscountType } from "@/features/coupons/types"
import {
  createCouponAction,
  updateCouponAction,
  toggleCouponStatusAction,
  getCouponRedemptionsAction,
  deleteCouponAction,
} from "@/features/coupons/actions"
import { formatAED } from "@/lib/money"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import {
  Tag,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Edit2,
  Power,
  Users,
  X,
  Loader2,
  TicketPercent,
  Calendar as CalendarIcon,
  Trash2,
} from "lucide-react"

interface CouponsManagerViewProps {
  initialCoupons: Coupon[]
}

export function CouponsManagerView({ initialCoupons }: CouponsManagerViewProps) {
  const [coupons, setCoupons] = React.useState<Coupon[]>(initialCoupons)
  const [prevInitial, setPrevInitial] = React.useState(initialCoupons)
  if (initialCoupons !== prevInitial) {
    setPrevInitial(initialCoupons)
    setCoupons(initialCoupons)
  }

  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive" | "expired">("all")

  // Modal states
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingCoupon, setEditingCoupon] = React.useState<Coupon | null>(null)
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null)

  // Redemptions view modal
  const [viewingRedemptionsCoupon, setViewingRedemptionsCoupon] = React.useState<Coupon | null>(null)
  const [redemptions, setRedemptions] = React.useState<CouponRedemption[]>([])
  const [loadingRedemptions, setLoadingRedemptions] = React.useState(false)

  // Deletion modal
  const [deletingCoupon, setDeletingCoupon] = React.useState<Coupon | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Notification status
  const [statusMessage, setStatusMessage] = React.useState<{ text: string; isError?: boolean } | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form fields
  const [formCode, setFormCode] = React.useState("")
  const [formDescription, setFormDescription] = React.useState("")
  const [formType, setFormType] = React.useState<DiscountType>("percentage")
  const [formValue, setFormValue] = React.useState("10")
  const [formMinSpend, setFormMinSpend] = React.useState("0")
  const [formMaxCap, setFormMaxCap] = React.useState("")
  const [formUsageLimit, setFormUsageLimit] = React.useState("")
  const [formPerCustomer, setFormPerCustomer] = React.useState("1")
  const [formStartsAt, setFormStartsAt] = React.useState<Date | undefined>(undefined)
  const [formExpiresAt, setFormExpiresAt] = React.useState<Date | undefined>(undefined)
  const [formIsActive, setFormIsActive] = React.useState(true)
  const [formError, setFormError] = React.useState<string | null>(null)

  const showStatus = (text: string, isError = false) => {
    setStatusMessage({ text, isError })
    setTimeout(() => setStatusMessage(null), 4000)
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const openCreateDialog = () => {
    setEditingCoupon(null)
    setFormCode("")
    setFormDescription("")
    setFormType("percentage")
    setFormValue("10")
    setFormMinSpend("0")
    setFormMaxCap("")
    setFormUsageLimit("")
    setFormPerCustomer("1")
    setFormStartsAt(undefined)
    setFormExpiresAt(undefined)
    setFormIsActive(true)
    setFormError(null)
    setIsFormOpen(true)
  }

  const openEditDialog = (c: Coupon) => {
    setEditingCoupon(c)
    setFormCode(c.code)
    setFormDescription(c.description || "")
    setFormType(c.discount_type)
    setFormValue(
      c.discount_type === "fixed_fils"
        ? (c.discount_value / 100).toString()
        : c.discount_value.toString()
    )
    setFormMinSpend((c.min_order_fils / 100).toString())
    setFormMaxCap(c.max_discount_fils ? (c.max_discount_fils / 100).toString() : "")
    setFormUsageLimit(c.usage_limit ? c.usage_limit.toString() : "")
    setFormPerCustomer(c.per_customer_limit.toString())
    setFormStartsAt(c.starts_at ? new Date(c.starts_at) : undefined)
    setFormExpiresAt(c.expires_at ? new Date(c.expires_at) : undefined)
    setFormIsActive(c.is_active)
    setFormError(null)
    setIsFormOpen(true)
  }

  const openRedemptionsModal = async (c: Coupon) => {
    setViewingRedemptionsCoupon(c)
    setLoadingRedemptions(true)
    try {
      const res = await getCouponRedemptionsAction(c.id)
      if (res.success) {
        setRedemptions(res.redemptions)
      } else {
        setRedemptions([])
      }
    } catch {
      setRedemptions([])
    } finally {
      setLoadingRedemptions(false)
    }
  }

  const handleToggleStatus = async (c: Coupon) => {
    const nextStatus = !c.is_active
    setCoupons((prev) =>
      prev.map((item) => (item.id === c.id ? { ...item, is_active: nextStatus } : item))
    )
    try {
      const res = await toggleCouponStatusAction(c.id, nextStatus)
      if (!res.success) {
        showStatus(res.error || "Failed to update status", true)
        setCoupons((prev) =>
          prev.map((item) => (item.id === c.id ? { ...item, is_active: !nextStatus } : item))
        )
      } else {
        showStatus(`Code "${c.code}" ${nextStatus ? "activated" : "paused"}.`)
      }
    } catch {
      showStatus("Failed to update status", true)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingCoupon) return
    setIsDeleting(true)
    try {
      const res = await deleteCouponAction(deletingCoupon.id)
      if (res.success) {
        setCoupons((prev) => prev.filter((item) => item.id !== deletingCoupon.id))
        showStatus(`Promo code "${deletingCoupon.code}" was permanently deleted.`)
        setDeletingCoupon(null)
        if (editingCoupon?.id === deletingCoupon.id) {
          setIsFormOpen(false)
          setEditingCoupon(null)
        }
      } else {
        showStatus(res.error || "Failed to delete coupon.", true)
      }
    } catch {
      showStatus("Failed to delete coupon.", true)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const code = formCode.trim().toUpperCase()
    if (!code) {
      setFormError("Please enter a code name.")
      return
    }

    const numericValue = parseFloat(formValue)
    if (isNaN(numericValue) || numericValue < 0) {
      setFormError("Please enter a valid discount value.")
      return
    }

    setIsSubmitting(true)

    const payload = {
      code,
      description: formDescription.trim() || null,
      discountType: formType,
      discountValue: numericValue,
      minOrderAed: parseFloat(formMinSpend) || 0,
      maxDiscountAed: formMaxCap ? parseFloat(formMaxCap) : null,
      usageLimit: formUsageLimit ? parseInt(formUsageLimit, 10) : null,
      perCustomerLimit: parseInt(formPerCustomer, 10) || 1,
      startsAt: formStartsAt ? formStartsAt.toISOString() : null,
      expiresAt: formExpiresAt ? formExpiresAt.toISOString() : null,
      isActive: formIsActive,
    }

    try {
      if (editingCoupon) {
        const res = await updateCouponAction(editingCoupon.id, payload)
        if (!res.success || !res.coupon) {
          setFormError(res.error || "Failed to update promo code.")
          setIsSubmitting(false)
          return
        }
        setCoupons((prev) => prev.map((item) => (item.id === res.coupon!.id ? res.coupon! : item)))
        showStatus(`Promo code "${code}" updated successfully.`)
      } else {
        const res = await createCouponAction(payload)
        if (!res.success || !res.coupon) {
          setFormError(res.error || "Failed to create promo code.")
          setIsSubmitting(false)
          return
        }
        setCoupons((prev) => [res.coupon!, ...prev])
        showStatus(`Promo code "${code}" created successfully.`)
      }
      setIsFormOpen(false)
    } catch {
      setFormError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter logic
  const now = new Date()
  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))

    if (!matchesSearch) return false

    const isExpired = c.expires_at ? new Date(c.expires_at) < now : false

    if (statusFilter === "active") {
      return c.is_active && !isExpired
    }
    if (statusFilter === "inactive") {
      return !c.is_active
    }
    if (statusFilter === "expired") {
      return isExpired
    }
    return true
  })

  // Summary Metrics
  const activeCount = coupons.filter(
    (c) => c.is_active && (!c.expires_at || new Date(c.expires_at) >= now)
  ).length
  const totalRedemptions = coupons.reduce((acc, c) => acc + (c.usage_count || 0), 0)

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Store Configuration
          </span>
          <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-0.5">
            Promo Codes & Discounts
          </h1>
          <p className="mt-1 text-xs text-muted-foreground font-sans">
            Configure promotional codes, minimum spend thresholds, and monitor live checkout redemptions.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            type="button"
            onClick={openCreateDialog}
            className="rounded-none h-9 text-xs px-4 uppercase tracking-widest font-medium font-sans"
          >
            <Plus className="size-3.5 mr-1.5" />
            Create Promo Code
          </Button>
        </div>
      </div>

      {/* Notifications Banner */}
      {statusMessage && (
        <div
          className={`p-3 text-xs flex items-center gap-2 rounded-none font-sans ${
            statusMessage.isError
              ? "bg-destructive/10 border border-destructive/30 text-destructive"
              : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {statusMessage.isError ? (
            <AlertCircle className="size-4 shrink-0" />
          ) : (
            <CheckCircle2 className="size-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-none p-5 space-y-1">
          <span className="text-[10px] font-sans font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Total Codes
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-semibold font-sans tracking-tight text-foreground">
              {coupons.length}
            </span>
            <span className="text-[11px] text-muted-foreground font-sans">in system</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-none p-5 space-y-1">
          <span className="text-[10px] font-sans font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Active Codes
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-semibold font-sans tracking-tight text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </span>
            <span className="text-[11px] text-muted-foreground font-sans">available on checkout</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-none p-5 space-y-1">
          <span className="text-[10px] font-sans font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Total Redemptions
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-semibold font-sans tracking-tight text-foreground">
              {totalRedemptions}
            </span>
            <span className="text-[11px] text-muted-foreground font-sans">completed orders</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search by code or campaign note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-none pl-9 h-9 text-xs border-border bg-background focus-visible:ring-0 focus-visible:border-foreground"
          />
        </div>

        {/* Status Tabs */}
        <div className="inline-flex items-center p-0.5 border border-border bg-muted/40 rounded-none overflow-x-auto">
          {(
            [
              { label: "All", value: "all" },
              { label: "Active", value: "active" },
              { label: "Paused", value: "inactive" },
              { label: "Expired", value: "expired" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 text-xs font-sans font-medium transition-colors ${
                statusFilter === tab.value
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Data Table */}
      <div className="border border-border bg-card rounded-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-border bg-muted/30 font-medium text-muted-foreground uppercase text-[10px] tracking-[0.1em]">
                <th className="py-3 px-4">Promo Code</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Spend Rule</th>
                <th className="py-3 px-4">Redemptions</th>
                <th className="py-3 px-4">Schedule</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-muted-foreground">
                    <Tag className="size-8 mx-auto text-muted-foreground/30 mb-2.5" />
                    <p className="text-sm font-semibold text-foreground">No promo codes found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {searchQuery
                        ? "Try clearing your search query or switching tabs."
                        : "Create your first boutique promo code with the button above."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => {
                  const isExpired = c.expires_at ? new Date(c.expires_at) < now : false
                  const isScheduled = c.starts_at ? new Date(c.starts_at) > now : false

                  return (
                    <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold px-2 py-1 bg-secondary text-foreground border border-border rounded-none tracking-widest">
                            {c.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(c.code)}
                            className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === c.code ? (
                              <Check className="size-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </button>
                        </div>
                        {c.description && (
                          <p className="text-[11px] text-muted-foreground mt-1 max-w-xs truncate">
                            {c.description}
                          </p>
                        )}
                      </td>

                      {/* Discount Value */}
                      <td className="py-3.5 px-4 font-medium">
                        {c.discount_type === "percentage" && (
                          <span className="text-foreground font-semibold">{c.discount_value}% OFF</span>
                        )}
                        {c.discount_type === "fixed_fils" && (
                          <span className="text-foreground font-semibold">
                            {formatAED(c.discount_value)} OFF
                          </span>
                        )}
                        {c.discount_type === "free_shipping" && (
                          <span className="text-blue-600 dark:text-blue-400 font-semibold tracking-wide uppercase text-[11px]">
                            Free Shipping
                          </span>
                        )}
                      </td>

                      {/* Thresholds */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <p className="text-[11px] text-muted-foreground">
                          Min spend:{" "}
                          <span className="text-foreground font-medium">
                            {c.min_order_fils > 0 ? formatAED(c.min_order_fils) : "None"}
                          </span>
                        </p>
                        {c.max_discount_fils && (
                          <p className="text-[10px] text-muted-foreground">
                            Max cap: {formatAED(c.max_discount_fils)}
                          </p>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-baseline gap-1">
                          <span className="font-semibold text-foreground">{c.usage_count}</span>
                          <span className="text-muted-foreground text-[11px]">
                            / {c.usage_limit ? c.usage_limit : "∞"}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Limit per user: {c.per_customer_limit}
                        </p>
                      </td>

                      {/* Validity */}
                      <td className="py-3.5 px-4 space-y-0.5 text-[11px]">
                        {c.expires_at ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="size-3 shrink-0" />
                            <span>Expires {new Date(c.expires_at).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No expiration</span>
                        )}
                        {c.starts_at && isScheduled && (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400">
                            Starts {new Date(c.starts_at).toLocaleDateString()}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {!c.is_active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                            Paused
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-semibold uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/20">
                            Expired
                          </span>
                        ) : isScheduled ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                            Scheduled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => openRedemptionsModal(c)}
                            className="p-1.5 text-muted-foreground hover:text-foreground rounded-none hover:bg-muted transition-colors"
                            title="View Redemptions"
                          >
                            <Users className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditDialog(c)}
                            className="p-1.5 text-muted-foreground hover:text-foreground rounded-none hover:bg-muted transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(c)}
                            className={`p-1.5 rounded-none transition-colors ${
                              c.is_active
                                ? "text-emerald-600 hover:text-destructive hover:bg-destructive/10"
                                : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
                            }`}
                            title={c.is_active ? "Pause Code" : "Activate Code"}
                          >
                            <Power className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCoupon(c)}
                            className="p-1.5 text-muted-foreground hover:text-destructive rounded-none hover:bg-destructive/10 transition-colors"
                            title="Delete Code"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create / Edit Promo Code Dialog ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card border border-border rounded-none shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {editingCoupon ? "Edit Code" : "New Campaign"}
                </span>
                <h2 className="font-sans text-xl font-semibold text-foreground tracking-tight mt-0.5">
                  {editingCoupon ? `Edit: ${editingCoupon.code}` : "Create Promo Code"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-none hover:bg-muted transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-none flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCoupon} className="space-y-5 text-xs font-sans">
              {/* Code */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Promo Code *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. EID2026"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  className="rounded-none uppercase font-mono tracking-widest text-xs h-9"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Campaign Description
                </label>
                <Input
                  type="text"
                  placeholder="e.g. VIP Eid promotional discount"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="rounded-none text-xs h-9"
                />
              </div>

              {/* Type and Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Discount Type *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as DiscountType)}
                    className="w-full h-9 px-3 rounded-none bg-background border border-input text-xs focus:outline-hidden focus:border-foreground"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_fils">Fixed Amount (AED)</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    {formType === "percentage"
                      ? "Percentage Off (%)"
                      : formType === "fixed_fils"
                      ? "Amount Off (AED)"
                      : "Discount Value"}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step={formType === "percentage" ? "1" : "0.5"}
                    disabled={formType === "free_shipping"}
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="rounded-none text-xs h-9 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Thresholds */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Minimum Order Spend (AED)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0 = No minimum"
                    value={formMinSpend}
                    onChange={(e) => setFormMinSpend(e.target.value)}
                    className="rounded-none text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Max Discount Cap (AED)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Optional cap for %"
                    disabled={formType !== "percentage"}
                    value={formMaxCap}
                    onChange={(e) => setFormMaxCap(e.target.value)}
                    className="rounded-none text-xs h-9 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Global Usage Limit
                  </label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Leave blank for unlimited"
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value)}
                    className="rounded-none text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Limit Per Customer
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formPerCustomer}
                    onChange={(e) => setFormPerCustomer(e.target.value)}
                    className="rounded-none text-xs h-9"
                  />
                </div>
              </div>

              {/* Scheduling Dates with shadcn Calendar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Starts At
                  </label>
                  <Popover>
                    <PopoverTrigger className="flex items-center justify-between w-full h-9 px-3 border border-input rounded-none bg-background text-xs font-sans text-left hover:bg-muted/20 transition-colors">
                      <span className={formStartsAt ? "text-foreground font-medium" : "text-muted-foreground"}>
                        {formStartsAt ? format(formStartsAt, "MMM d, yyyy") : "Starts immediately"}
                      </span>
                      <CalendarIcon className="size-3.5 text-muted-foreground shrink-0" />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-none bg-card border border-border shadow-lg" align="start">
                      <Calendar
                        mode="single"
                        selected={formStartsAt}
                        onSelect={(d) => setFormStartsAt(d ?? undefined)}
                        className="rounded-none border-0"
                      />
                      {formStartsAt && (
                        <div className="p-2 border-t border-border flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => setFormStartsAt(undefined)}
                            className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                          >
                            Clear Start Date
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Expires At
                  </label>
                  <Popover>
                    <PopoverTrigger className="flex items-center justify-between w-full h-9 px-3 border border-input rounded-none bg-background text-xs font-sans text-left hover:bg-muted/20 transition-colors">
                      <span className={formExpiresAt ? "text-foreground font-medium" : "text-muted-foreground"}>
                        {formExpiresAt ? format(formExpiresAt, "MMM d, yyyy") : "No expiration"}
                      </span>
                      <CalendarIcon className="size-3.5 text-muted-foreground shrink-0" />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-none bg-card border border-border shadow-lg" align="start">
                      <Calendar
                        mode="single"
                        selected={formExpiresAt}
                        onSelect={(d) => setFormExpiresAt(d ?? undefined)}
                        disabled={(d) => (formStartsAt ? d < formStartsAt : false)}
                        className="rounded-none border-0"
                      />
                      {formExpiresAt && (
                        <div className="p-2 border-t border-border flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => setFormExpiresAt(undefined)}
                            className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                          >
                            Clear Expiration
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="coupon-active-chk"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded-none text-primary border-input h-4 w-4"
                />
                <label
                  htmlFor="coupon-active-chk"
                  className="text-xs font-medium text-foreground cursor-pointer"
                >
                  Active immediately on storefront checkout
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
                {editingCoupon ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeletingCoupon(editingCoupon)}
                    disabled={isSubmitting}
                    className="rounded-none h-9 text-xs px-3"
                  >
                    <Trash2 className="size-3.5 mr-1.5" />
                    Delete Code
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFormOpen(false)}
                    className="rounded-none h-9 text-xs px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-none h-9 text-xs px-5 uppercase tracking-widest font-medium font-sans"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        Saving...
                      </>
                    ) : (
                      <span>{editingCoupon ? "Save Changes" : "Create Code"}</span>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Redemptions Audit Modal ── */}
      {viewingRedemptionsCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card border border-border rounded-none shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Audit Log
                </span>
                <h2 className="font-sans text-base font-semibold text-foreground tracking-tight mt-0.5 flex items-center gap-2">
                  <TicketPercent className="size-4 text-primary" />
                  <span>Redemptions: {viewingRedemptionsCoupon.code}</span>
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-sans">
                  Total uses: {viewingRedemptionsCoupon.usage_count}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingRedemptionsCoupon(null)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-none hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            {loadingRedemptions ? (
              <div className="py-10 flex items-center justify-center text-muted-foreground text-xs gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>Loading redemptions history...</span>
              </div>
            ) : redemptions.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-xs">
                No customer orders have redeemed this promo code yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {redemptions.map((r) => (
                  <div key={r.id} className="py-3 flex items-center justify-between text-xs font-sans">
                    <div>
                      <p className="font-medium text-foreground">{r.customer_email}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(r.redeemed_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        -{formatAED(r.discount_fils)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card border border-border rounded-none shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-destructive">
                Confirm Deletion
              </span>
              <h3 className="text-base font-semibold text-foreground tracking-tight">
                Delete &ldquo;{deletingCoupon.code}&rdquo;?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This will permanently delete this promotional code. Existing completed orders will preserve their historical discount records.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingCoupon(null)}
                disabled={isDeleting}
                className="rounded-none text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-none text-xs uppercase tracking-wider font-medium"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-3 animate-spin mr-1.5" />
                    Deleting...
                  </>
                ) : (
                  "Delete Code"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
