"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search, X, Users, ShieldAlert, ShieldCheck } from "lucide-react"

interface CustomersToolbarProps {
  currentSearch?: string
  currentStatus?: string
  currentSort?: string
  totalCount: number
  activeCodCount: number
  blockedCodCount: number
  startTransition?: React.TransitionStartFunction
}

const STATUS_TABS = [
  { label: "All Customers", value: "all" },
  { label: "COD Allowed", value: "active" },
  { label: "COD Blocked", value: "cod_disabled" },
  { label: "VIP Spenders", value: "vip" },
]

export function CustomersToolbar({
  currentSearch = "",
  currentStatus = "all",
  totalCount,
  activeCodCount,
  blockedCodCount,
  startTransition: externalStartTransition,
}: CustomersToolbarProps) {
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
    triggerTransition(() => router.push(`/admin/customers?${next.toString()}`))
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
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border p-3.5 rounded-none flex items-center justify-between">
          <div>
            <p className="text-[10px] font-sans font-semibold uppercase tracking-[0.16em] text-muted-foreground">Total Customers</p>
            <p className="text-xl font-sans font-semibold tracking-tight text-foreground mt-0.5">{totalCount}</p>
          </div>
          <div className="size-8 bg-primary/5 border border-primary/10 flex items-center justify-center text-primary">
            <Users className="size-4" />
          </div>
        </div>

        <div className="bg-card border border-border p-3.5 rounded-none flex items-center justify-between">
          <div>
            <p className="text-[10px] font-sans font-semibold uppercase tracking-[0.16em] text-muted-foreground">COD Permitted</p>
            <p className="text-xl font-sans font-semibold tracking-tight text-foreground mt-0.5">{activeCodCount}</p>
          </div>
          <div className="size-8 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="size-4" />
          </div>
        </div>

        <div className="bg-card border border-border p-3.5 rounded-none flex items-center justify-between">
          <div>
            <p className="text-[10px] font-sans font-semibold uppercase tracking-[0.16em] text-muted-foreground">COD Blocked</p>
            <p className="text-xl font-sans font-semibold tracking-tight text-destructive mt-0.5">{blockedCodCount}</p>
          </div>
          <div className="size-8 bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
            <ShieldAlert className="size-4" />
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, email, or phone..."
            className="pl-9 pr-9 h-9 text-xs font-sans rounded-none border-input focus-visible:ring-1"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </form>

        {/* Status Tabs and Sort Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Segmented Buttons */}
          <div className="flex border border-border p-0.5 bg-muted/40 rounded-none">
            {STATUS_TABS.map((tab) => {
              const active = currentStatus === tab.value
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => updateQuery({ status: tab.value })}
                  className={`px-3 py-1 text-xs font-sans tracking-wide transition-colors ${
                    active
                      ? "bg-background text-foreground shadow-xs font-medium"
                      : "text-muted-foreground hover:text-foreground font-normal"
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
