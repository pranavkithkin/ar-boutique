"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
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
import { AdminCategoryItem } from "../types"
import { createCategoryAction, updateCategoryAction } from "../actions"
import { slugify, isValidCategorySlug } from "../utils"
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Loader2,
  AlertCircle,
  // ChevronDown,
  // ChevronRight,
} from "lucide-react"

interface CategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  categoryToEdit?: AdminCategoryItem | null
  nextSuggestedSort?: number
}

interface CategoryFormContentProps {
  onClose: () => void
  onSuccess: () => void
  categoryToEdit?: AdminCategoryItem | null
  nextSuggestedSort: number
}

function CategoryFormContent({
  onClose,
  onSuccess,
  categoryToEdit,
  nextSuggestedSort,
}: CategoryFormContentProps) {
  const isEdit = !!categoryToEdit

  const [name, setName] = React.useState(categoryToEdit?.name || "")
  const [slug, setSlug] = React.useState(categoryToEdit?.slug || "")
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(isEdit)
  const [description, setDescription] = React.useState(categoryToEdit?.description || "")
  const [sort, setSort] = React.useState<number>(categoryToEdit ? categoryToEdit.sort : nextSuggestedSort)
  const [isActive, setIsActive] = React.useState(categoryToEdit ? categoryToEdit.is_active : true)
  // SEO fields commented out as not requested by client
  // const [seoTitle, setSeoTitle] = React.useState(categoryToEdit?.seo_title || "")
  // const [seoDescription, setSeoDescription] = React.useState(categoryToEdit?.seo_description || "")
  // const [showSeo, setShowSeo] = React.useState(false)
  const seoTitle = categoryToEdit?.seo_title || ""
  const seoDescription = categoryToEdit?.seo_description || ""

  // Image state
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(categoryToEdit?.image_url || null)
  const [removeExistingImage, setRemoveExistingImage] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const handleNameChange = (val: string) => {
    setName(val)
    if (!slugManuallyEdited && !isEdit) {
      setSlug(slugify(val))
    }
  }

  const handleSlugChange = (val: string) => {
    setSlug(slugify(val))
    setSlugManuallyEdited(true)
  }

  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Image file exceeds the 10MB limit.")
      return
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMessage("Invalid image format. Please use JPG, PNG or WEBP.")
      return
    }

    setSelectedFile(file)
    setRemoveExistingImage(false)
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    setErrorMessage(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setRemoveExistingImage(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setErrorMessage("Category name is required.")
      return
    }

    const finalSlug = slug.trim() || slugify(trimmedName)
    if (!isValidCategorySlug(finalSlug)) {
      setErrorMessage(
        "Invalid slug format. Use only lowercase letters, numbers, and hyphens (e.g. 'co-ord-set')."
      )
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("name", trimmedName)
      formData.append("slug", finalSlug)
      formData.append("description", description.trim())
      formData.append("sort", sort.toString())
      formData.append("is_active", isActive.toString())
      formData.append("seo_title", seoTitle.trim())
      formData.append("seo_description", seoDescription.trim())

      if (selectedFile) {
        formData.append("file", selectedFile)
      }

      if (isEdit && categoryToEdit) {
        formData.append("id", categoryToEdit.id)
        if (removeExistingImage) {
          formData.append("remove_image", "true")
        }
        const res = await updateCategoryAction(formData)
        if (!res.success) {
          setErrorMessage(res.error || "Failed to update category.")
          setIsSubmitting(false)
          return
        }
      } else {
        const res = await createCategoryAction(formData)
        if (!res.success) {
          setErrorMessage(res.error || "Failed to create category.")
          setIsSubmitting(false)
          return
        }
      }

      setIsSubmitting(false)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      console.error("Submission error:", err)
      const msg = err instanceof Error ? err.message : "An unexpected error occurred."
      setErrorMessage(msg)
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg font-bold font-sans">
          {isEdit ? `Edit Category: ${categoryToEdit?.name}` : "Create New Category"}
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          {isEdit
            ? "Update category details, merchandising photo, display rank, and visibility."
            : "Add a new boutique category. Names are preserved and shown exactly as entered."}
        </DialogDescription>
      </DialogHeader>

      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 pt-1 w-full min-w-0">
        {/* Category Name */}
        <div className="space-y-1.5">
          <Label htmlFor="category-name" className="text-xs font-medium">
            Category Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="category-name"
            type="text"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Co-ord set, Dress, Kurta"
            className="rounded-none text-xs border-input h-9"
            disabled={isSubmitting}
          />
          <p className="text-[11px] text-muted-foreground">
            Stored and displayed exactly as typed (ADR-029).
          </p>
        </div>

        {/* URL Slug */}
        <div className="space-y-1.5">
          <Label htmlFor="category-slug" className="text-xs font-medium">
            URL Slug <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center">
            <span className="bg-muted px-2.5 h-9 border border-r-0 border-input text-xs text-muted-foreground font-mono flex items-center">
              /shop/
            </span>
            <Input
              id="category-slug"
              type="text"
              required
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="co-ord-set"
              className="rounded-none text-xs font-mono border-input h-9"
              disabled={isSubmitting}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Unique web URL slug (lowercase letters, numbers, and hyphens).
          </p>
        </div>

        {/* Category Photo Upload */}
        <div className="space-y-1.5 pt-1 border-t border-border">
          <Label className="text-xs font-medium block">
            Category Photo <span className="text-muted-foreground font-normal">(Optional)</span>
          </Label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            disabled={isSubmitting}
          />

          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const file = e.dataTransfer.files?.[0]
                if (file) processFile(file)
              }}
              className={cn(
                "border-2 border-dashed transition-all p-5 text-center cursor-pointer group flex flex-col items-center justify-center gap-2 select-none",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-foreground/40 bg-muted/10 hover:bg-muted/20"
              )}
            >
              <div className="size-9 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:border-foreground/30 transition-colors shadow-2xs">
                <Upload className="size-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-foreground">
                  <span className="underline underline-offset-2">Click to upload photo</span> or drag &amp; drop
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Square 1:1 (min 600×600) · JPG, PNG, WEBP up to 10MB
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full min-w-0 border border-border bg-muted/10 p-3 flex items-center gap-3">
              <div className="relative size-12 sm:size-14 shrink-0 rounded-full overflow-hidden border border-border bg-background shadow-xs">
                <Image
                  src={previewUrl}
                  alt={name || "Category photo"}
                  fill
                  className="object-cover object-center"
                  unoptimized={previewUrl.startsWith("blob:")}
                />
              </div>

              <div className="flex-1 min-w-0 overflow-hidden">
                <p
                  className="text-xs font-medium text-foreground truncate max-w-full"
                  title={selectedFile ? selectedFile.name : (name ? `${name} Photo` : "Category Photo")}
                >
                  {selectedFile ? selectedFile.name : (name ? `${name} Photo` : "Category Photo")}
                </p>
                <p className="text-[11px] text-muted-foreground truncate max-w-full">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                    : "Current category photo"}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="rounded-none text-xs h-8 px-2.5 sm:px-3 gap-1.5 border-input hover:bg-muted font-normal"
                >
                  <Upload className="size-3.5" />
                  Change
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveImage}
                  disabled={isSubmitting}
                  className="rounded-none text-xs h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Remove photo"
                >
                  <Trash2 className="size-3.5" />
                  <span className="sr-only">Remove photo</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Display Sort & Visibility Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="category-sort" className="text-xs font-medium">
              Display Sort Order
            </Label>
            <Input
              id="category-sort"
              type="number"
              min={0}
              value={sort}
              onChange={(e) => setSort(parseInt(e.target.value, 10) || 0)}
              className="rounded-none text-xs border-input h-9"
              disabled={isSubmitting}
            />
            <p className="text-[11px] text-muted-foreground">
              Lower numbers appear first in the boutique navigation.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium block">Storefront Visibility</Label>
            <label className="flex items-center gap-2.5 h-9 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isSubmitting}
                className="rounded-none border-input text-primary focus:ring-primary h-4 w-4"
              />
              <span className="text-xs text-foreground font-medium">
                Visible in navigation & filters
              </span>
            </label>
            <p className="text-[11px] text-muted-foreground">
              When unchecked, hidden from the public store menu.
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5 pt-1">
          <Label htmlFor="category-description" className="text-xs font-medium">
            Category Description (Optional)
          </Label>
          <Textarea
            id="category-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief editorial overview of this category..."
            className="rounded-none text-xs border-input resize-none"
            disabled={isSubmitting}
          />
        </div>

        {/* SEO Accordion - Commented out as not requested by client */}
        {/*
        <div className="border border-border p-3 space-y-3 bg-muted/10">
          <button
            type="button"
            onClick={() => setShowSeo(!showSeo)}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
              Search Engine Optimization (SEO)
            </span>
            {showSeo ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>

          {showSeo && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="space-y-1">
                <Label htmlFor="seo-title" className="text-[11px] text-muted-foreground">
                  SEO Meta Title
                </Label>
                <Input
                  id="seo-title"
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="e.g. Designer Co-ord Sets | AR Boutique"
                  className="rounded-none text-xs border-input h-8"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="seo-desc" className="text-[11px] text-muted-foreground">
                  SEO Meta Description
                </Label>
                <Textarea
                  id="seo-desc"
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Meta description for search engine previews..."
                  className="rounded-none text-xs border-input resize-none"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}
        </div>
        */}

        <DialogFooter className="pt-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-none text-xs h-9 border-input"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium tracking-wider uppercase h-9 px-4 gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Create Category"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSuccess,
  categoryToEdit,
  nextSuggestedSort = 1,
}: CategoryFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-none border-border">
        {isOpen && (
          <CategoryFormContent
            key={categoryToEdit?.id || "new"}
            onClose={onClose}
            onSuccess={onSuccess}
            categoryToEdit={categoryToEdit}
            nextSuggestedSort={nextSuggestedSort}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
