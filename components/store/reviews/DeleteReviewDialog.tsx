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
import { Trash2, AlertTriangle, Loader2 } from "lucide-react"

interface DeleteReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reviewTitle?: string
  onConfirm: () => Promise<void>
}

export function DeleteReviewDialog({
  open,
  onOpenChange,
  reviewTitle,
  onConfirm,
}: DeleteReviewDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 rounded-none space-y-4 font-sans bg-background border border-border">
        <DialogHeader className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-destructive/10 border border-destructive/20 text-destructive shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <div className="space-y-1 pt-0.5 text-left">
              <DialogTitle className="font-sans text-base font-semibold text-foreground tracking-tight">
                Delete Your Review?
              </DialogTitle>
              <DialogDescription className="font-sans text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to delete your review{reviewTitle ? ` "${reviewTitle}"` : ""}? This will permanently remove your rating, fit feedback, and comments for this garment.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

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
                <span>Delete Review</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
