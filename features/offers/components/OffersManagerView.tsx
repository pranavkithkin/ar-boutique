"use client"

import * as React from "react"
import Link from "next/link"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatAED } from "@/lib/money"
import { offerState, type Offer } from "../types"
import {
  Plus,
  Search,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  Tag,
  AlertCircle,
  Calendar,
  Sparkles,
  Layers,
} from "lucide-react"

interface OfferUsageItem {
  reserved: number
  redeemed: number
}

interface OfferAttentionItem {
  id: string
  order_number: string
  offer_payment_note: string | null
}

interface OffersManagerViewProps {
  initialOffers: Offer[]
  initialUsage: Record<string, OfferUsageItem>
  attention: OfferAttentionItem[]
}

function getDiscountBadge(offer: Offer) {
  if (offer.discount_type === "percentage") {
    return `${offer.discount_value}% OFF`
  }
  if (offer.discount_type === "free_shipping") {
    return "FREE DELIVERY"
  }
  return `${formatAED(offer.discount_value)} OFF`
}

function getScopeText(offer: Offer) {
  if (offer.scope === "all") return "Storewide (All)"
  if (offer.scope === "products") {
    const count = offer.product_ids?.length || 0
    return `${count} ${count === 1 ? "Product" : "Products"}`
  }
  if (offer.scope === "categories") {
    const count = offer.category_ids?.length || 0
    return `${count} ${count === 1 ? "Category" : "Categories"}`
  }
  return "Selected"
}

function formatDateRange(startsAt: string | null, expiresAt: string | null) {
  if (!startsAt && !expiresAt) return "Always Active"
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
  const startStr = startsAt ? new Date(startsAt).toLocaleDateString("en-AE", opts) : "Now"
  const endStr = expiresAt ? new Date(expiresAt).toLocaleDateString("en-AE", opts) : "Ongoing"
  return `${startStr} – ${endStr}`
}

function StatusBadge({ state }: { state: string }) {
  switch (state) {
    case "active":
      return (
        <Badge
          variant="outline"
          className="rounded-none bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5"
        >
          Active
        </Badge>
      )
    case "scheduled":
      return (
        <Badge
          variant="outline"
          className="rounded-none bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5"
        >
          Scheduled
        </Badge>
      )
    case "draft":
      return (
        <Badge
          variant="outline"
          className="rounded-none bg-muted text-muted-foreground border-border text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5"
        >
          Draft
        </Badge>
      )
    case "expired":
      return (
        <Badge
          variant="outline"
          className="rounded-none bg-destructive/10 text-destructive border-destructive/20 text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5"
        >
          Expired
        </Badge>
      )
    case "disabled":
      return (
        <Badge
          variant="outline"
          className="rounded-none bg-muted text-muted-foreground border-border text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5"
        >
          Disabled
        </Badge>
      )
    default:
      return (
        <Badge
          variant="outline"
          className="rounded-none text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5"
        >
          {state}
        </Badge>
      )
  }
}

