"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AdminStockSummary, StockFilter } from "../types"
import {
  Search,
  X,
  Boxes,
  Table as TableIcon,
  LayoutGrid,
  AlertTriangle,
  PackageCheck,
  PackageX,
} from "lucide-react"

interface StockToolbarProps {
  currentSearch: string
  currentStatus: StockFilter
  currentView: "table" | "matrix"
  onViewChange: (view: "table" | "matrix") => void
  summary: AdminStockSummary
  startTransition: (callback: () => void) => void
}

export function StockToolbar({
  currentSearch,
  currentStatus,
  currentView,
  onViewChange,
  summary,
  startTransition,
}: StockToolbarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = React.useState(currentSearch)

  // Sync internal state if URL changes
  React.useEffect(() => {
    setSearchValue(currentSearch)
  }, [currentSearch])

  function handleStatusChange(status: StockFilter) {
    const params = new URLSearchParams(searchParams.toString())
    if (status === "all") {
      params.delete("status")
    } else {
      params.set("status", status)
    }
    params.set("page", "1")

    startTransition(() => {
      router.push(`/admin/stock?${params.toString()}`)
    })
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    const trimmed = searchValue.trim()
    if (trimmed) {
      params.set("search", trimmed)
    } else {
      params.delete("search")
    }
    params.set("page", "1")

    startTransition(() => {
      router.push(`/admin/stock?${params.toString()}`)
    })
  }

  function handleClearSearch() {
    setSearchValue("")
    const params = new URLSearchParams(searchParams.toString())
    params.delete("search")
    params.set("page", "1")

    startTransition(() => {
      router.push(`/admin/stock?${params.toString()}`)
    })
  }

  const tabs: {
    id: StockFilter
    label: string
    count: number
    icon?: React.ReactNode
    activeClass?: string
  }[] = [
    {
      id: "all",
      label: "All SKUs",
      count: summary.total_skus,
      icon: <Boxes className="size-3.5" />,
    },
    {
      id: "in_stock",
      label: "In Stock",
      count: summary.in_stock_count,
      icon: <PackageCheck className="size-3.5" />,
      activeClass: "text-emerald-700 dark:text-emerald-400 border-emerald-600",
    },
    {
      id: "low_stock",
      label: "Low Stock (≤ 3)",
      count: summary.low_stock_count,
      icon: <AlertTriangle className="size-3.5" />,
      activeClass: "text-amber-700 dark:text-amber-400 border-amber-500",
    },
    {
      id: "out_of_stock",
      label: "Out of Stock (0)",
      count: summary.out_of_stock_count,
      icon: <PackageX className="size-3.5" />,
      activeClass: "text-red-700 dark:text-red-400 border-red-500",
    },
  ]

  return (
    <div className="space-y-4">
      {/* KPI Overview Summary Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-card border border-border">
          <div className="text-[10px] font-sans font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Total Inventory Units
          </div>
          <div className="text-xl font-mono font-medium text-foreground mt-1">
            {summary.total_on_hand}{" "}
            <span className="text-xs text-muted-foreground font-sans">on hand</span>
          </div>
        </div>

        <div className="p-3.5 bg-card border border-border">
          <div className="text-[10px] font-sans font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Reserved for Orders
          </div>
          <div className="text-xl font-mono font-medium text-amber-600 dark:text-amber-400 mt-1">
            {summary.total_reserved}{" "}
            <span className="text-xs text-muted-foreground font-sans">held</span>
          </div>
        </div>

        <div className="p-3.5 bg-card border border-border">
          <div className="text-[10px] font-sans font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Available to Sell
          </div>
          <div className="text-xl font-mono font-medium text-emerald-600 dark:text-emerald-400 mt-1">
            {summary.total_available}{" "}
            <span className="text-xs text-muted-foreground font-sans">units</span>
          </div>
        </div>

        <div className="p-3.5 bg-card border border-border">
          <div className="text-[10px] font-sans font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Catalogue Health
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-mono font-semibold text-foreground">
              {summary.total_skus} SKUs
            </span>
            {summary.low_stock_count > 0 && (
              <span className="text-[10px] font-sans px-1.5 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/20">
                {summary.low_stock_count} low
              </span>
            )}
            {summary.out_of_stock_count > 0 && (
              <span className="text-[10px] font-sans px-1.5 py-0.5 bg-red-500/10 text-red-600 border border-red-500/20">
                {summary.out_of_stock_count} out
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs & View Mode Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = currentStatus === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleStatusChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-medium transition-colors border whitespace-nowrap rounded-none ${
                  isActive
                    ? tab.activeClass || "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1 py-0.2 rounded-none ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* View Switcher: Table vs Matrix Grid */}
        <div className="flex items-center gap-1 self-end sm:self-auto shrink-0 bg-muted/40 p-1 border border-border">
          <Button
            type="button"
            size="sm"
            variant={currentView === "table" ? "default" : "ghost"}
            onClick={() => onViewChange("table")}
            className="h-7 px-2.5 text-xs font-sans gap-1.5 rounded-none"
          >
            <TableIcon className="size-3.5" />
            <span>SKU Table</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={currentView === "matrix" ? "default" : "ghost"}
            onClick={() => onViewChange("matrix")}
            className="h-7 px-2.5 text-xs font-sans gap-1.5 rounded-none"
          >
            <LayoutGrid className="size-3.5" />
            <span>Colours × Sizes Grid</span>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search SKU, Style Code, Product Name, Colour..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs rounded-none border-input font-sans bg-background"
          />
          {searchValue && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          size="sm"
          className="h-9 px-4 text-xs font-sans rounded-none bg-primary text-primary-foreground"
        >
          Search
        </Button>
      </form>
    </div>
  )
}
