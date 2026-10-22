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
import { deleteAdminProductAction } from "../actions"
import { AlertCircle, AlertTriangle, Loader2, Trash2 } from "lucide-react"

interface ProductDeleteDialogProps {
  productId: string | null
  productName: string
  isOpen: boolean
  onClose: () => void
  onDeleted?: () => void
}

export function ProductDeleteDialog({
  productId,
  productName,
  isOpen,
  onClose,
  onDeleted,
}: ProductDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Reset error message whenever dialog is reopened
  React.useEffect(() => {
    if (isOpen) {
      setErrorMessage(null)
    }
  }, [isOpen])

  if (!productId) return null

  async function handleDelete() {
    if (!productId) return
    setIsDeleting(true)
    setErrorMessage(null)

    try {
      const res = await deleteAdminProductAction(productId)
      if (!res.success) {
        setErrorMessage(res.error || "Failed to delete product.")
        setIsDeleting(false)
        return
      }

      onClose()
      if (onDeleted) {
        onDeleted()
      }
    } catch {
      setErrorMessage("An unexpected error occurred while deleting the product.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isDeleting) onClose() }}>
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
                Warning: Delete Garment
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground font-sans mt-2">
            You are about to delete this garment from the boutique inventory catalogue.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 text-xs bg-destructive/10 border border-destructive/30 text-destructive rounded-none flex items-start gap-2.5 font-sans mt-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-destructive" />
            <div className="leading-relaxed">
              <div className="font-semibold text-destructive">Deletion Blocked</div>
              <div className="text-[11px] mt-0.5">{errorMessage}</div>
            </div>
          </div>
        )}

        <div className="py-2 text-xs font-sans space-y-4">
          <div className="p-3.5 bg-destructive/5 border border-destructive/20 text-foreground rounded-none space-y-2">
            <p className="font-medium text-sm leading-snug">
              Are you sure you want to permanently delete:
            </p>
            <div className="font-mono text-xs px-2.5 py-1.5 bg-background border border-border text-foreground font-semibold">
              {productName}
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <span className="font-semibold uppercase tracking-[0.08em] text-[10px] text-muted-foreground">
              What will be permanently deleted:
            </span>
            <ul className="space-y-1.5 text-muted-foreground list-disc pl-4 text-[11px] leading-relaxed">
              <li>Product record and all storefront URLs/slugs.</li>
              <li>All associated colourways, style codes, and detail specifications.</li>
              <li>All uploaded imagery across every colourway from Cloudinary media storage.</li>
              <li>All SKU size variants and inventory stock audit records.</li>
            </ul>
          </div>


        </div>

        <DialogFooter className="border-t border-border pt-4 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-none text-xs font-sans cursor-pointer h-9 px-4"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-none text-xs font-sans gap-2 cursor-pointer h-9 px-4 bg-destructive hover:bg-destructive/90 text-white hover:text-white [&_svg]:text-white font-medium"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Deleting Product...</span>
              </>
            ) : (
              <>
                <Trash2 className="size-3.5" />
                <span>Yes, Delete Product</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
