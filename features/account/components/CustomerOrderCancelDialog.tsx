"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, CreditCard, Banknote, Loader2, XCircle } from "lucide-react"
import { cancelCustomerOrderAction } from "@/features/account/actions"
import { formatAED } from "@/lib/money"

interface CustomerOrderCancelDialogProps {
  orderNumber: string
  orderId: string
  totalFils: number
  paymentMethod: "card" | "cod"
  paymentStatus?: string
  userEmail?: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const CANCEL_REASONS = [
  "Ordered by mistake",
  "Incorrect size or colourway selected",
  "Found an alternative garment",
  "Delivery timeframe does not suit",
  "Changed mind / No longer required",
  "Other reason",
]

export function CustomerOrderCancelDialog({
  orderNumber,
  orderId,
  totalFils,
  paymentMethod,
  paymentStatus,
  userEmail,
  isOpen,
  onClose,
  onSuccess,
}: CustomerOrderCancelDialogProps) {
  const router = useRouter()
  const [selectedReason, setSelectedReason] = React.useState<string>(CANCEL_REASONS[0])
  const [customNotes, setCustomNotes] = React.useState<string>("")
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const isCard = paymentMethod === "card"
  const isPaid = paymentStatus === "paid"

  const handleConfirmCancel = async () => {
    setIsSubmitting(true)
    setErrorMessage(null)

    const finalReason = customNotes.trim()
      ? `${selectedReason}: ${customNotes.trim()}`
      : selectedReason

    try {
      const res = await cancelCustomerOrderAction({
        orderIdOrNumber: orderNumber || orderId,
        reason: finalReason,
        userEmail,
      })

      if (!res.success) {
        setErrorMessage(res.error || "Unable to cancel order. Please contact our boutique atelier.")
        setIsSubmitting(false)
        return
      }

      onClose()
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again or reach out via WhatsApp.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-6 bg-card border-border rounded-xs">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            <DialogTitle className="font-sans text-lg font-semibold tracking-tight text-foreground">
              Cancel Order {orderNumber}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Please let us know why you wish to cancel this order. Pre-dispatch cancellations are
            processed immediately by our atelier.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Reason Select */}
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason" className="text-xs font-medium text-foreground">
              Reason for Cancellation
            </Label>
            <Select value={selectedReason} onValueChange={(val) => { if (val) setSelectedReason(val) }}>
              <SelectTrigger id="cancel-reason" className="w-full text-xs h-9 bg-background">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason} className="text-xs">
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Optional Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="cancel-notes" className="text-xs font-medium text-foreground">
              Additional Details (Optional)
            </Label>
            <Textarea
              id="cancel-notes"
              rows={3}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Provide any feedback for our concierge..."
              className="text-xs resize-none bg-background"
            />
          </div>

          {/* Refund Callout */}
          <div className="p-3.5 bg-muted/40 border border-border/60 rounded-xs space-y-2 text-xs">
            <div className="flex items-center gap-2 font-medium text-foreground">
              {isCard ? (
                <CreditCard className="h-4 w-4 text-primary" />
              ) : (
                <Banknote className="h-4 w-4 text-muted-foreground" />
              )}
              <span>{isCard ? "Online Card Payment & Refund" : "Cash on Delivery"}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isCard ? (
                isPaid ? (
                  <>
                    Upon cancellation, our boutique administration will review and process a{" "}
                    <strong className="text-foreground font-semibold">
                      full refund of {formatAED(totalFils)}
                    </strong>{" "}
                    directly back to your original payment card via Stripe. Funds typically reflect
                    within 5-10 business days depending on your bank.
                  </>
                ) : (
                  <>Any pre-authorization hold will be released back to your payment card.</>
                )
              ) : (
                <>
                  Your Cash on Delivery order will be cancelled immediately and reserved garments
                  released back to inventory with zero charge.
                </>
              )}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs h-9"
          >
            Keep Order
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirmCancel}
            disabled={isSubmitting}
            className="text-xs h-9 gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Confirm Cancellation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
