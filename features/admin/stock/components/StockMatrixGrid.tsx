"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { AdminStockMatrixRow } from "../types"
import { StockAdjustTarget } from "./StockAdjustmentModal"
import { Button } from "@/components/ui/button"
import { Boxes, ExternalLink, SlidersHorizontal, Package } from "lucide-react"

interface StockMatrixGridProps {
  matrixRows: AdminStockMatrixRow[]
  allSizeLabels: string[]
  onOpenAdjust: (target: StockAdjustTarget) => void
  onOpenHistory: (target: {
    variant_id: string
    sku: string
    product_name?: string
    colour_name?: string
    size_label?: string
  }) => void
}

export function StockMatrixGrid({
  matrixRows,
  allSizeLabels,
  onOpenAdjust,
}: StockMatrixGridProps) {
  if (matrixRows.length === 0) {
    return (
      <div className="border border-border bg-card p-12 text-center">
        <Package className="size-10 text-muted-foreground mx-auto mb-3 opacity-40" />
        <h3 className="font-sans text-sm font-semibold text-foreground">
          No product colourways found
        </h3>
        <p className="text-xs font-sans text-muted-foreground mt-1 max-w-sm mx-auto">
          No catalogue colourways match your filter or search criteria.
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
              <th className="py-3 px-4 min-w-[240px]">Product &amp; Colourway</th>
              <th className="py-3 px-3 min-w-[90px]">Style Code</th>
              {allSizeLabels.map((sizeLabel) => (
                <th
                  key={sizeLabel}
                  className="py-3 px-2 text-center min-w-[76px] font-mono"
                >
                  Size {sizeLabel}
                </th>
              ))}
              <th className="py-3 px-3 text-right min-w-[80px]">On Hand</th>
              <th className="py-3 px-3 text-right min-w-[80px]">Reserved</th>
              <th className="py-3 px-3 text-center min-w-[90px]">Available</th>
              <th className="py-3 px-3 text-right min-w-[60px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {matrixRows.map((row) => {
              return (
                <tr
                  key={row.colourway_id}
                  className="hover:bg-muted/20 transition-colors group"
                >
                  {/* Product & Colour */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 aspect-[4/5] shrink-0 bg-muted/60 border border-border overflow-hidden">
                        {row.thumbnail_url ? (
                          <Image
                            src={row.thumbnail_url}
                            alt={row.product_name}
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
                          href={`/admin/products/${row.product_id}`}
                          className="font-sans font-semibold text-foreground hover:underline line-clamp-1"
                        >
                          {row.product_name}
                        </Link>
                        <div className="text-[11px] text-muted-foreground">
                          Colour: <span className="text-foreground">{row.colour_name}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Style Code */}
                  <td className="py-3 px-3 font-mono text-xs text-foreground font-medium">
                    {row.style_code}
                  </td>

                  {/* Size Matrix Cells */}
                  {allSizeLabels.map((sizeLabel) => {
                    const variant = row.variants_by_size[sizeLabel]

                    if (!variant) {
                      return (
                        <td
                          key={sizeLabel}
                          className="py-3 px-2 text-center text-muted-foreground/30 font-mono text-xs"
                        >
                          &mdash;
                        </td>
                      )
                    }

                    // Stock status styles
                    let cellBg = "bg-muted/30 border-border text-foreground hover:border-primary/50"
                    let badgeClass = "text-emerald-600 dark:text-emerald-400 font-bold"

                    if (variant.status === "out_of_stock") {
                      cellBg = "bg-red-500/10 border-red-500/20 text-destructive hover:border-red-500/40"
                      badgeClass = "text-destructive font-bold"
                    } else if (variant.status === "low_stock") {
                      cellBg = "bg-amber-500/10 border-amber-500/20 text-amber-600 hover:border-amber-500/40"
                      badgeClass = "text-amber-600 dark:text-amber-400 font-bold"
                    }

                    return (
                      <td key={sizeLabel} className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            onOpenAdjust({
                              variant_id: variant.variant_id,
                              product_id: row.product_id,
                              sku: variant.sku,
                              product_name: row.product_name,
                              style_code: row.style_code,
                              colour_name: row.colour_name,
                              size_label: sizeLabel,
                              on_hand: variant.on_hand,
                              reserved: variant.reserved,
                            })
                          }
                          className={`w-full py-1 px-1.5 border rounded-none text-center transition-all cursor-pointer ${cellBg}`}
                          title={`SKU: ${variant.sku}\nOn Hand: ${variant.on_hand}\nReserved: ${variant.reserved}\nAvailable: ${variant.available}\nClick to adjust stock`}
                        >
                          <div className={`font-mono text-xs ${badgeClass}`}>
                            {variant.available}
                          </div>
                          <div className="text-[9px] font-mono text-muted-foreground flex items-center justify-center gap-1">
                            <span>{variant.on_hand}</span>
                            {variant.reserved > 0 && (
                              <span className="text-amber-600 font-semibold">
                                ({variant.reserved}h)
                              </span>
                            )}
                          </div>
                        </button>
                      </td>
                    )
                  })}

                  {/* Total On Hand */}
                  <td className="py-3 px-3 text-right font-mono text-xs font-semibold text-foreground">
                    {row.total_on_hand}
                  </td>

                  {/* Total Reserved */}
                  <td className="py-3 px-3 text-right">
                    {row.total_reserved > 0 ? (
                      <span className="font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
                        {row.total_reserved} held
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">0</span>
                    )}
                  </td>

                  {/* Total Available */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded-none ${
                        row.total_available === 0
                          ? "bg-destructive/10 text-destructive"
                          : row.total_available <= 5
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {row.total_available}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3 text-right">
                    <Link
                      href={`/admin/products/${row.product_id}`}
                      className="inline-flex items-center justify-center p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Open in Product Editor"
                    >
                      <ExternalLink className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-muted/20 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground font-sans">
        <span>Click on any cell to adjust on-hand stock and write an audit ledger entry.</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="size-2 bg-emerald-500 inline-block" /> In Stock (4+)
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 bg-amber-500 inline-block" /> Low Stock (1-3)
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 bg-red-500 inline-block" /> Sold Out (0)
          </span>
        </div>
      </div>
    </div>
  )
}
