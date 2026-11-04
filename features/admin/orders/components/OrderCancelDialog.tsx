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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AdminOrderDetail } from "../types"
import { updateOrderStatusAction } from "../actions"
import { formatAED } from "@/lib/money"
import {
  AlertTriangle,
  AlertCircle,
  Loader2,
  Mail,
  Package,
  CreditCard,
  Banknote,
  XCircle,
} from "lucide-react"

interface OrderCancelDialogProps {
  order: AdminOrderDetail
  isOpen: boolean
  onClose: () => void
  onCancelled?: () => void
}

const COMMON_REASONS = [
  "Customer requested cancellation",
  "Out of stock / garment inspection issue",
  "Customer uncontactable / invalid phone number",
  "Duplicate order placed by customer",
  "Fraudulent / suspicious order",
  "Other / Custom reason",
]

export function OrderCancelDialog({
  order,
  isOpen,
  onClose,
  onCancelled,
}: OrderCancelDialogProps) {
  const [selectedReason, setSelectedReason] = React.useState<string>(COMMON_REASONS[0])
  const [customNote, setCustomNote] = React.useState<string>("")
  const [isCancelling, setIsCancelling] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Reset fields when dialog is opened
  React.useEffect(() => {
    if (isOpen) {
      setSelectedReason(COMMON_REASONS[0])
      setCustomNote("")
      setErrorMessage(null)
      setIsCancelling(false)
    }
  }, [isOpen])

  async function handleConfirmCancel() {
    setIsCancelling(true)
    setErrorMessage(null)

    const finalReason =
      selectedReason === "Other / Custom reason"
        ? customNote.trim() || "Administrative cancellation"
        : customNote.trim()
        ? `${selectedReason}: ${customNote.trim()}`
        : selectedReason

    try {
      const res = await updateOrderStatusAction({
        orderId: order.id,
        newStatus: "cancelled",
        note: finalReason,
      })

      if (!res.success) {
        setErrorMessage(res.error || "Failed to cancel order.")
        setIsCancelling(false)
        return
      }

      onClose()
      if (onCancelled) {
        onCancelled()
      }
    } catch {
      setErrorMessage("An unexpected error occurred while cancelling the order.")
      setIsCancelling(false)
    }
  }

  const isCard = order.payment_method === "card"
  const isCod = order.payment_method === "cod"

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isCancelling && onClose()}>
      <DialogContent className="max-w-lg rounded-none border-border bg-card p-6 shadow-2xl">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2.5 text-destructive">
            <div className="size-8 rounded-none bg-destructive/10 border border-destructive/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-4 text-destructive" />
            </div>
            <div>
              <div className="text-[10px] font-sans font-semibold uppercase tracking-[0.18em] text-destructive">
                Irreversible Action
              </div>
              <DialogTitle className="font-sans text-lg font-bold text-foreground tracking-tight">
                Warning: Cancel Order #{order.order_number}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground font-sans mt-2">
            You are about to cancel this order for{" "}
            <span className="font-medium text-foreground">{order.customer_name || "Guest Customer"}</span>{" "}
            totaling <span className="font-mono font-medium text-foreground">{formatAED(order.total_fils)}</span>.
          </DialogDescription>
        </DialogHeader>

        {/* Inline Error Banner */}
        {errorMessage && (
          <div className="p-3 text-xs bg-destructive/10 border border-destructive/30 text-destructive rounded-none flex items-start gap-2.5 font-sans mt-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-destructive" />
            <div className="leading-relaxed">
              <div className="font-semibold text-destructive">Cancellation Failed</div>
              <div className="text-[11px] mt-0.5">{errorMessage}</div>
            </div>
          </div>
        )}

        {/* Detailed Impact Breakdown */}
        <div className="py-2 text-xs font-sans space-y-3.5">
          <div className="p-3.5 bg-destructive/5 border border-destructive/20 text-foreground rounded-none space-y-2">
            <div className="font-semibold text-destructive flex items-center gap-1.5">
              <XCircle className="size-3.5" />
              What will happen upon cancellation:
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-muted-foreground text-[11px] leading-relaxed">
              <li>
                Order status will permanently transition to{" "}
                <span className="font-mono font-semibold text-foreground uppercase">cancelled</span>.
              </li>
              {isCod && (
                <li>
                  <span className="font-semibold text-foreground">Cash on Delivery (COD):</span> No cash
                  collection will occur and any held inventory stock is returned to available stock.
                </li>
              )}
              {isCard && (
                <li>
                  <span className="font-semibold text-foreground">Stripe Card Payment:</span> The order was
                  marked <span className="font-mono font-medium text-foreground">{order.payment_status}</span>.
                  Card refunds must be reviewed or initiated via Stripe.
                </li>
              )}
              {order.email && (
                <li className="flex items-start gap-1">
                  <span>
                    An automated official cancellation email will be dispatched to{" "}
                    <span className="font-mono font-medium text-foreground">{order.email}</span>.
                  </span>
                </li>
              )}
            </ul>
          </div>

          {/* Cancellation Reason Dropdown & Custom Note */}
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="cancel-reason" className="text-xs font-medium text-foreground">
                Reason for Cancellation <span className="text-destructive">*</span>
              </Label>
              <select
                id="cancel-reason"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                disabled={isCancelling}
                className="w-full h-9 px-3 text-xs bg-background border border-input rounded-none focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-sans cursor-pointer disabled:opacity-50"
              >
                {COMMON_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cancel-note" className="text-xs font-medium text-foreground">
                Internal Note / Explanation{" "}
                <span className="text-muted-foreground font-normal text-[11px]">(included in event timeline)</span>
              </Label>
              <Textarea
                id="cancel-note"
                rows={2}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                disabled={isCancelling}
                placeholder="Optional details or customer conversation summary..."
                className="text-xs font-sans rounded-none border-input focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-4 sm:justify-between flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isCancelling}
            className="rounded-none text-xs font-sans uppercase tracking-[0.08em] h-9"
          >
            Keep Order
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirmCancel}
            disabled={isCancelling}
            className="rounded-none text-xs font-sans uppercase tracking-[0.08em] h-9 gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isCancelling ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="size-3.5" />
                <span>Confirm Cancellation</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