export function OffersManagerView({
  initialOffers,
  initialUsage,
  attention,
}: OffersManagerViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "scheduled" | "draft" | "expired">("all")
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  const copyBannerLink = async (slug: string, id: string) => {
    const linkPath = `/offers/${slug}`
    try {
      await navigator.clipboard.writeText(linkPath)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2500)
    } catch {
      // Fallback
    }
  }

  // Filter offers
  const filteredOffers = React.useMemo(() => {
    return initialOffers.filter((offer) => {
      const state = offerState(offer)
      if (statusFilter === "active" && state !== "active") return false
      if (statusFilter === "scheduled" && state !== "scheduled") return false
      if (statusFilter === "draft" && state !== "draft") return false
      if (statusFilter === "expired" && (state !== "expired" && state !== "disabled")) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          offer.title.toLowerCase().includes(q) ||
          offer.slug.toLowerCase().includes(q) ||
          (offer.description && offer.description.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [initialOffers, statusFilter, searchQuery])

  // Metrics
  const activeCount = initialOffers.filter((o) => offerState(o) === "active").length
  const totalRedemptions = Object.values(initialUsage).reduce((acc, u) => acc + (u.redeemed || 0), 0)

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Promotions & Campaigns
          </span>
          <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-0.5">
            Offer Landing Pages
          </h1>
          <p className="mt-1 text-xs text-muted-foreground font-sans">
            Campaign destination pages linked directly from your homepage hero slides and promotional banners.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            nativeButton={false}
            render={<Link href="/admin/offers/new" />}
            className="h-9 px-4 text-xs font-sans font-medium uppercase tracking-widest rounded-none inline-flex flex-row items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus className="size-3.5 shrink-0" />
            <span className="whitespace-nowrap">Create Offer</span>
          </Button>
        </div>
      </div>

      {/* ── Checkouts Needing Review Banner ── */}
      {attention && attention.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold uppercase tracking-wider text-[11px]">
            <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Checkouts Needing Order Review ({attention.length})</span>
          </div>
          <div className="divide-y divide-amber-500/20 pt-1">
            {attention.map((order) => (
              <div key={order.id} className="py-1.5 flex items-center justify-between gap-4">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-medium underline underline-offset-4 hover:opacity-80"
                >
                  Order #{order.order_number}
                </Link>
                <span className="text-muted-foreground">{order.offer_payment_note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Metrics Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-none p-5 space-y-1">
          <span className="text-[10px] font-sans font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Total Campaigns
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-semibold font-sans tracking-tight text-foreground">
              {initialOffers.length}
            </span>
            <span className="text-[11px] text-muted-foreground font-sans">created</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-none p-5 space-y-1">
          <span className="text-[10px] font-sans font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Active Offers
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-semibold font-sans tracking-tight text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </span>
            <span className="text-[11px] text-muted-foreground font-sans">live on storefront</span>
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
            <span className="text-[11px] text-muted-foreground font-sans">orders completed</span>
          </div>
        </div>
      </div>

      {/* ── Filter & Search Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 border-b sm:border-b-0 border-border">
          {(
            [
              { id: "all", label: "All Campaigns" },
              { id: "active", label: "Active" },
              { id: "scheduled", label: "Scheduled" },
              { id: "draft", label: "Draft" },
              { id: "expired", label: "Expired / Disabled" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`h-8 px-3 text-xs font-sans font-medium uppercase tracking-wider transition-colors shrink-0 ${
                statusFilter === tab.id
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns..."
            className="pl-8 h-8 text-xs font-sans rounded-none bg-background border-border"
          />
        </div>
      </div>

      {/* ── Shadcn Offers Table ── */}
      <div className="border border-border bg-card shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-foreground">
                Campaign
              </TableHead>
              <TableHead className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-foreground">
                Discount
              </TableHead>
              <TableHead className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-foreground">
                Scope
              </TableHead>
              <TableHead className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-foreground">
                Validity
              </TableHead>
              <TableHead className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-foreground">
                Usage
              </TableHead>
              <TableHead className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-foreground">
                Status
              </TableHead>
              <TableHead className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOffers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Tag className="size-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-foreground">No campaign offers found</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {searchQuery
                        ? "No offers matched your search criteria."
                        : "Create your first campaign offer, then connect it to your homepage banners."}
                    </p>
                    {!searchQuery && (
                      <Button
                        nativeButton={false}
                        render={<Link href="/admin/offers/new" />}
                        size="sm"
                        className="mt-2 rounded-none uppercase text-xs tracking-wider inline-flex flex-row items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <Plus className="size-3 shrink-0" />
                        <span className="whitespace-nowrap">Create Offer</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredOffers.map((offer) => {
                const state = offerState(offer)
                const u = initialUsage[offer.id] || { reserved: 0, redeemed: 0 }
                const isCopied = copiedId === offer.id

                return (
                  <TableRow
                    key={offer.id}
                    className="border-b border-border/60 hover:bg-muted/30 transition-colors"
                  >
                    {/* Campaign Title & Slug */}
                    <TableCell className="py-3 px-4 align-middle">
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={`/admin/offers/${offer.id}`}
                          className="font-medium text-sm text-foreground hover:underline underline-offset-4 tracking-tight"
                        >
                          {offer.title}
                        </Link>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          /offers/{offer.slug}
                        </span>
                      </div>
                    </TableCell>

                    {/* Discount Tag */}
                    <TableCell className="py-3 px-4 align-middle whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 text-xs font-semibold tracking-wider font-mono">
                        {getDiscountBadge(offer)}
                      </div>
                      {offer.min_order_fils > 0 && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Min spend: {formatAED(offer.min_order_fils)}
                        </div>
                      )}
                    </TableCell>

                    {/* Target Scope */}
                    <TableCell className="py-3 px-4 align-middle whitespace-nowrap text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{getScopeText(offer)}</span>
                    </TableCell>

                    {/* Validity Range */}
                    <TableCell className="py-3 px-4 align-middle whitespace-nowrap text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3 text-muted-foreground shrink-0" />
                        <span>{formatDateRange(offer.starts_at, offer.expires_at)}</span>
                      </div>
                    </TableCell>

                    {/* Usage Counts */}
                    <TableCell className="py-3 px-4 align-middle whitespace-nowrap text-xs">
                      <span className="font-semibold text-foreground">{u.redeemed}</span>{" "}
                      <span className="text-muted-foreground">redeemed</span>
                      {u.reserved > 0 && (
                        <span className="text-amber-600 dark:text-amber-400 block text-[10px]">
                          ({u.reserved} in checkout)
                        </span>
                      )}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="py-3 px-4 align-middle whitespace-nowrap">
                      <StatusBadge state={state} />
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3 px-4 align-middle whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Copy Link Button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyBannerLink(offer.slug, offer.id)}
                          className="h-8 px-2.5 text-xs rounded-none border-border hover:bg-muted transition-colors gap-1.5"
                          title="Copy link to use in hero or promo banner"
                        >
                          {isCopied ? (
                            <>
                              <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                                Copied!
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3 text-muted-foreground" />
                              <span className="text-[11px]">Copy Link</span>
                            </>
                          )}
                        </Button>

                        {/* Preview in new tab */}
                        <Button
                          nativeButton={false}
                          render={
                            <Link
                              href={`/admin/offers/${offer.id}/preview`}
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          }
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs rounded-none hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
                          title="Preview public campaign page"
                        >
                          <ExternalLink className="size-3.5 shrink-0" />
                        </Button>

                        {/* Edit Button */}
                        <Button
                          nativeButton={false}
                          render={<Link href={`/admin/offers/${offer.id}`} />}
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs rounded-none hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
                          title="Edit offer"
                        >
                          <Edit2 className="size-3.5 shrink-0" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
