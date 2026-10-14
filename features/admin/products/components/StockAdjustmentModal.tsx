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
import { adjustVariantStockAction } from "../actions"
import { AdminProductVariant } from "../types"
import { Loader2, Boxes, ArrowRight } from "lucide-react"

interface StockAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  variant: AdminProductVariant | null
  productId: string
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
  variant,
  productId,
  onSuccess,
}: StockAdjustmentModalProps) {
  const [newOnHand, setNewOnHand] = React.useState<number>(variant?.on_hand ?? 0)
  const [reason, setReason] = React.useState<typeof reasons[number]["value"]>("restock")
  const [note, setNote] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (variant) {
      setNewOnHand(variant.on_hand)
      setNote("")
      setErrorMessage(null)
    }
  }, [variant])

  if (!variant) return null

  const currentOnHand = variant.on_hand
  const delta = newOnHand - currentOnHand

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (!variant) return

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const res = await adjustVariantStockAction({
        variantId: variant.id,
        productId,
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
              <span>Stock Adjustment</span>
            </div>
            <DialogTitle className="font-sans text-base sm:text-lg font-semibold text-foreground">
              Adjust Inventory: {variant.sku}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-sans">
              Size: <span className="font-medium text-foreground">{variant.size_label || "No size"}</span> • Currently{" "}
              <span className="font-mono font-medium text-foreground">{currentOnHand}</span> units on hand (
              <span className="font-mono text-foreground">{variant.reserved}</span> held).
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 text-xs bg-destructive/10 border border-destructive/30 text-destructive rounded-none">
              {errorMessage}
            </div>
          )}

          {/* Before -> After Visualizer */}
          <div className="flex items-center justify-between p-3.5 bg-muted/40 border border-border/80">
            <div>
              <div className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground">
                Current Stock
              </div>
              <div className="text-lg font-mono font-medium text-foreground">
                {currentOnHand} units
              </div>
            </div>

            <div className="flex flex-col items-center gap-0.5">
              <ArrowRight className="size-4 text-muted-foreground" />
              <span className={`text-[11px] font-mono font-medium ${delta > 0 ? "text-emerald-600 dark:text-emerald-400" : delta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {delta > 0 ? `+${delta}` : delta}
              </span>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground">
                New Stock
              </div>
              <div className="text-lg font-mono font-medium text-foreground">
                {newOnHand} units
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* New On Hand Input */}
            <div>
              <label
                htmlFor="new-on-hand"
                className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground block mb-1.5"
              >
                New On-Hand Quantity
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="rounded-none size-9 border-input text-sm"
                  onClick={() => setNewOnHand((prev) => Math.max(variant.reserved, prev - 1))}
                  disabled={newOnHand <= variant.reserved}
                >
                  -
                </Button>
                <Input
                  id="new-on-hand"
                  type="number"
                  min={variant.reserved}
                  value={newOnHand}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    setNewOnHand(isNaN(val) ? 0 : Math.max(0, val))
                  }}
                  className="h-9 text-center font-mono text-sm bg-background border-input rounded-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="rounded-none size-9 border-input text-sm"
                  onClick={() => setNewOnHand((prev) => prev + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Audit Reason */}
            <div>
              <label
                htmlFor="adjustment-reason"
                className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground block mb-1.5"
              >
                Adjustment Reason <span className="text-foreground">*</span>
              </label>
              <select
                id="adjustment-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="h-9 px-3 text-xs font-sans bg-background border border-input rounded-none text-foreground w-full focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {reasons.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Note */}
            <div>
              <label
                htmlFor="adjustment-note"
                className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground block mb-1.5"
              >
                Audit Note (Optional)
              </label>
              <Textarea
                id="adjustment-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Physical stock count checked at Dubai atelier..."
                rows={2}
                className="text-xs bg-background border-input rounded-none resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8 px-3 text-xs font-sans rounded-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || newOnHand === currentOnHand}
              className="h-8 px-4 text-xs font-sans font-medium uppercase tracking-[0.08em] rounded-none bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Confirm Adjustment</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
