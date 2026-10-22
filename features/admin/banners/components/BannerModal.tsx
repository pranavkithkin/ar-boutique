"use client"

import * as React from "react"
import Image from "next/image"
import { AdminBannerItem, BannerPlacement } from "../types"
import { createBannerAction, updateBannerAction } from "../actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  UploadCloud,
  Loader2,
  AlertCircle,
  ImageIcon,
  Sparkles,
  Smartphone,
  Monitor,
} from "lucide-react"

interface BannerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  banner?: AdminBannerItem | null
  onSuccess: () => void
}

export function BannerModal({
  open,
  onOpenChange,
  banner,
  onSuccess,
}: BannerModalProps) {
  const isEditing = Boolean(banner)

  const [placement, setPlacement] = React.useState<BannerPlacement>(banner?.placement ?? "hero")
  const [title, setTitle] = React.useState(banner?.title ?? "")
  const [eyebrow, setEyebrow] = React.useState(banner?.eyebrow ?? "")
  const [subtitle, setSubtitle] = React.useState(banner?.subtitle ?? "")
  const [buttonLabel, setButtonLabel] = React.useState(banner ? (banner.button_label ?? "") : "Shop Collection")
  const [buttonLink, setButtonLink] = React.useState(banner ? (banner.button_link ?? "") : "/collections")
  const [sort, setSort] = React.useState(banner?.sort ?? 0)
  const [isActive, setIsActive] = React.useState(banner?.is_active ?? true)
  const [startsAt, setStartsAt] = React.useState(banner?.starts_at ? banner.starts_at.slice(0, 16) : "")
  const [endsAt, setEndsAt] = React.useState(banner?.ends_at ? banner.ends_at.slice(0, 16) : "")

  const [desktopFile, setDesktopFile] = React.useState<File | null>(null)
  const [desktopPreview, setDesktopPreview] = React.useState<string | null>(banner?.desktop_image_url ?? null)
  const [mobileFile, setMobileFile] = React.useState<File | null>(null)
  const [mobilePreview, setMobilePreview] = React.useState<string | null>(banner?.mobile_image_url ?? null)

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleDesktopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setDesktopFile(file)
      setDesktopPreview(URL.createObjectURL(file))
    }
  }

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMobileFile(file)
      setMobilePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError("Please provide a title for the banner.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("placement", placement)
      formData.append("title", title.trim())
      if (eyebrow.trim()) formData.append("eyebrow", eyebrow.trim())
      if (subtitle.trim()) formData.append("subtitle", subtitle.trim())
      if (buttonLabel.trim()) formData.append("button_label", buttonLabel.trim())
      if (buttonLink.trim()) formData.append("button_link", buttonLink.trim())
      formData.append("sort", sort.toString())
      formData.append("is_active", isActive ? "true" : "false")
      if (startsAt) formData.append("starts_at", startsAt)
      if (endsAt) formData.append("ends_at", endsAt)

      if (desktopFile) formData.append("desktop_file", desktopFile)
      if (mobileFile) formData.append("mobile_file", mobileFile)

      const res = isEditing && banner
        ? await updateBannerAction(banner.id, formData)
        : await createBannerAction(formData)

      if (res.success) {
        onOpenChange(false)
        onSuccess()
      } else {
        setError(res.error || "Failed to save banner.")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error while saving."
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-none p-6 space-y-5 bg-card border-border font-sans">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center gap-2 text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span>Admin</span>
            <span>/</span>
            <span>Banners</span>
          </div>
          <DialogTitle className="font-sans text-xl font-semibold text-foreground tracking-tight mt-0.5">
            {isEditing ? "Edit Banner Slide" : "Create New Banner Slide"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure desktop and mobile visual creatives, titles, call-to-action buttons, and display placement.
          </p>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Placement Selector */}
          <div className="space-y-2">
            <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Placement Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlacement("hero")}
                className={`p-3.5 border text-left transition-all rounded-none ${
                  placement === "hero"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-background hover:border-border/80"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground">Hero Carousel Slide</span>
                  <Sparkles className="size-3.5 text-primary" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Top full-width rotating hero carousel on the homepage (8:3 desktop, 4:5 mobile).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPlacement("promo")}
                className={`p-3.5 border text-left transition-all rounded-none ${
                  placement === "promo"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-background hover:border-border/80"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground">Mid-Page Promo Banner</span>
                  <ImageIcon className="size-3.5 text-primary" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Featured middle section promotional card or boutique atelier highlight (4:1 desktop, 4:5 mobile).
                </p>
              </button>
            </div>
          </div>

          {/* Copy fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1">
                Eyebrow / Category Tag (Optional)
              </label>
              <Input
                type="text"
                value={eyebrow}
                onChange={(e) => setEyebrow(e.target.value)}
                placeholder="e.g. New Collection 2026, Atelier Haute Couture"
                className="h-9 text-xs rounded-none bg-background border-input"
              />
            </div>

            <div>
              <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1">
                Main Banner Title *
              </label>
              <Input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Timeless Traditions, Royal Velvet & Silk"
                className="h-9 text-xs rounded-none bg-background border-input font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1">
                Supporting Subtitle / Description (Optional)
              </label>
              <Input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Pure Chiffon, Intricate Hand Embroidery & Heritage Silhouettes"
                className="h-9 text-xs rounded-none bg-background border-input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1">
                  Button Label (CTA)
                </label>
                <Input
                  type="text"
                  value={buttonLabel}
                  onChange={(e) => setButtonLabel(e.target.value)}
                  placeholder="e.g. Shop Collection, Discover Now"
                  className="h-9 text-xs rounded-none bg-background border-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1">
                  Button Destination Link
                </label>
                <Input
                  type="text"
                  value={buttonLink}
                  onChange={(e) => setButtonLink(e.target.value)}
                  placeholder="e.g. /collections, /contact"
                  className="h-9 text-xs font-mono rounded-none bg-background border-input"
                />
              </div>
            </div>
          </div>

          {/* Image Uploads */}
          <div className="space-y-4 pt-2 border-t border-border">
            <h3 className="text-xs font-sans font-semibold text-foreground uppercase tracking-wider">
              Creative Assets (Desktop & Mobile)
            </h3>

            {/* Desktop Image */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Monitor className="size-3.5 text-muted-foreground" />
                  Desktop Creative (Landscape)
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Recommended: 2400 × 900 (8:3)
                </span>
              </div>

              <div className="border border-dashed border-border p-4 bg-muted/10 space-y-3">
                {desktopPreview ? (
                  <div className="relative aspect-[8/3] w-full bg-muted overflow-hidden border border-border">
                    <Image
                      src={desktopPreview}
                      alt="Desktop Banner Preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                    <UploadCloud className="size-8 mb-2 opacity-50" />
                    <span className="text-xs font-medium">Select desktop banner file</span>
                    <span className="text-[10px] text-muted-foreground/80 mt-0.5">
                      JPG, PNG, WebP up to 10MB
                    </span>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleDesktopChange}
                  className="text-xs file:mr-3 file:py-1.5 file:px-3 file:border file:border-input file:text-xs file:font-medium file:bg-background hover:file:bg-muted cursor-pointer"
                />
              </div>
            </div>

            {/* Mobile Image */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Smartphone className="size-3.5 text-muted-foreground" />
                  Mobile Creative (Portrait)
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Recommended: 1080 × 1350 (4:5)
                </span>
              </div>

              <div className="border border-dashed border-border p-4 bg-muted/10 space-y-3">
                {mobilePreview ? (
                  <div className="relative aspect-[4/5] max-w-[200px] mx-auto bg-muted overflow-hidden border border-border">
                    <Image
                      src={mobilePreview}
                      alt="Mobile Banner Preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                    <UploadCloud className="size-8 mb-2 opacity-50" />
                    <span className="text-xs font-medium">Select mobile portrait file</span>
                    <span className="text-[10px] text-muted-foreground/80 mt-0.5">
                      JPG, PNG, WebP up to 10MB
                    </span>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleMobileChange}
                  className="text-xs file:mr-3 file:py-1.5 file:px-3 file:border file:border-input file:text-xs file:font-medium file:bg-background hover:file:bg-muted cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Sort & Visibility */}
          <div className="space-y-4 pt-2 border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1">
                  Sort Order Sequence
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={sort}
                  onChange={(e) => setSort(parseInt(e.target.value, 10) || 0)}
                  className="h-9 text-xs font-mono rounded-none bg-background border-input"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Lower numbers display first in the carousel.
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-6">
                <Checkbox
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={(v) => setIsActive(Boolean(v))}
                  className="rounded-none size-4"
                />
                <label
                  htmlFor="is_active"
                  className="text-xs font-sans font-medium text-foreground cursor-pointer select-none"
                >
                  Publish & display on live storefront
                </label>
              </div>
            </div>

            {/* Optional Scheduling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1">
                  Start Schedule (Optional)
                </label>
                <Input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="h-9 text-xs font-mono rounded-none bg-background border-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1">
                  End Schedule (Optional)
                </label>
                <Input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="h-9 text-xs font-mono rounded-none bg-background border-input"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-none h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-none h-9 text-xs px-6 uppercase tracking-wider font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-2" />
                  Saving...
                </>
              ) : isEditing ? (
                "Update Banner"
              ) : (
                "Create Banner"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
