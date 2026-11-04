"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { StoreButton } from "@/components/store/StoreButton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, Loader2 } from "lucide-react"
import { cancelCustomerReturnAction } from "@/features/account/returns/actions"

interface CancelReturnButtonProps {
  returnId: string
  returnNumber: string
  customerEmail: string
}

export function CancelReturnButton({
  returnId,
  returnNumber,
  customerEmail,
}: CancelReturnButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleConfirmCancel = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await cancelCustomerReturnAction(returnId, customerEmail)
      if (res.success) {
        setIsOpen(false)
        router.refresh()
      } else {
        setError(res.error || "Failed to cancel return request.")
      }
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <StoreButton
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="text-xs uppercase tracking-wider text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
      >
        Cancel Return Request
      </StoreButton>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border rounded-xs">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertCircle className="h-5 w-5" />
              <DialogTitle className="text-base font-semibold">
                Cancel Return {returnNumber}?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you wish to withdraw this return request? Once cancelled, the courier collection will be called off. You can initiate a new return request if your 7-day complimentary window is still open.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xs">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <StoreButton
              variant="outline"
              disabled={isLoading}
              onClick={() => setIsOpen(false)}
              className="text-xs"
            >
              Keep Return
            </StoreButton>
            <StoreButton
              variant="destructive"
              disabled={isLoading}
              onClick={handleConfirmCancel}
              className="text-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Confirm Cancellation"
              )}
            </StoreButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
