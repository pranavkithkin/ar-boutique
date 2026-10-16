"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { StockToolbar } from "./StockToolbar"
import { StockTable } from "./StockTable"
import { StockMatrixGrid } from "./StockMatrixGrid"
import { StockAdjustmentModal, StockAdjustTarget } from "./StockAdjustmentModal"
import { StockHistoryModal } from "./StockHistoryModal"
import {
  AdminStockSkuItem,
  AdminStockMatrixRow,
  AdminStockSummary,
  StockFilter,
} from "../types"
import { Skeleton } from "@/components/ui/skeleton"

interface StockClientContainerProps {
  initialItems: AdminStockSkuItem[]
  matrixRows: AdminStockMatrixRow[]
  allSizeLabels: string[]
  summary: AdminStockSummary
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  currentSearch: string
  currentStatus: StockFilter
}

export function StockClientContainer({
  initialItems,
  matrixRows,
  allSizeLabels,
  summary,
  pagination,
  currentSearch,
  currentStatus,
}: StockClientContainerProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [viewMode, setViewMode] = React.useState<"table" | "matrix">("table")

  // Modal target states
  const [adjustTarget, setAdjustTarget] = React.useState<StockAdjustTarget | null>(null)
  const [historyTarget, setHistoryTarget] = React.useState<{
    variant_id: string
    sku: string
    product_name?: string
    colour_name?: string
    size_label?: string
  } | null>(null)

  function handleAdjustSuccess() {
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <StockToolbar
        currentSearch={currentSearch}
        currentStatus={currentStatus}
        currentView={viewMode}
        onViewChange={setViewMode}
        summary={summary}
        startTransition={startTransition}
      />

      {isPending ? (
        <div className="border border-border bg-card rounded-none overflow-hidden animate-pulse">
          <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-14" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                </div>
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-14" />
                <Skeleton className="h-3.5 w-12" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-7 w-20" />
              </div>
            ))}
          </div>
        </div>
      ) : viewMode === "table" ? (
        <StockTable
          items={initialItems}
          pagination={pagination}
          onOpenAdjust={setAdjustTarget}
          onOpenHistory={setHistoryTarget}
          startTransition={startTransition}
        />
      ) : (
        <StockMatrixGrid
          matrixRows={matrixRows}
          allSizeLabels={allSizeLabels}
          onOpenAdjust={setAdjustTarget}
          onOpenHistory={setHistoryTarget}
        />
      )}

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={!!adjustTarget}
        onClose={() => setAdjustTarget(null)}
        target={adjustTarget}
        onSuccess={handleAdjustSuccess}
      />

      {/* Stock History Audit Trail Modal */}
      <StockHistoryModal
        isOpen={!!historyTarget}
        onClose={() => setHistoryTarget(null)}
        target={historyTarget}
      />
    </div>
  )
}
