"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CreditCard, Loader2, RefreshCw } from "lucide-react"
import { refundOrderViaStripeAction } from "@/features/admin/orders/actions"
import { formatAED } from "@/lib/money"
import type { AdminOrderDetail } from "../types"

interface OrderStripeRefundDialogProps {
  order: AdminOrderDetail
  isOpen: boolean
  onClose: () => void
  onRefunded: (message: string) => void
}

export function OrderStripeRefundDialog({
  order,
  isOpen,
  onClose,
  onRefunded,
}: OrderStripeRefundDialogProps) {
  const [reason, setReason] = React.useState<string>(
    order.cancellation_reason
      ? `Cancellation refund: ${order.cancellation_reason}`
      : "Customer order cancellation refund"
  )
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isOpen) {
      setReason(
        order.cancellation_reason
          ? `Cancellation refund: ${order.cancellation_reason}`
          : "Customer order cancellation refund"
      )
      setErrorMessage(null)
    }
  }, [isOpen, order.cancellation_reason])

  const handleProcessRefund = async () => {
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const res = await refundOrderViaStripeAction({
        orderId: order.id,
        reason: reason.trim(),
      })

      if (!res.success) {
        setErrorMessage(res.error || "Failed to process refund via Stripe.")
        setIsSubmitting(false)
        return
      }

      onRefunded(
        `✓ Full refund of ${formatAED(order.total_fils)} successfully issued via Stripe to ${order.customer_name}.`
      )
      onClose()
    } catch {
      setErrorMessage("An unexpected network or gateway error occurred while contacting Stripe.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-6 bg-card border-border rounded-none">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <RefreshCw className="size-5" />
            <DialogTitle className="font-sans text-lg font-semibold tracking-tight text-foreground">
              Refund Order {order.order_number} via Stripe
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Process a direct live refund through Stripe back to the customer&apos;s original payment card.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-none flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4 py-2 text-xs">
          {/* Order & Card Details Box */}
          <div className="p-3.5 bg-muted/40 border border-border/70 rounded-none space-y-2">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Recipient</span>
              <span className="font-semibold text-foreground">
                {order.customer_name} ({order.email})
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Refund Method</span>
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <CreditCard className="size-3.5 text-primary" />
                Original Stripe Card
              </span>
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="font-semibold text-foreground">Total Refund Amount</span>
              <span className="font-mono text-sm font-bold text-foreground">
                {formatAED(order.total_fils)}
              </span>
            </div>
          </div>

          {/* Refund Reason Note */}
          <div className="space-y-1.5">
            <Label htmlFor="refund-reason" className="text-xs font-medium text-foreground">
              Internal & Audit Reason
            </Label>
            <Textarea
              id="refund-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for refund..."
              className="text-xs rounded-none bg-background resize-none"
            />
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
            <strong>Important:</strong> Issuing this refund directly contacts Stripe. The full amount
            of <strong>{formatAED(order.total_fils)}</strong> will be returned to the customer&apos;s card
            and a confirmation receipt will be emailed to <em>{order.email}</em>.
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs h-9 rounded-none"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleProcessRefund}
            disabled={isSubmitting}
            className="text-xs h-9 rounded-none gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Refunding via Stripe...
              </>
            ) : (
              `Process Refund (${formatAED(order.total_fils)})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

