"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Filter, X, FileSpreadsheet, Download, Loader2 } from "lucide-react"
import { AdminCategory } from "../types"
import { StockSheetImportModal } from "./StockSheetImportModal"

interface ProductsToolbarProps {
  categories: AdminCategory[]
  currentSearch?: string
  currentStatus?: string
  currentCategory?: string
  totalCount: number
}

export function ProductsToolbar({
  categories,
  currentSearch = "",
  currentStatus = "all",
  currentCategory = "all",
  totalCount,
}: ProductsToolbarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = React.useState(currentSearch)
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)
  const [, startTransition] = React.useTransition()

  async function handleExportCatalogue() {
    try {
      setIsExporting(true)
      const res = await fetch("/api/admin/catalogue-export")
      if (!res.ok) {
        throw new Error("Export failed with status " + res.status)
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `AR-Boutique-Stock-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Export error:", err)
      alert("Failed to export catalogue. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  function updateQuery(params: Record<string, string | null>) {
    const nextParams = new URLSearchParams(searchParams.toString())
    // When changing filters or search terms, always reset pagination back to page 1
    nextParams.delete("page")
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        nextParams.delete(key)
      } else {
        nextParams.set(key, value)
      }
    })
    startTransition(() => {
      router.push(`/admin/products?${nextParams.toString()}`)
    })
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateQuery({ q: searchTerm })
  }

  function clearSearch() {
    setSearchTerm("")
    updateQuery({ q: null })
  }

  const statuses = [
    { label: "All Products", value: "all" },
    { label: "Published", value: "published" },
    { label: "Drafts", value: "draft" },
    { label: "Archived", value: "archived" },
  ]

  return (
    <div className="space-y-4">
      {/* Top Bar: Title & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Catalogue
          </span>
          <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-0.5">
            Product Management
          </h1>
          <p className="mt-1 text-xs text-muted-foreground font-sans">
            Manage luxury garments, colourways, stock variants, and client style codes ({totalCount} items).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCatalogue}
            disabled={isExporting}
            className="h-9 px-3.5 text-xs font-sans font-medium uppercase tracking-[0.08em] rounded-none border-border hover:bg-muted gap-1.5"
            title="Download full catalogue spreadsheet (.xlsx)"
          >
            {isExporting ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <Download className="size-4 text-primary" />
            )}
            <span>{isExporting ? "Exporting..." : "Download Catalogue"}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
            className="h-9 px-3.5 text-xs font-sans font-medium uppercase tracking-[0.08em] rounded-none border-border hover:bg-muted gap-1.5"
          >
            <FileSpreadsheet className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Bulk Edit / Import</span>
          </Button>

          <Button
            nativeButton={false}
            render={<Link href="/admin/products/new" />}
            className="h-9 px-4 text-xs font-sans font-medium uppercase tracking-[0.08em] rounded-none bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
          >
            <Plus className="size-4" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 border-b lg:border-b-0 pb-2 lg:pb-0 overflow-x-auto no-scrollbar">
          {statuses.map((tab) => {
            const isActive = currentStatus === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => updateQuery({ status: tab.value })}
                className={`px-3 py-1.5 text-xs font-sans tracking-wide transition-colors whitespace-nowrap rounded-none border ${
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

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={currentCategory}
              onChange={(e) => updateQuery({ category: e.target.value })}
              className="h-9 px-3 pr-8 text-xs font-sans bg-background border border-input rounded-none text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer w-full sm:w-44"
              aria-label="Filter by Category"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <Input
              type="text"
              placeholder="Search by name, SKU, style..."
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

      <StockSheetImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  )
}
