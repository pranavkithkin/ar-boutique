"use client"

import * as React from "react"
import { AdminProductColourway, AdminProductVariant, AdminSize } from "../types"
import { LayoutGrid, Palette } from "lucide-react"

interface ProductStockMatrixProps {
  colourways: AdminProductColourway[]
  sizes: AdminSize[]
  onOpenStockModal: (variant: AdminProductVariant) => void
}

export function ProductStockMatrix({
  colourways,
  sizes,
  onOpenStockModal,
}: ProductStockMatrixProps) {
  // Check if any variant has size_id === null across any colourway
  const hasUnsizedVariants = colourways.some((cw) =>
    cw.variants.some((v) => !v.size_id)
  )

  // Sort available sizes by their display sort order
  const sortedSizes = [...sizes].sort((a, b) => (a.sort ?? 999) - (b.sort ?? 999))

  // Determine size columns to show: only sizes present in at least one variant, or all standard sizes
  // To keep it compact and relevant to this product:
  const presentSizeIds = new Set<string>()
  colourways.forEach((cw) => {
    cw.variants.forEach((v) => {
      if (v.size_id) presentSizeIds.add(v.size_id)
    })
  })

  // If no sizes are present at all (or product only has unsized SKUs), presentSizeIds is empty
  const activeSizes = sortedSizes.filter((s) => presentSizeIds.has(s.id))

  // If product has unsized variants or no sized variants at all, include "No size" column
  const showNoSizeColumn = hasUnsizedVariants || activeSizes.length === 0

  // Calculate totals per size
  const totalsBySize: Record<string, { onHand: number; reserved: number; available: number }> = {}
  activeSizes.forEach((s) => {
    totalsBySize[s.id] = { onHand: 0, reserved: 0, available: 0 }
  })
  let noSizeTotals = { onHand: 0, reserved: 0, available: 0 }

  colourways.forEach((cw) => {
    cw.variants.forEach((v) => {
      const avail = Math.max(0, v.on_hand - v.reserved)
      if (v.size_id && totalsBySize[v.size_id]) {
        totalsBySize[v.size_id].onHand += v.on_hand
        totalsBySize[v.size_id].reserved += v.reserved
        totalsBySize[v.size_id].available += avail
      } else if (!v.size_id) {
        noSizeTotals.onHand += v.on_hand
        noSizeTotals.reserved += v.reserved
        noSizeTotals.available += avail
      }
    })
  })

  const grandOnHand = colourways.reduce(
    (acc, cw) => acc + cw.variants.reduce((vAcc, v) => vAcc + (v.on_hand || 0), 0),
    0
  )
  const grandReserved = colourways.reduce(
    (acc, cw) => acc + cw.variants.reduce((vAcc, v) => vAcc + (v.reserved || 0), 0),
    0
  )
  const grandAvailable = Math.max(0, grandOnHand - grandReserved)

  return (
    <div className="bg-card border border-border rounded-none overflow-hidden space-y-3 p-5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-7 bg-muted/60 border border-border flex items-center justify-center">
            <LayoutGrid className="size-3.5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-sans text-sm font-semibold text-foreground">
              Colours &times; Sizes Stock Matrix
            </h3>
            <p className="text-[11px] font-sans text-muted-foreground">
              Cross-variant stock overview. Click any cell to adjust units on hand.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              <th className="py-2.5 px-3 min-w-[160px]">Colourway</th>
              <th className="py-2.5 px-3 min-w-[90px]">Style Code</th>
              {activeSizes.map((s) => (
                <th key={s.id} className="py-2.5 px-2 text-center min-w-[72px] font-mono">
                  Size {s.label}
                </th>
              ))}
              {showNoSizeColumn && (
                <th className="py-2.5 px-2 text-center min-w-[80px] font-mono">
                  No size
                </th>
              )}
              <th className="py-2.5 px-3 text-right min-w-[70px]">On Hand</th>
              <th className="py-2.5 px-3 text-right min-w-[70px]">Reserved</th>
              <th className="py-2.5 px-3 text-center min-w-[80px]">Available</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {colourways.map((cw) => {
              const cwOnHand = cw.variants.reduce((acc, v) => acc + (v.on_hand || 0), 0)
              const cwReserved = cw.variants.reduce((acc, v) => acc + (v.reserved || 0), 0)
              const cwAvailable = Math.max(0, cwOnHand - cwReserved)

              return (
                <tr key={cw.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-foreground flex items-center gap-2">
                    <Palette className="size-3 text-muted-foreground shrink-0" />
                    <span>{cw.colour_name}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                    {cw.style_code}
                  </td>

                  {/* Sized Cells */}
                  {activeSizes.map((s) => {
                    const variant = cw.variants.find((v) => v.size_id === s.id)

                    if (!variant) {
                      return (
                        <td
                          key={s.id}
                          className="py-2.5 px-2 text-center text-muted-foreground/30 font-mono text-xs"
                        >
                          &mdash;
                        </td>
                      )
                    }

                    const avail = Math.max(0, variant.on_hand - variant.reserved)
                    let cellBg = "bg-muted/40 border-border text-foreground hover:border-primary/50"
                    let badgeClass = "text-emerald-600 dark:text-emerald-400 font-bold"

                    if (avail === 0) {
                      cellBg = "bg-red-500/10 border-red-500/20 text-destructive hover:border-red-500/40"
                      badgeClass = "text-destructive font-bold"
                    } else if (avail <= 3) {
                      cellBg = "bg-amber-500/10 border-amber-500/20 text-amber-600 hover:border-amber-500/40"
                      badgeClass = "text-amber-600 dark:text-amber-400 font-bold"
                    }

                    return (
                      <td key={s.id} className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenStockModal(variant)}
                          className={`w-full py-1 px-1 border rounded-none text-center transition-all cursor-pointer ${cellBg}`}
                          title={`SKU: ${variant.sku}\nOn Hand: ${variant.on_hand}\nReserved: ${variant.reserved}\nAvailable: ${avail}\nClick to adjust stock`}
                        >
                          <div className={`font-mono text-xs ${badgeClass}`}>{avail}</div>
                          <div className="text-[9px] font-mono text-muted-foreground">
                            {variant.on_hand}
                            {variant.reserved > 0 && ` (${variant.reserved}h)`}
                          </div>
                        </button>
                      </td>
                    )
                  })}

                  {/* No Size Cell */}
                  {showNoSizeColumn && (() => {
                    const variant = cw.variants.find((v) => !v.size_id)

                    if (!variant) {
                      return (
                        <td className="py-2.5 px-2 text-center text-muted-foreground/30 font-mono text-xs">
                          &mdash;
                        </td>
                      )
                    }

                    const avail = Math.max(0, variant.on_hand - variant.reserved)
                    let cellBg = "bg-muted/40 border-border text-foreground hover:border-primary/50"
                    let badgeClass = "text-emerald-600 dark:text-emerald-400 font-bold"

                    if (avail === 0) {
                      cellBg = "bg-red-500/10 border-red-500/20 text-destructive hover:border-red-500/40"
                      badgeClass = "text-destructive font-bold"
                    } else if (avail <= 3) {
                      cellBg = "bg-amber-500/10 border-amber-500/20 text-amber-600 hover:border-amber-500/40"
                      badgeClass = "text-amber-600 dark:text-amber-400 font-bold"
                    }

                    return (
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenStockModal(variant)}
                          className={`w-full py-1 px-1 border rounded-none text-center transition-all cursor-pointer ${cellBg}`}
                          title={`SKU: ${variant.sku}\nOn Hand: ${variant.on_hand}\nReserved: ${variant.reserved}\nAvailable: ${avail}\nClick to adjust stock`}
                        >
                          <div className={`font-mono text-xs ${badgeClass}`}>{avail}</div>
                          <div className="text-[9px] font-mono text-muted-foreground">
                            {variant.on_hand}
                            {variant.reserved > 0 && ` (${variant.reserved}h)`}
                          </div>
                        </button>
                      </td>
                    )
                  })()}

                  <td className="py-2.5 px-3 text-right font-mono text-xs font-semibold text-foreground">
                    {cwOnHand}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {cwReserved > 0 ? (
                      <span className="font-mono text-xs font-semibold text-amber-600">
                        {cwReserved} held
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded-none ${
                        cwAvailable === 0
                          ? "bg-destructive/10 text-destructive"
                          : cwAvailable <= 3
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {cwAvailable}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-muted/40 font-semibold border-t-2 border-border text-[11px]">
              <td colSpan={2} className="py-2 px-3 text-foreground font-sans uppercase tracking-wider text-[10px]">
                Product Inventory Totals
              </td>
              {activeSizes.map((s) => (
                <td key={s.id} className="py-2 px-2 text-center font-mono text-xs text-foreground">
                  {totalsBySize[s.id]?.available ?? 0}
                </td>
              ))}
              {showNoSizeColumn && (
                <td className="py-2 px-2 text-center font-mono text-xs text-foreground">
                  {noSizeTotals.available}
                </td>
              )}
              <td className="py-2 px-3 text-right font-mono text-xs text-foreground">
                {grandOnHand}
              </td>
              <td className="py-2 px-3 text-right font-mono text-xs text-amber-600">
                {grandReserved > 0 ? `${grandReserved} held` : "0"}
              </td>
              <td className="py-2 px-3 text-center">
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {grandAvailable}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
