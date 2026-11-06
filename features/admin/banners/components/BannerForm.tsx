"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { AdminBannerItem, BannerPlacement } from "../types"
import { createBannerAction, updateBannerAction } from "../actions"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "cn"
import {
  ArrowLeft,
  UploadCloud,
  Loader2,
  AlertCircle,
  Sparkles,
  Tag,
  Link as LinkIcon,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react"

interface BannerFormProps {
  mode: "create" | "edit"
  initialBanner?: AdminBannerItem | null
  existingPromoId?: string
}

export function BannerForm({ mode, initialBanner, existingPromoId }: BannerFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditing = mode === "edit" && Boolean(initialBanner)

  // Query parameter fallback for placement (e.g. ?type=promo)
  const defaultPlacement: BannerPlacement =
    initialBanner?.placement ??
    (searchParams.get("type") === "promo" ? "promo" : "hero")

  const [placement, setPlacement] = React.useState<BannerPlacement>(defaultPlacement)
  const [title, setTitle] = React.useState(
    initialBanner?.title ?? (defaultPlacement === "promo" ? "Summer Refresh" : "Hero Slide")
  )
  const [eyebrow, setEyebrow] = React.useState(
    initialBanner?.eyebrow ?? (defaultPlacement === "promo" ? "LIMITED TIME ONLY" : "")
  )
  const [subtitle, setSubtitle] = React.useState(
    initialBanner?.subtitle ??
      (defaultPlacement === "promo" ? "Enjoy up to 30% off selected styles." : "")
  )
  const [buttonLabel, setButtonLabel] = React.useState(
    initialBanner?.button_label ?? (defaultPlacement === "promo" ? "SHOP THE SALE" : "Shop Collection")
  )
  const [buttonLink, setButtonLink] = React.useState(
    initialBanner?.button_link ?? "/collections"
  )
  const [isActive, setIsActive] = React.useState(initialBanner?.is_active ?? true)
  const [sort, setSort] = React.useState(initialBanner?.sort ?? 0)

  // Image files & preview
  const [desktopFile, setDesktopFile] = React.useState<File | null>(null)
  const [desktopPreview, setDesktopPreview] = React.useState<string | null>(
    initialBanner?.desktop_image_url ?? null
  )
  const [mobileFile, setMobileFile] = React.useState<File | null>(null)
  const [mobilePreview, setMobilePreview] = React.useState<string | null>(
    initialBanner?.mobile_image_url ?? null
  )

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

  const handlePlacementChange = (newPlacement: BannerPlacement) => {
    if (!isEditing && newPlacement === "promo" && existingPromoId) {
      router.push(`/admin/banners/${existingPromoId}`)
      return
    }
    setPlacement(newPlacement)
    if (!isEditing) {
      if (newPlacement === "promo") {
        if (!title || title === "Hero Slide") setTitle("Summer Refresh")
        if (!eyebrow) setEyebrow("LIMITED TIME ONLY")
        if (!subtitle) setSubtitle("Enjoy up to 30% off selected styles.")
        if (!buttonLabel || buttonLabel === "Shop Collection") setButtonLabel("SHOP THE SALE")
      } else {
        if (title === "Summer Refresh") setTitle("Hero Slide")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("placement", placement)
      formData.append(
        "title",
        title.trim() || (placement === "hero" ? "Hero Carousel Slide" : "Summer Refresh")
      )
      formData.append("button_link", buttonLink.trim() || "/collections")
      formData.append("is_active", isActive ? "true" : "false")
      formData.append("sort", sort.toString())

      if (placement === "promo") {
        if (eyebrow.trim()) formData.append("eyebrow", eyebrow.trim())
        if (subtitle.trim()) formData.append("subtitle", subtitle.trim())
        if (buttonLabel.trim()) formData.append("button_label", buttonLabel.trim())
      }

      if (desktopFile) formData.append("desktop_file", desktopFile)
      if (mobileFile) formData.append("mobile_file", mobileFile)

      const res =
        isEditing && initialBanner
          ? await updateBannerAction(initialBanner.id, formData)
          : await createBannerAction(formData)

      if (res.success) {
        router.push("/admin/banners")
        router.refresh()
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
    <div className="space-y-6 pb-20 font-sans max-w-5xl mx-auto">
      {/* ── Top Header & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <Link
            href="/admin/banners"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Banners</span>
          </Link>
          <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            {isEditing
              ? placement === "hero"
                ? "Edit Hero Carousel Slide"
                : "Edit Promo Banner"
              : "Upload New Banner"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {placement === "hero"
              ? "Upload a full-width hero image and set where clicking the image navigates."
              : "Upload promo garment image and configure the headline, offer text, and shop button."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/admin/banners"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-none h-9 text-xs font-sans px-4 inline-flex items-center"
            )}
          >
            Cancel
          </Link>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-none h-9 text-xs px-6 uppercase tracking-wider font-semibold font-sans gap-1.5 bg-foreground text-background hover:bg-foreground/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : placement === "hero" ? (
              "Save Hero Slide"
            ) : (
              "Save Promo Banner"
            )}
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 rounded-none">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Section Type Selector (Hero vs Promo) - Only show when creating a new banner ── */}
      {!isEditing && (
        <div className="space-y-2">
          <span className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Select Banner Type
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handlePlacementChange("hero")}
              className={`p-4 border text-left transition-all rounded-none ${
                placement === "hero"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-background hover:border-border/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  Hero Carousel Slide
                </span>
                {placement === "hero" && <CheckCircle2 className="size-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Top rotating full-width banner image with clickable destination link.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handlePlacementChange("promo")}
              className={`p-4 border text-left transition-all rounded-none ${
                placement === "promo"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-background hover:border-border/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Tag className="size-4 text-primary" />
                  Promo Split Banner
                </span>
                {placement === "promo" && <CheckCircle2 className="size-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {!isEditing && existingPromoId
                  ? "Only 1 promo banner is used on the boutique. Click to edit existing."
                  : "Mid-page featured section with photo on the left & styled copy on the right."}
              </p>
            </button>
          </div>
        </div>
      )}

      {/* ── Form Body: Case 1 (Hero Carousel Slide) ── */}
      {placement === "hero" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Hero Image Upload */}
          <div className="bg-card border border-border p-6 rounded-none space-y-4">
            <div>
              <h2 className="text-sm font-sans font-semibold text-foreground uppercase tracking-wider">
                1. Hero Banner Image
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload your main landscape banner creative (Recommended: 2400 × 900 or 16:9 / 2:1).
              </p>
            </div>

            <div className="border-2 border-dashed border-border p-6 bg-muted/10 text-center space-y-3">
              {desktopPreview ? (
                <div className="relative aspect-[2/1] w-full max-w-2xl mx-auto overflow-hidden bg-muted border border-border">
                  <Image
                    src={desktopPreview}
                    alt="Hero Banner Preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
                  <UploadCloud className="size-10 mb-2 opacity-50" />
                  <span className="text-xs font-medium text-foreground">Select hero desktop banner</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    JPG, PNG, WebP (any size up to 50MB)
                  </span>
                </div>
              )}

              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-muted text-xs font-medium transition-colors">
                  <ImageIcon className="size-3.5" />
                  <span>{desktopPreview ? "Replace Hero Image" : "Choose Image File"}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleDesktopChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Optional Mobile Image */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-medium text-foreground">
                  Mobile Portrait Image (Optional)
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Recommended: 1080 × 1350 (4:5)
                </span>
              </div>
              <div className="flex items-center gap-4">
                {mobilePreview && (
                  <div className="relative w-16 h-20 bg-muted overflow-hidden border border-border shrink-0">
                    <Image
                      src={mobilePreview}
                      alt="Mobile Preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                )}
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 border border-input bg-background hover:bg-muted text-xs font-medium transition-colors">
                  <span>{mobilePreview ? "Replace Mobile Image" : "Upload Mobile Image (Optional)"}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleMobileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* 2. Hero Link & Details */}
          <div className="bg-card border border-border p-6 rounded-none space-y-4">
            <h2 className="text-sm font-sans font-semibold text-foreground uppercase tracking-wider pb-2 border-b border-border">
              2. Hero Image Click Link
            </h2>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Destination Link URL *
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  required
                  value={buttonLink}
                  onChange={(e) => setButtonLink(e.target.value)}
                  placeholder="/collections or /collections?category=dress"
                  className="h-10 pl-9 text-xs font-mono rounded-none bg-background border-input"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                When customers tap or click this banner, they will be taken to this page.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Slide Name / Title (For Admin Reference)
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer Heritage Collection"
                className="h-9 text-xs rounded-none bg-background border-input"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border">
              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="hero_is_active"
                  checked={isActive}
                  onCheckedChange={(v) => setIsActive(Boolean(v))}
                  className="rounded-none size-4"
                />
                <label
                  htmlFor="hero_is_active"
                  className="text-xs font-medium text-foreground cursor-pointer select-none"
                >
                  Active on storefront (visible in rotating hero slider)
                </label>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── Form Body: Case 2 (Promo Split Banner) ── */}
      {placement === "promo" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Promo Banner Image Upload */}
            <div className="bg-card border border-border p-6 rounded-none space-y-4">
              <div>
                <h2 className="text-sm font-sans font-semibold text-foreground uppercase tracking-wider">
                  1. Promo Image (Left Side)
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload the garment or lifestyle photo shown on the left of the banner.
                </p>
              </div>

              <div className="border-2 border-dashed border-border p-4 bg-muted/10 text-center space-y-3">
                {desktopPreview ? (
                  <div className="relative aspect-[3/2] w-full overflow-hidden bg-muted border border-border">
                    <Image
                      src={desktopPreview}
                      alt="Promo Image Preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                    <UploadCloud className="size-10 mb-2 opacity-50" />
                    <span className="text-xs font-medium text-foreground">Select promo photo</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      JPG, PNG, WebP up to 50MB
                    </span>
                  </div>
                )}

                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-muted text-xs font-medium transition-colors">
                    <ImageIcon className="size-3.5" />
                    <span>{desktopPreview ? "Replace Photo" : "Choose Photo File"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleDesktopChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Right: Form for that image texts */}
            <div className="bg-card border border-border p-6 rounded-none space-y-4">
              <div>
                <h2 className="text-sm font-sans font-semibold text-foreground uppercase tracking-wider">
                  2. Promo Banner Texts (Right Side)
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure the copywriting, offer headline, and call-to-action button.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Top Small Tag / Eyebrow
                </label>
                <Input
                  type="text"
                  value={eyebrow}
                  onChange={(e) => setEyebrow(e.target.value)}
                  placeholder="e.g. LIMITED TIME ONLY"
                  className="h-9 text-xs rounded-none bg-background border-input uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Main Title / Heading *
                </label>
                <Input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Summer Refresh"
                  className="h-9 text-xs font-medium rounded-none bg-background border-input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Subtitle / Offer Description
                </label>
                <Input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Enjoy up to 30% off selected styles."
                  className="h-9 text-xs rounded-none bg-background border-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Button Text (CTA)
                  </label>
                  <Input
                    type="text"
                    value={buttonLabel}
                    onChange={(e) => setButtonLabel(e.target.value)}
                    placeholder="e.g. SHOP THE SALE"
                    className="h-9 text-xs rounded-none bg-background border-input uppercase tracking-wider"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Button Link
                  </label>
                  <Input
                    type="text"
                    value={buttonLink}
                    onChange={(e) => setButtonLink(e.target.value)}
                    placeholder="/collections"
                    className="h-9 text-xs font-mono rounded-none bg-background border-input"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-border">
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    id="promo_is_active"
                    checked={isActive}
                    onCheckedChange={(v) => setIsActive(Boolean(v))}
                    className="rounded-none size-4"
                  />
                  <label
                    htmlFor="promo_is_active"
                    className="text-xs font-medium text-foreground cursor-pointer select-none"
                  >
                    Active on homepage
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Live Banner Preview (Simulating the homepage split card) */}
          <div className="bg-card border border-border p-6 rounded-none space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Live Storefront Preview
            </span>

            <div className="flex flex-col md:flex-row w-full h-auto md:h-[340px] bg-[#f2ede6] dark:bg-accent overflow-hidden border border-border shadow-xs">
              {/* Photo Side (60%) */}
              <div className="relative w-full md:w-[60%] h-[240px] md:h-full overflow-hidden bg-muted">
                {desktopPreview ? (
                  <Image
                    src={desktopPreview}
                    alt={title}
                    fill
                    unoptimized
                    className="object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-xs text-muted-foreground p-4 text-center">
                    <ImageIcon className="size-8 mb-1.5 opacity-40" />
                    <span>Uploaded photo will display here</span>
                  </div>
                )}
              </div>

              {/* Text Side (40%) */}
              <div className="w-full md:w-[40%] h-auto md:h-full py-8 px-6 md:p-8 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-3 text-foreground/70">
                  {eyebrow || "LIMITED TIME ONLY"}
                </p>
                <h2 className="font-heading text-2xl sm:text-3xl leading-tight font-normal mb-3 text-foreground">
                  {title || "Summer Refresh"}
                </h2>
                <p className="text-xs text-foreground/80 mb-6 max-w-[220px] mx-auto">
                  {subtitle || "Enjoy up to 30% off selected styles."}
                </p>
                <span className="px-6 py-3 bg-foreground text-background uppercase tracking-widest text-[10px] font-semibold">
                  {buttonLabel || "SHOP THE SALE"}
                </span>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
