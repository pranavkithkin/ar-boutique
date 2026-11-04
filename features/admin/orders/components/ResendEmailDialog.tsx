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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { AdminOrderDetail } from "../types"
import { resendOrderEmailAction, ResendEmailTemplate } from "../actions"
import {
  Mail,
  Send,
  Loader2,
  AlertCircle,
  PackageCheck,
  Truck,
  XCircle,
  CheckCircle2,
} from "lucide-react"

interface ResendEmailDialogProps {
  order: AdminOrderDetail
  isOpen: boolean
  onClose: () => void
  onSuccess?: (message: string) => void
}

export function ResendEmailDialog({
  order,
  isOpen,
  onClose,
  onSuccess,
}: ResendEmailDialogProps) {
  // Determine default template based on current order status
  const defaultTemplate: ResendEmailTemplate =
    order.status === "shipped" || order.status === "delivered"
      ? "shipped"
      : order.status === "cancelled"
      ? "cancelled"
      : "confirmation"

  const [emailType, setEmailType] = React.useState<ResendEmailTemplate>(defaultTemplate)
  const [recipientEmail, setRecipientEmail] = React.useState<string>(order.email || "")
  const [updateOrderEmail, setUpdateOrderEmail] = React.useState<boolean>(true)
  const [courier, setCourier] = React.useState<string>(order.courier || "")
  const [trackingNumber, setTrackingNumber] = React.useState<string>(order.tracking_number || "")
  const [cancellationReason, setCancellationReason] = React.useState<string>(
    order.cancellation_reason || ""
  )
  const [isSending, setIsSending] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Reset fields when dialog is opened
  React.useEffect(() => {
    if (isOpen) {
      const initialTemplate: ResendEmailTemplate =
        order.status === "shipped" || order.status === "delivered"
          ? "shipped"
          : order.status === "cancelled"
          ? "cancelled"
          : "confirmation"

      setEmailType(initialTemplate)
      setRecipientEmail(order.email || "")
      setUpdateOrderEmail(true)
      setCourier(order.courier || "")
      setTrackingNumber(order.tracking_number || "")
      setCancellationReason(order.cancellation_reason || "")
      setErrorMessage(null)
      setIsSending(false)
    }
  }, [isOpen, order])

  async function handleSend() {
    const trimmedEmail = recipientEmail.trim()
    if (!trimmedEmail) {
      setErrorMessage("Please enter a recipient email address.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email format (e.g. name@domain.ae).")
      return
    }

    setIsSending(true)
    setErrorMessage(null)

    try {
      const res = await resendOrderEmailAction({
        orderId: order.id,
        emailType,
        recipientEmail: trimmedEmail,
        updateOrderEmail: updateOrderEmail && trimmedEmail !== order.email,
        courier: emailType === "shipped" ? courier : undefined,
        trackingNumber: emailType === "shipped" ? trackingNumber : undefined,
        cancellationReason: emailType === "cancelled" ? cancellationReason : undefined,
      })

      if (!res.success) {
        setErrorMessage(res.error || "Failed to dispatch email via Resend.")
        setIsSending(false)
        return
      }

      const templateName =
        emailType === "confirmation"
          ? "Order Confirmation"
          : emailType === "shipped"
          ? "Shipping Notification"
          : "Order Cancellation"

      onClose()
      if (onSuccess) {
        onSuccess(`${templateName} email successfully sent to ${trimmedEmail}`)
      }
    } catch {
      setErrorMessage("An unexpected network error occurred while dispatching the email.")
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSending && onClose()}>
      <DialogContent className="max-w-lg rounded-none border-border bg-card p-6 shadow-2xl">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2.5 text-primary">
            <div className="size-8 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Mail className="size-4 text-primary" />
            </div>
            <div>
              <div className="text-[10px] font-sans font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Email Dispatch
              </div>
              <DialogTitle className="font-sans text-lg font-bold text-foreground tracking-tight">
                Resend Order Notification
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground font-sans mt-2">
            Dispatch an official branded email to the customer for Order{" "}
            <span className="font-mono font-medium text-foreground">#{order.order_number}</span>.
          </DialogDescription>
        </DialogHeader>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 text-xs bg-destructive/10 border border-destructive/30 text-destructive rounded-none flex items-start gap-2.5 font-sans mt-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-destructive" />
            <div className="leading-relaxed">
              <div className="font-semibold text-destructive">Dispatch Failed</div>
              <div className="text-[11px] mt-0.5">{errorMessage}</div>
            </div>
          </div>
        )}

        <div className="py-2 text-xs font-sans space-y-4">
          {/* Recipient Email Input */}
          <div className="space-y-1.5">
            <Label htmlFor="recipient-email" className="text-xs font-medium text-foreground">
              Recipient Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="recipient-email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              disabled={isSending}
              placeholder="customer@example.com"
              className="text-xs font-mono h-9 rounded-none border-input focus-visible:ring-1 focus-visible:ring-ring"
            />
            {recipientEmail.trim() !== (order.email || "") && (
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="update-order-email"
                  checked={updateOrderEmail}
                  onCheckedChange={(checked) => setUpdateOrderEmail(Boolean(checked))}
                  disabled={isSending}
                  className="rounded-none size-3.5"
                />
                <label
                  htmlFor="update-order-email"
                  className="text-[11px] text-muted-foreground cursor-pointer select-none"
                >
                  Also update customer email in order record
                </label>
              </div>
            )}
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground">Select Email Template</Label>
            <div className="grid grid-cols-1 gap-2">
              {/* Option 1: Confirmation */}
              <button
                type="button"
                onClick={() => setEmailType("confirmation")}
                disabled={isSending}
                className={`p-3 text-left border rounded-none transition-all flex items-start gap-3 cursor-pointer ${
                  emailType === "confirmation"
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                    : "border-border bg-card hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <div
                  className={`size-7 rounded-none flex items-center justify-center shrink-0 border ${
                    emailType === "confirmation"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  <PackageCheck className="size-3.5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-medium text-foreground flex items-center gap-2">
                    <span>Order Confirmation</span>
                    {order.status === "pending" || order.status === "confirmed" ? (
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 bg-blue-500/10 text-blue-600 border border-blue-500/20 font-mono">
                        Current
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-normal">
                    Full itemized garment breakdown, UAE delivery address, and official PDF invoice link.
                  </div>
                </div>
              </button>

              {/* Option 2: Shipped */}
              <button
                type="button"
                onClick={() => setEmailType("shipped")}
                disabled={isSending}
                className={`p-3 text-left border rounded-none transition-all flex items-start gap-3 cursor-pointer ${
                  emailType === "shipped"
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                    : "border-border bg-card hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <div
                  className={`size-7 rounded-none flex items-center justify-center shrink-0 border ${
                    emailType === "shipped"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  <Truck className="size-3.5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-medium text-foreground flex items-center gap-2">
                    <span>Shipping Notification</span>
                    {order.status === "shipped" || order.status === "delivered" ? (
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
                        Current
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-normal">
                    Dispatch notification with courier details and live parcel tracking code.
                  </div>
                </div>
              </button>

              {/* Option 3: Cancelled */}
              <button
                type="button"
                onClick={() => setEmailType("cancelled")}
                disabled={isSending}
                className={`p-3 text-left border rounded-none transition-all flex items-start gap-3 cursor-pointer ${
                  emailType === "cancelled"
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                    : "border-border bg-card hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <div
                  className={`size-7 rounded-none flex items-center justify-center shrink-0 border ${
                    emailType === "cancelled"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  <XCircle className="size-3.5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-medium text-foreground flex items-center gap-2">
                    <span>Order Cancellation</span>
                    {order.status === "cancelled" ? (
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 bg-destructive/10 text-destructive border border-destructive/20 font-mono">
                        Current
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-normal">
                    Formal cancellation advisory including policy, refund notes, and concierge contact.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Template Inputs */}
          {emailType === "shipped" && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/20 border border-border">
              <div className="space-y-1">
                <Label htmlFor="email-courier" className="text-[11px] font-medium text-foreground">
                  Courier
                </Label>
                <Input
                  id="email-courier"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  disabled={isSending}
                  placeholder="e.g. Careem / Fetchr"
                  className="text-xs h-8 rounded-none border-input"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email-tracking" className="text-[11px] font-medium text-foreground">
                  Tracking Number
                </Label>
                <Input
                  id="email-tracking"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  disabled={isSending}
                  placeholder="e.g. CR-981244"
                  className="text-xs font-mono h-8 rounded-none border-input"
                />
              </div>
            </div>
          )}

          {emailType === "cancelled" && (
            <div className="space-y-1.5 p-3 bg-muted/20 border border-border">
              <Label htmlFor="email-reason" className="text-[11px] font-medium text-foreground">
                Cancellation Reason Note
              </Label>
              <Textarea
                id="email-reason"
                rows={2}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                disabled={isSending}
                placeholder="Optional explanation shown to customer..."
                className="text-xs rounded-none border-input resize-none"
              />
            </div>
          )}

          {/* Info footer */}
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="size-3.5 text-muted-foreground shrink-0" />
            <span>
              Sent via Resend. An event log will automatically be added to the order timeline.
            </span>
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-4 sm:justify-between flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSending}
            className="rounded-none text-xs font-sans uppercase tracking-[0.08em] h-9"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={isSending || !recipientEmail.trim()}
            className="rounded-none text-xs font-sans uppercase tracking-[0.08em] h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="size-3.5" />
                <span>Dispatch Email</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
