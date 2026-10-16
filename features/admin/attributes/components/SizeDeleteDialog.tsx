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
import { deleteSizeAction } from "../actions"
import { AdminSizeItem } from "../types"
import { AlertCircle, AlertTriangle, Loader2, Trash2, EyeOff } from "lucide-react"

interface SizeDeleteDialogProps {
  size: AdminSizeItem | null
  isOpen: boolean
  onClose: () => void
  onDeactivate: (sizeId: string) => Promise<void>
}

export function SizeDeleteDialog({
  size,
  isOpen,
  onClose,
  onDeactivate,
}: SizeDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  if (!size) return null

  const isReferenced = size.usage_count > 0

  async function handleDelete() {
    if (!size) return
    setIsDeleting(true)
    setErrorMessage(null)

    try {
      const res = await deleteSizeAction(size.id)
      if (!res.success) {
        setErrorMessage(res.error || "Failed to delete size.")
        setIsDeleting(false)
        return
      }
      onClose()
    } catch {
      setErrorMessage("An unexpected error occurred while deleting the size.")
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleDeactivateClick() {
    if (!size) return
    setIsDeleting(true)
    try {
      await onDeactivate(size.id)
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-none border-border bg-card p-6">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2 text-destructive">
            {isReferenced ? (
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <AlertCircle className="size-4 text-destructive" />
            )}
            <DialogTitle className="font-sans text-base font-semibold text-foreground">
              {isReferenced ? "Cannot Delete Referenced Size" : "Delete Garment Size"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground font-sans mt-1">
            Size Label: {size.label}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 text-xs bg-destructive/10 border border-destructive/30 text-destructive rounded-none">
            {errorMessage}
          </div>
        )}

        <div className="py-3 text-xs font-sans space-y-3">
          {isReferenced ? (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-none space-y-2">
              <p className="font-medium">
                This size is actively linked to <strong>{size.usage_count}</strong> SKU variant(s).
              </p>
              <p className="text-[11px] text-muted-foreground">
                Per catalogue rules (ADR-029), sizes referenced by active variants cannot be deleted to protect inventory records, holds, and order lines. You can hide it from the storefront instead.
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete size <strong>{size.label}</strong>? This action cannot be undone.
            </p>
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-border flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="h-9 px-4 text-xs font-sans rounded-none"
          >
            Cancel
          </Button>

          {isReferenced ? (
            <Button
              type="button"
              onClick={handleDeactivateClick}
              disabled={isDeleting}
              className="h-9 px-4 text-xs font-sans font-medium uppercase tracking-[0.08em] rounded-none bg-amber-600 hover:bg-amber-700 text-white gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Hiding...</span>
                </>
              ) : (
                <>
                  <EyeOff className="size-3.5" />
                  <span>Hide Size</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-9 px-4 text-xs font-sans font-medium uppercase tracking-[0.08em] rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="size-3.5" />
                  <span>Delete Size</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
