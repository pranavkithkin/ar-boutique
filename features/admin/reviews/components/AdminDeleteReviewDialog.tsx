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
import { AlertTriangle, Trash2, Loader2 } from "lucide-react"
import type { ProductReview } from "@/features/reviews/types"

interface AdminDeleteReviewDialogProps {
  review: ProductReview | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reviewId: string) => Promise<void>
}

export function AdminDeleteReviewDialog({
  review,
  open,
  onOpenChange,
  onConfirm,
}: AdminDeleteReviewDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  if (!review) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onConfirm(review.id)
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 rounded-none space-y-4 font-sans bg-background border border-border">
        <DialogHeader className="space-y-3">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-destructive/10 border border-destructive/25 text-destructive shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <div className="space-y-1.5 pt-0.5 text-left">
              <DialogTitle className="font-sans text-base font-semibold text-foreground tracking-tight">
                Delete Customer Review?
              </DialogTitle>
              <DialogDescription className="font-sans text-xs text-muted-foreground leading-relaxed">
                You are about to permanently delete the review by{" "}
                <strong className="text-foreground font-medium">{review.customer_name}</strong>{" "}
                for garment{" "}
                <span className="font-mono text-foreground font-medium">{review.product_slug}</span>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Review snippet preview box */}
        <div className="p-3 bg-muted/40 border border-border/70 rounded-none space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground truncate max-w-[240px]">
              {review.title}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {review.rating} / 5 Stars
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground line-clamp-2 italic">
            "{review.comment}"
          </p>
        </div>

        <p className="text-[11px] text-destructive/90 font-medium">
          Warning: This action cannot be undone and will immediately recalculate the product and storewide rating breakdown.
        </p>

        <DialogFooter className="flex-row items-center justify-end gap-2 pt-2 border-t border-border sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="rounded-none h-9 text-xs px-4 font-sans font-medium"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-none h-9 text-xs px-4 font-sans font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="size-3.5" />
                <span>Delete Permanently</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
