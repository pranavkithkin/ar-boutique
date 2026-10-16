"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { adjustVariantStock } from "../actions"
import { Loader2, Boxes, ArrowRight, AlertTriangle } from "lucide-react"

export interface StockAdjustTarget {
  variant_id: string
  product_id?: string
  sku: string
  product_name?: string
  style_code?: string
  colour_name?: string
  size_label?: string
  on_hand: number
  reserved: number
}

interface StockAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  target: StockAdjustTarget | null
  onSuccess: (newOnHand: number) => void
}

const reasons = [
  { value: "restock", label: "Restock (New units arrived from atelier)" },
  { value: "correction", label: "Correction (Inventory count audit adjustment)" },
  { value: "damaged", label: "Damaged (Damaged or defective units written off)" },
  { value: "offline sale", label: "Offline Sale (Private boutique or VIP sale)" },
  { value: "return restock", label: "Return Restock (Customer return accepted)" },
  { value: "COD refused", label: "COD Refused (Returned to sender parcel)" },
  { value: "opening stock", label: "Opening Stock (Initial inventory baseline)" },
] as const

export function StockAdjustmentModal({
  isOpen,
  onClose,
  target,
  onSuccess,
}: StockAdjustmentModalProps) {
  const [newOnHand, setNewOnHand] = React.useState<number>(target?.on_hand ?? 0)
  const [reason, setReason] = React.useState<typeof reasons[number]["value"]>("restock")
  const [note, setNote] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const el = inputRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
    }
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => {
      el.removeEventListener("wheel", handleWheel)
    }
  }, [isOpen, target])

  React.useEffect(() => {
    if (target) {
      setNewOnHand(target.on_hand)
      setNote("")
      setErrorMessage(null)
      setReason("restock")
    }
  }, [target])

  if (!target) return null

  const currentOnHand = target.on_hand
  const reserved = target.reserved
  const delta = newOnHand - currentOnHand
  const isBelowReserved = newOnHand < reserved

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (!target) return

    if (isBelowReserved) {
      setErrorMessage(`Cannot drop stock below reserved level of ${reserved} units.`)
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const res = await adjustVariantStock({
        variantId: target.variant_id,
        productId: target.product_id || "",
        newOnHand,
        reason,
        note: note.trim() || undefined,
      })

      if (!res.success) {
        setErrorMessage(res.error || "Failed to adjust stock.")
        setIsSubmitting(false)
        return
      }

      onSuccess(newOnHand)
      onClose()
    } catch {
      setErrorMessage("An unexpected error occurred while adjusting inventory.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border rounded-none p-6">
        <form onSubmit={handleConfirm} className="space-y-5">
          <DialogHeader>
            <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-sans font-semibold uppercase tracking-[0.16em]">
              <Boxes className="size-3.5" />
              <span>Inventory Audit Ledger</span>
            </div>
            <DialogTitle className="text-lg font-sans font-bold tracking-tight text-foreground">
              Adjust Stock on Hand
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

          {/* Current vs New Quantity Calculator */}
          <div className="p-4 bg-muted/40 border border-border space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-sans">Current Units On Hand:</span>
              <span className="font-mono font-semibold text-foreground">{currentOnHand} units</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-sans">Reserved (Customer Holds):</span>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-medium">
                {reserved} held
              </span>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-xs font-sans font-medium text-foreground">
                Target Units On Hand:
              </span>
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  type="number"
                  min={0}
                  value={Number.isNaN(newOnHand) ? "" : newOnHand}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    setNewOnHand(isNaN(val) ? 0 : Math.max(0, val))
                  }}
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                  className="w-24 h-8 text-right font-mono text-sm rounded-none border-input [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  required
                />
                <span className="text-xs text-muted-foreground font-sans">units</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-sans">Ledger Adjustment Delta:</span>
              <div className="flex items-center gap-1.5 font-mono font-semibold">
                <span>{currentOnHand}</span>
                <ArrowRight className="size-3 text-muted-foreground" />
                <span
                  className={
                    delta > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : delta < 0
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }
                >
                  {delta > 0 ? `+${delta}` : delta} ({newOnHand})
                </span>
              </div>
            </div>

            {isBelowReserved && (
              <div className="flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                <AlertTriangle className="size-3.5 shrink-0" />
                <span>
                  Units cannot fall below {reserved} reserved orders.
                </span>
              </div>
            )}
          </div>

          {/* Audit Reason */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground block">
              Audit Reason <span className="text-foreground">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as typeof reason)}
              className="w-full h-9 px-3 text-xs bg-background border border-input rounded-none focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-sans"
              required
            >
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Note */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground block">
              Audit Ledger Note (Optional)
            </label>
            <Textarea
              placeholder="e.g. Received shipment lot #B29 from atelier inspection"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="text-xs rounded-none border-input resize-none font-sans"
            />
          </div>

          {errorMessage && (
            <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive font-sans">
              {errorMessage}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-none text-xs font-sans"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || isBelowReserved || delta === 0}
              className="rounded-none text-xs font-sans bg-primary text-primary-foreground min-w-[120px]"
            >
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                "Save Adjustment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
