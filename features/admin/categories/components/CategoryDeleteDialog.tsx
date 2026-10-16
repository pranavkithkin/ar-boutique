"use client"

import * as React from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AdminCategoryItem } from "../types"
import { deleteCategoryAction } from "../actions"
import { AlertTriangle, ShieldAlert, Loader2, ExternalLink } from "lucide-react"

interface CategoryDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  category: AdminCategoryItem | null
}

interface CategoryDeleteDialogContentProps {
  onClose: () => void
  onSuccess: () => void
  category: AdminCategoryItem
}

function CategoryDeleteDialogContent({
  onClose,
  onSuccess,
  category,
}: CategoryDeleteDialogContentProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const hasAssignedProducts = category.product_count > 0

  const handleDelete = async () => {
    if (hasAssignedProducts) return

    setIsDeleting(true)
    setErrorMessage(null)

    try {
      const res = await deleteCategoryAction(category.id)
      if (!res.success) {
        setErrorMessage(res.error || "Failed to delete category.")
        setIsDeleting(false)
        return
      }

      setIsDeleting(false)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      console.error("Delete error:", err)
      const msg = err instanceof Error ? err.message : "An unexpected error occurred."
      setErrorMessage(msg)
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          {hasAssignedProducts ? (
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-none">
              <ShieldAlert className="h-5 w-5" />
            </div>
          ) : (
            <div className="p-2 bg-destructive/10 text-destructive rounded-none">
              <AlertTriangle className="h-5 w-5" />
            </div>
          )}
          <DialogTitle className="text-base font-bold font-sans">
            {hasAssignedProducts ? "Category Deletion Blocked" : `Delete Category "${category.name}"?`}
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-muted-foreground pt-1">
          {hasAssignedProducts
            ? "Categories with active product associations cannot be deleted."
            : "This action cannot be undone and will permanently remove this category."}
        </DialogDescription>
      </DialogHeader>

      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {hasAssignedProducts ? (
        <div className="space-y-3 py-2 text-xs text-foreground">
          <div className="bg-muted/40 p-3.5 border border-border space-y-2">
            <p className="font-medium text-foreground">
              There {category.product_count === 1 ? "is" : "are"} currently{" "}
              <span className="font-bold text-foreground font-mono">
                {category.product_count}
              </span>{" "}
              product{category.product_count === 1 ? "" : "s"} linked to &ldquo;
              <span className="font-semibold">{category.name}</span>&rdquo;.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              To preserve catalogue integrity and prevent broken storefront routing, you must
              reassign or delete all linked products before removing this category.
            </p>
          </div>

          <div className="pt-1">
            <Button
              variant="outline"
              className="w-full rounded-none text-xs h-9 gap-1.5 border-input font-medium"
              onClick={onClose}
              render={
                <Link
                  href={`/admin/products?category=${category.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <span>View {category.product_count} Assigned Products</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-2 text-xs text-muted-foreground space-y-2">
          <p>
            Are you sure you want to delete{" "}
            <strong className="text-foreground">{category.name}</strong> (
            <span className="font-mono text-[11px]">/shop/{category.slug}</span>)?
          </p>
          <p>
            Any associated merchandising images on Cloudinary will also be cleaned up.
          </p>
        </div>
      )}

      <DialogFooter className="pt-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isDeleting}
          className="rounded-none text-xs h-9 border-input"
        >
          {hasAssignedProducts ? "Close" : "Cancel"}
        </Button>

        {!hasAssignedProducts && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-none text-xs h-9 font-medium tracking-wider uppercase px-4 gap-1.5"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Category"
            )}
          </Button>
        )}
      </DialogFooter>
    </>
  )
}

export function CategoryDeleteDialog({
  isOpen,
  onClose,
  onSuccess,
  category,
}: CategoryDeleteDialogProps) {
  if (!category) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-none border-border">
        {isOpen && (
          <CategoryDeleteDialogContent
            key={category.id}
            onClose={onClose}
            onSuccess={onSuccess}
            category={category}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
