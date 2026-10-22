"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
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
  ImageIcon,
  Sparkles,
  Smartphone,
  Monitor,
  Eye,
} from "lucide-react"

interface BannerFormProps {
  mode: "create" | "edit"
  initialBanner?: AdminBannerItem | null
}

export function BannerForm({ mode, initialBanner }: BannerFormProps) {
  const router = useRouter()
  const isEditing = mode === "edit" && Boolean(initialBanner)

  const [placement, setPlacement] = React.useState<BannerPlacement>(
    initialBanner?.placement ?? "hero"
  )
  const [title, setTitle] = React.useState(initialBanner?.title ?? "")
  const [eyebrow, setEyebrow] = React.useState(initialBanner?.eyebrow ?? "")
  const [subtitle, setSubtitle] = React.useState(initialBanner?.subtitle ?? "")
  const [buttonLabel, setButtonLabel] = React.useState(
    initialBanner ? initialBanner.button_label ?? "" : "Shop Collection"
  )
  const [buttonLink, setButtonLink] = React.useState(
    initialBanner ? initialBanner.button_link ?? "" : "/collections"
  )
  const [sort, setSort] = React.useState(initialBanner?.sort ?? 0)
  const [isActive, setIsActive] = React.useState(initialBanner?.is_active ?? true)
  const [startsAt, setStartsAt] = React.useState(
    initialBanner?.starts_at ? initialBanner.starts_at.slice(0, 16) : ""
  )
  const [endsAt, setEndsAt] = React.useState(
    initialBanner?.ends_at ? initialBanner.ends_at.slice(0, 16) : ""
  )

  const [desktopFile, setDesktopFile] = React.useState<File | null>(null)
  const [desktopPreview, setDesktopPreview] = React.useState<string | null>(
    initialBanner?.desktop_image_url ?? null
  )
  const [mobileFile, setMobileFile] = React.useState<File | null>(null)
  const [mobilePreview, setMobilePreview] = React.useState<string | null>(
    initialBanner?.mobile_image_url ?? null
  )

  const [previewDevice, setPreviewDevice] = React.useState<"desktop" | "mobile">("desktop")
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

      const res = isEditing && initialBanner
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
    <div className="space-y-6 pb-20 font-sans">
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
          <div className="flex items-center gap-2 text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span>Admin</span>
            <span>/</span>
            <span>Banners</span>
            <span>/</span>
            <span>{isEditing ? "Edit" : "New"}</span>
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            {isEditing ? "Edit Banner Slide" : "Create New Banner Slide"}
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure desktop and mobile visual creatives, titles, call-to-action buttons, and display placement.
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
            className="rounded-none h-9 text-xs px-6 uppercase tracking-wider font-medium font-sans gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Create Banner"
            )}
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 rounded-none">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Main Form Layout (2 Cols on lg) ── */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Content & Creative Assets */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Placement Selector Card */}
          <div className="bg-card border border-border p-5 rounded-none space-y-3">
            <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Placement Type *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlacement("hero")}
                className={`p-4 border text-left transition-all rounded-none ${
                  placement === "hero"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-background hover:border-border/80"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-foreground">
                    Hero Carousel Slide
                  </span>
                  <Sparkles className="size-4 text-primary" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Top full-width rotating hero banner on the boutique homepage (8:3 desktop, 4:5 mobile).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPlacement("promo")}
                className={`p-4 border text-left transition-all rounded-none ${
                  placement === "promo"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-background hover:border-border/80"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-foreground">
                    Mid-Page Promo Banner
                  </span>
                  <ImageIcon className="size-4 text-primary" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Featured middle section promotional card or boutique atelier highlight (4:1 desktop, 4:5 mobile).
                </p>
              </button>
            </div>
          </div>

          {/* 2. Banner Copywriting Card */}
          <div className="bg-card border border-border p-5 rounded-none space-y-4">
            <h2 className="text-xs font-sans font-semibold text-foreground uppercase tracking-wider pb-2 border-b border-border">
              Typography & Copywriting
            </h2>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
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

          {/* 3. Creative Media Assets Card */}
          <div className="bg-card border border-border p-5 rounded-none space-y-5">
            <h2 className="text-xs font-sans font-semibold text-foreground uppercase tracking-wider pb-2 border-b border-border">
              Creative Visual Assets (Desktop & Mobile)
            </h2>

            {/* Desktop Asset */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Monitor className="size-3.5 text-muted-foreground" />
                  Desktop Creative (Landscape)
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {placement === "hero" ? "Recommended: 2400 × 900 (8:3)" : "Recommended: 2400 × 600 (4:1)"}
                </span>
              </div>

              <div className="border border-dashed border-border p-4 bg-muted/10 space-y-3">
                {desktopPreview ? (
                  <div className={`relative w-full bg-muted overflow-hidden border border-border ${
                    placement === "hero" ? "aspect-[8/3]" : "aspect-[4/1]"
                  }`}>
                    <Image
                      src={desktopPreview}
                      alt="Desktop Banner Preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
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

            {/* Mobile Asset */}
            <div className="space-y-2.5">
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
                  <div className="relative aspect-[4/5] max-w-[220px] mx-auto bg-muted overflow-hidden border border-border shadow-xs">
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
        </div>

        {/* Right Column (1/3): Visibility, Scheduling & Live Preview */}
        <div className="space-y-6">
          {/* Status & Sequence Card */}
          <div className="bg-card border border-border p-5 rounded-none space-y-4">
            <h2 className="text-xs font-sans font-semibold text-foreground uppercase tracking-wider pb-2 border-b border-border">
              Visibility & Order
            </h2>

            <div className="flex items-center justify-between p-3 border border-border bg-muted/20">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-foreground block">
                  Storefront Status
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {isActive ? "Active and eligible for display" : "Draft / Inactive"}
                </span>
              </div>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <Checkbox
                id="is_active_form"
                checked={isActive}
                onCheckedChange={(v) => setIsActive(Boolean(v))}
                className="rounded-none size-4"
              />
              <label
                htmlFor="is_active_form"
                className="text-xs font-sans font-medium text-foreground cursor-pointer select-none"
              >
                Publish & display on live storefront
              </label>
            </div>

            <div className="pt-2">
              <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1">
                Sort Sequence
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
                Lower numbers appear first in rotating carousel.
              </p>
            </div>
          </div>

          {/* Scheduling Card */}
          <div className="bg-card border border-border p-5 rounded-none space-y-4">
            <h2 className="text-xs font-sans font-semibold text-foreground uppercase tracking-wider pb-2 border-b border-border">
              Scheduled Visibility (Optional)
            </h2>

            <div>
              <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1">
                Start Schedule
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
                End Schedule
              </label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="h-9 text-xs font-mono rounded-none bg-background border-input"
              />
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Leaving schedule empty displays the banner continuously whenever active is enabled.
            </p>
          </div>

          {/* Interactive Live Creative Preview */}
          <div className="bg-card border border-border p-5 rounded-none space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-1.5">
                <Eye className="size-3.5 text-muted-foreground" />
                <h2 className="text-xs font-sans font-semibold text-foreground uppercase tracking-wider">
                  Live Preview
                </h2>
              </div>

              <div className="inline-flex p-0.5 border border-border bg-muted/40">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`px-2 py-0.5 text-[10px] font-mono transition-colors ${
                    previewDevice === "desktop"
                      ? "bg-card text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`px-2 py-0.5 text-[10px] font-mono transition-colors ${
                    previewDevice === "mobile"
                      ? "bg-card text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Mobile
                </button>
              </div>
            </div>

            {previewDevice === "desktop" ? (
              <div className={`relative w-full overflow-hidden border border-border bg-neutral-900 text-white flex items-center justify-center p-4 text-center ${
                placement === "hero" ? "aspect-[8/3]" : "aspect-[4/1]"
              }`}>
                {desktopPreview ? (
                  <Image
                    src={desktopPreview}
                    alt="Desktop preview"
                    fill
                    unoptimized
                    className="object-cover opacity-60"
                  />
                ) : (
                  <div className="absolute inset-0 bg-neutral-900" />
                )}
                <div className="relative z-10 max-w-sm space-y-1">
                  {eyebrow && (
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-neutral-300 block">
                      {eyebrow}
                    </span>
                  )}
                  <h4 className="text-xs sm:text-sm font-semibold tracking-tight text-white line-clamp-1">
                    {title || "Banner Headline"}
                  </h4>
                  {subtitle && (
                    <p className="text-[10px] text-neutral-200 line-clamp-1">
                      {subtitle}
                    </p>
                  )}
                  {buttonLabel && (
                    <div className="pt-1">
                      <span className="inline-block px-2.5 py-1 text-[9px] uppercase tracking-wider font-semibold bg-white text-black">
                        {buttonLabel}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative aspect-[4/5] max-w-[200px] mx-auto overflow-hidden border border-border bg-neutral-900 text-white flex items-end p-4 text-left">
                {mobilePreview ? (
                  <Image
                    src={mobilePreview}
                    alt="Mobile preview"
                    fill
                    unoptimized
                    className="object-cover opacity-65"
                  />
                ) : desktopPreview ? (
                  <Image
                    src={desktopPreview}
                    alt="Desktop fallback"
                    fill
                    unoptimized
                    className="object-cover opacity-60"
                  />
                ) : (
                  <div className="absolute inset-0 bg-neutral-900" />
                )}
                <div className="relative z-10 space-y-1">
                  {eyebrow && (
                    <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-neutral-300 block">
                      {eyebrow}
                    </span>
                  )}
                  <h4 className="text-xs font-semibold tracking-tight text-white line-clamp-2">
                    {title || "Banner Headline"}
                  </h4>
                  {buttonLabel && (
                    <div className="pt-1">
                      <span className="inline-block px-2 py-0.5 text-[8px] uppercase tracking-wider font-semibold bg-white text-black">
                        {buttonLabel}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
