"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

interface ReturnsToolbarProps {
  currentSearch?: string
  currentStatus?: string
  totalCount: number
  startTransition?: React.TransitionStartFunction
}

const RETURN_STATUSES = [
  { label: "All Returns", value: "all" },
  { label: "Requested", value: "requested" },
  { label: "Approved", value: "approved" },
  { label: "In Transit", value: "in_transit" },
  { label: "Received", value: "received" },
  { label: "Rejected", value: "rejected" },
  { label: "Closed", value: "closed" },
]

export function ReturnsToolbar({
  currentSearch = "",
  currentStatus = "all",
  totalCount,
  startTransition: externalStartTransition,
}: ReturnsToolbarProps) {
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
    triggerTransition(() => router.push(`/admin/returns?${next.toString()}`))
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
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Fulfilment & Care
          </span>
          <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-0.5">
            Returns & Exchanges
          </h1>
          <p className="mt-1 text-xs text-muted-foreground font-sans">
            Review claims, inspect received garments, and record refunds ({totalCount} total).
          </p>
        </div>
      </div>

      {/* Status filter tabs + search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
        {/* Status tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {RETURN_STATUSES.map((tab) => {
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
            placeholder="Search return #, customer, email…"
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
