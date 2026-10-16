"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, X } from "lucide-react"

interface OrdersToolbarProps {
  currentSearch?: string
  currentStatus?: string
  currentPaymentMethod?: string
  totalCount: number
  startTransition?: React.TransitionStartFunction
}

const ORDER_STATUSES = [
  { label: "All Orders", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Packed", value: "packed" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
]

export function OrdersToolbar({
  currentSearch = "",
  currentStatus = "all",
  currentPaymentMethod = "all",
  totalCount,
  startTransition: externalStartTransition,
}: OrdersToolbarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = React.useState(currentSearch)
  const [, internalStartTransition] = React.useTransition()
  const triggerTransition = externalStartTransition || internalStartTransition

  function updateQuery(params: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString())
    next.delete("page")
    Object.entries(params).forEach(([key, value]) => {
      if (!value || value === "all") next.delete(key)
      else next.set(key, value)
    })
    triggerTransition(() => router.push(`/admin/orders?${next.toString()}`))
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateQuery({ q: searchTerm })
  }

  function clearSearch() {
    setSearchTerm("")
    updateQuery({ q: null })
  }

  return (
    <div className="space-y-4">
      {/* Page title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Fulfilment
          </span>
          <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-0.5">
            Customer Orders
          </h1>
          <p className="mt-1 text-xs text-muted-foreground font-sans">
            Track, confirm and fulfil orders ({totalCount} total).
          </p>
        </div>

        {/* Payment method filter pills */}
        <div className="flex items-center gap-1.5">
          {(["all", "card", "cod"] as const).map((method) => {
            const labels = { all: "All", card: "Card", cod: "COD" }
            const isActive = currentPaymentMethod === method
            return (
              <button
                key={method}
                type="button"
                onClick={() => updateQuery({ payment_method: method })}
                className={`px-3 py-1.5 text-xs font-sans rounded-none border transition-colors ${
                  isActive
                    ? "bg-foreground text-background font-medium border-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground border-border/80"
                }`}
              >
                {labels[method]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Status tabs + search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
        {/* Status tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {ORDER_STATUSES.map((tab) => {
            const isActive = currentStatus === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => updateQuery({ status: tab.value })}
                className={`px-3 py-1.5 text-xs font-sans tracking-wide whitespace-nowrap rounded-none border transition-colors ${
                  isActive
                    ? "bg-foreground text-background font-medium border-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground border-border/80"
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-72">
          <Input
            type="text"
            placeholder="Search order #, email, phone, SKU…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 pl-8 pr-8 text-xs font-sans bg-background border-input rounded-none placeholder:text-muted-foreground/60"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
