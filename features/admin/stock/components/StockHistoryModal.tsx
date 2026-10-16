"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getVariantStockHistory } from "../actions"
import { AdminStockAdjustmentEntry } from "../types"
import { History, ArrowRight, Clock, FileText, AlertCircle } from "lucide-react"

interface StockHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  target: {
    variant_id: string
    sku: string
    product_name?: string
    colour_name?: string
    size_label?: string
  } | null
}

export function StockHistoryModal({
  isOpen,
  onClose,
  target,
}: StockHistoryModalProps) {
  const [history, setHistory] = React.useState<AdminStockAdjustmentEntry[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isOpen && target) {
      setIsLoading(true)
      setError(null)
      getVariantStockHistory(target.variant_id)
        .then((res) => {
          if (res.success) {
            setHistory(res.history)
          } else {
            setError(res.error || "Failed to load stock history.")
          }
        })
        .catch(() => {
          setError("Failed to load stock adjustment records.")
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isOpen, target])

  if (!target) return null

  function formatDateTime(iso: string) {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return iso
    }
  }

  function getReasonBadgeClass(reason: string) {
    switch (reason.toLowerCase()) {
      case "restock":
      case "opening stock":
      case "return restock":
        return "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
      case "damaged":
      case "cod refused":
        return "bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800"
      case "correction":
        return "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-card border-border rounded-none p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-sans font-semibold uppercase tracking-[0.16em]">
            <History className="size-3.5" />
            <span>Audit Trail & Inventory Ledger</span>
          </div>
          <DialogTitle className="text-lg font-sans font-bold tracking-tight text-foreground">
            Stock Adjustment History
          </DialogTitle>
          <DialogDescription className="text-xs font-sans text-muted-foreground">
            SKU: <span className="font-mono font-medium text-foreground">{target.sku}</span>
            {target.colour_name && (
              <> &bull; Colour: <span className="text-foreground">{target.colour_name}</span></>
            )}
            {target.size_label && (
              <> &bull; Size: <span className="font-mono text-foreground">{target.size_label}</span></>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 max-h-[60vh] overflow-y-auto space-y-3">
          {isLoading ? (
            <div className="space-y-2 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="p-3 border border-border flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-sans">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border p-6 text-muted-foreground">
              <Clock className="size-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-sans">No stock adjustments recorded for this SKU yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border border border-border bg-card">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-sans font-medium rounded-none px-1.5 py-0.5 border ${getReasonBadgeClass(
                          entry.reason
                        )}`}
                      >
                        {entry.reason}
                      </Badge>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {formatDateTime(entry.created_at)}
                      </span>
                    </div>

                    {entry.note && (
                      <div className="flex items-start gap-1.5 text-muted-foreground text-[11px] pt-0.5 font-sans">
                        <FileText className="size-3 shrink-0 mt-0.5" />
                        <span>{entry.note}</span>
                      </div>
                    )}
                  </div>

                  {/* Delta & Balance Shift */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded-none ${
                        entry.delta > 0
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : entry.delta < 0
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                    </span>

                    <div className="flex items-center gap-1 font-mono text-muted-foreground text-[11px]">
                      <span>{entry.on_hand_before}</span>
                      <ArrowRight className="size-3" />
                      <span className="font-semibold text-foreground">
                        {entry.on_hand_after}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-border flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-none text-xs font-sans"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
