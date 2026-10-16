"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { AdminStockSkuItem } from "../types"
import { StockAdjustTarget } from "./StockAdjustmentModal"
import { formatAED } from "@/lib/money"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Boxes,
  History,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Package,
  SlidersHorizontal,
} from "lucide-react"

interface StockTableProps {
  items: AdminStockSkuItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  onOpenAdjust: (target: StockAdjustTarget) => void
  onOpenHistory: (target: {
    variant_id: string
    sku: string
    product_name?: string
    colour_name?: string
    size_label?: string
  }) => void
  startTransition: (callback: () => void) => void
}

export function StockTable({
  items,
  pagination,
  onOpenAdjust,
  onOpenHistory,
  startTransition,
}: StockTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > pagination.totalPages) return
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", newPage.toString())

    startTransition(() => {
      router.push(`/admin/stock?${params.toString()}`)
    })
  }

  if (items.length === 0) {
    return (
      <div className="border border-border bg-card p-12 text-center">
        <Package className="size-10 text-muted-foreground mx-auto mb-3 opacity-40" />
        <h3 className="font-sans text-sm font-semibold text-foreground">
          No inventory records found
        </h3>
        <p className="text-xs font-sans text-muted-foreground mt-1 max-w-sm mx-auto">
          No SKUs match your active filter criteria. Try clearing search filters or selecting
          &quot;All SKUs&quot;.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-border bg-card rounded-none overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              <th className="py-3 px-4">Item &amp; Style</th>
              <th className="py-3 px-4">Colour &amp; Size</th>
              <th className="py-3 px-4">Client SKU</th>
              <th className="py-3 px-3 text-right">Price</th>
              <th className="py-3 px-3 text-right">On Hand</th>
              <th className="py-3 px-3 text-right">Reserved</th>
              <th className="py-3 px-4 text-center">Available Stock</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => {
              return (
                <tr
                  key={item.variant_id}
                  className="hover:bg-muted/20 transition-colors group"
                >
                  {/* Product & Style */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 aspect-[4/5] shrink-0 bg-muted/60 border border-border overflow-hidden">
                        {item.thumbnail_url ? (
                          <Image
                            src={item.thumbnail_url}
                            alt={item.product_name}
                            fill
                            sizes="40px"
                            className="object-cover object-top"
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center text-muted-foreground">
                            <Boxes className="size-4 opacity-40" />
                          </div>
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/admin/products/${item.product_id}`}
                          className="font-sans font-semibold text-foreground hover:underline line-clamp-1"
                        >
                          {item.product_name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-muted-foreground">
                            Style: {item.style_code}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Colour & Size */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">{item.colour_name}</div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-mono rounded-none px-1.5 py-0 bg-muted text-muted-foreground border-border"
                      >
                        Size: {item.size_label}
                      </Badge>
                    </div>
                  </td>

                  {/* Client SKU (As written, ADR-029) */}
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-xs font-semibold text-foreground bg-muted/40 px-2 py-1 border border-border inline-block">
                      {item.sku}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-3 text-right font-mono text-muted-foreground">
                    {formatAED(item.price_fils)}
                  </td>

                  {/* On Hand */}
                  <td className="py-3.5 px-3 text-right">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {item.on_hand}
                    </span>
                  </td>

                  {/* Reserved */}
                  <td className="py-3.5 px-3 text-right">
                    {item.reserved > 0 ? (
                      <span className="font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
                        {item.reserved} held
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">0</span>
                    )}
                  </td>

                  {/* Available Stock & Status */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-mono text-sm font-bold text-foreground">
                        {item.available}
                      </span>
                      {item.status === "in_stock" && (
                        <span className="text-[10px] font-sans text-emerald-600 dark:text-emerald-400 font-medium">
                          In Stock
                        </span>
                      )}
                      {item.status === "low_stock" && (
                        <span className="text-[10px] font-sans text-amber-600 dark:text-amber-400 font-medium">
                          Only {item.available} left
                        </span>
                      )}
                      {item.status === "out_of_stock" && (
                        <span className="text-[10px] font-sans text-destructive font-medium">
                          Sold Out
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onOpenAdjust({
                            variant_id: item.variant_id,
                            product_id: item.product_id,
                            sku: item.sku,
                            product_name: item.product_name,
                            style_code: item.style_code,
                            colour_name: item.colour_name,
                            size_label: item.size_label,
                            on_hand: item.on_hand,
                            reserved: item.reserved,
                          })
                        }
                        className="h-7 px-2 text-[11px] font-sans rounded-none gap-1 border-border"
                      >
                        <SlidersHorizontal className="size-3" />
                        <span>Adjust</span>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onOpenHistory({
                            variant_id: item.variant_id,
                            sku: item.sku,
                            product_name: item.product_name,
                            colour_name: item.colour_name,
                            size_label: item.size_label,
                          })
                        }
                        className="h-7 px-2 text-[11px] font-sans rounded-none gap-1 text-muted-foreground hover:text-foreground"
                        title="View inventory adjustments ledger"
                      >
                        <History className="size-3" />
                        <span className="sr-only sm:not-sr-only">History</span>
                      </Button>

                      <Link
                        href={`/admin/products/${item.product_id}`}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                        title="Open product editor"
                      >
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-xs font-sans">
          <div className="text-muted-foreground">
            Showing{" "}
            <span className="font-mono font-medium text-foreground">
              {(pagination.page - 1) * pagination.pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-mono font-medium text-foreground">
              {Math.min(pagination.page * pagination.pageSize, pagination.total)}
            </span>{" "}
            of{" "}
            <span className="font-mono font-medium text-foreground">
              {pagination.total}
            </span>{" "}
            SKUs
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
              className="h-7 text-xs rounded-none gap-1"
            >
              <ChevronLeft className="size-3" />
              <span>Previous</span>
            </Button>
            <span className="text-[11px] font-mono text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
              className="h-7 text-xs rounded-none gap-1"
            >
              <span>Next</span>
              <ChevronRight className="size-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
