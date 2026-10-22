"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { AdminBannerItem, BannerPlacement } from "../types"
import {
  toggleBannerActiveAction,
  deleteBannerAction,
  reorderBannersAction,
  seedInitialBannersAction,
} from "../actions"
import { BannerPreviewModal } from "./BannerPreviewModal"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "cn"
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Eye,
  Pencil,
  Trash2,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Search,
} from "lucide-react"

interface BannersClientViewProps {
  initialBanners: AdminBannerItem[]
}

export function BannersClientView({ initialBanners }: BannersClientViewProps) {
  const [banners, setBanners] = React.useState<AdminBannerItem[]>(initialBanners)
  const [prevInitial, setPrevInitial] = React.useState(initialBanners)
  if (initialBanners !== prevInitial) {
    setPrevInitial(initialBanners)
    setBanners(initialBanners)
  }

  const [activeTab, setActiveTab] = React.useState<"all" | BannerPlacement>("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [previewBanner, setPreviewBanner] = React.useState<AdminBannerItem | null>(null)

  const [isLoading, setIsLoading] = React.useState(false)
  const [statusMsg, setStatusMsg] = React.useState<{ text: string; type: "ok" | "err" } | null>(null)

  const showStatus = (text: string, type: "ok" | "err" = "ok") => {
    setStatusMsg({ text, type })
    setTimeout(() => setStatusMsg(null), 4000)
  }

  // Filtered banners
  const filteredBanners = React.useMemo(() => {
    return banners
      .filter((b) => {
        if (activeTab !== "all" && b.placement !== activeTab) return false
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          return (
            b.title.toLowerCase().includes(q) ||
            b.eyebrow?.toLowerCase().includes(q) ||
            b.subtitle?.toLowerCase().includes(q)
          )
        }
        return true
      })
      .sort((a, b) => a.sort - b.sort)
  }, [banners, activeTab, searchQuery])

  const heroCount = banners.filter((b) => b.placement === "hero" && b.is_active).length
  const promoCount = banners.filter((b) => b.placement === "promo" && b.is_active).length

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const nextState = !currentActive
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, is_active: nextState } : b))
    )

    const res = await toggleBannerActiveAction(id, nextState)
    if (!res.success) {
      // Revert on error
      setBanners((prev) =>
        prev.map((b) => (b.id === id ? { ...b, is_active: currentActive } : b))
      )
      showStatus(res.error || "Failed to update banner status.", "err")
    } else {
      showStatus(`Banner ${nextState ? "activated" : "deactivated"} successfully.`)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return
    }

    setIsLoading(true)
    const res = await deleteBannerAction(id)
    setIsLoading(false)

    if (res.success) {
      setBanners((prev) => prev.filter((b) => b.id !== id))
      showStatus("Banner deleted successfully.")
    } else {
      showStatus(res.error || "Failed to delete banner.", "err")
    }
  }

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= filteredBanners.length) return

    const reordered = [...filteredBanners]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)

    // Assign new sort numbers
    const updated = reordered.map((item, idx) => ({ ...item, sort: idx }))
    setBanners((prev) => {
      const map = new Map(updated.map((u) => [u.id, u.sort]))
      return prev.map((b) => (map.has(b.id) ? { ...b, sort: map.get(b.id)! } : b))
    })

    const orderedIds = updated.map((u) => u.id)
    const res = await reorderBannersAction(orderedIds)
    if (!res.success) {
      showStatus(res.error || "Failed to save reorder.", "err")
    }
  }

  const handleSeedDefaults = async () => {
    setIsLoading(true)
    const res = await seedInitialBannersAction()
    setIsLoading(false)

    if (res.success) {
      showStatus(`Imported ${res.count || 4} storefront default slides.`)
      window.location.reload()
    } else {
      showStatus(res.error || "Failed to seed banners.", "err")
    }
  }

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Administration
          </span>
          <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-0.5">
            Banners & Carousel
          </h1>
          <p className="mt-1 text-xs text-muted-foreground font-sans">
            Manage storefront hero carousel slides, promo banners, aspect ratios, and scheduled visibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {banners.length === 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSeedDefaults}
              disabled={isLoading}
              className="rounded-none h-9 text-xs font-sans"
            >
              <Layers className="size-3.5 mr-1.5" />
              Import Default Slides
            </Button>
          )}

          <Link
            href="/admin/banners/new"
            className={cn(
              buttonVariants(),
              "rounded-none h-9 text-xs px-4 uppercase tracking-wider font-medium font-sans inline-flex items-center"
            )}
          >
            <Plus className="size-3.5 mr-1.5" />
            Add New Banner
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {statusMsg && (
        <div
          className={`p-3 text-xs flex items-center gap-2 rounded-none font-sans ${
            statusMsg.type === "ok"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              : "bg-destructive/10 border border-destructive/30 text-destructive"
          }`}
        >
          {statusMsg.type === "ok" ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* ── Toolbar & Tabs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Tabs */}
        <div className="inline-flex items-center p-0.5 border border-border bg-muted/40 rounded-none">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 text-xs font-sans font-medium transition-colors ${
              activeTab === "all"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Banners ({banners.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("hero")}
            className={`px-3 py-1.5 text-xs font-sans font-medium transition-colors ${
              activeTab === "hero"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Hero Carousel ({banners.filter((b) => b.placement === "hero").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("promo")}
            className={`px-3 py-1.5 text-xs font-sans font-medium transition-colors ${
              activeTab === "promo"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Promo Banners ({banners.filter((b) => b.placement === "promo").length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search banners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-8 text-xs rounded-none bg-background border-input font-sans"
          />
        </div>
      </div>

      {/* ── Overview Stat Badges ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 border border-border bg-card rounded-none space-y-1">
          <span className="text-[11px] font-sans uppercase tracking-[0.08em] text-muted-foreground">
            Total Banners
          </span>
          <div className="text-xl font-mono font-semibold text-foreground">
            {banners.length}
          </div>
        </div>

        <div className="p-4 border border-border bg-card rounded-none space-y-1">
          <span className="text-[11px] font-sans uppercase tracking-[0.08em] text-muted-foreground">
            Live in Hero Carousel
          </span>
          <div className="text-xl font-mono font-semibold text-primary">
            {heroCount} active
          </div>
        </div>

        <div className="p-4 border border-border bg-card rounded-none space-y-1">
          <span className="text-[11px] font-sans uppercase tracking-[0.08em] text-muted-foreground">
            Live in Promo Section
          </span>
          <div className="text-xl font-mono font-semibold text-primary">
            {promoCount} active
          </div>
        </div>
      </div>

      {/* ── Banners List ── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 sm:p-5 border border-border bg-card rounded-none flex flex-col md:flex-row items-start md:items-center gap-4 justify-between"
            >
              <div className="flex items-start gap-4 flex-1">
                <Skeleton className="h-6 w-7 shrink-0 hidden sm:block" />
                <Skeleton className="w-28 sm:w-36 h-20 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3.5 w-64" />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 md:pt-0">
                <Skeleton className="size-8" />
                <Skeleton className="size-8" />
                <Skeleton className="h-5 w-10" />
                <Skeleton className="size-8" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border bg-card space-y-3">
          <ImageIcon className="size-10 mx-auto text-muted-foreground/60" />
          <h3 className="text-sm font-semibold text-foreground">No banners found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {banners.length === 0
              ? "You haven't added any banners yet. Import the storefront defaults or create your first slide."
              : "No banners matched your active filter or search query."}
          </p>
          {banners.length === 0 && (
            <div className="pt-2 flex justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleSeedDefaults}
                className="rounded-none h-8 text-xs"
              >
                Import Default Slides
              </Button>
              <Link
                href="/admin/banners/new"
                className={cn(
                  buttonVariants(),
                  "rounded-none h-8 text-xs font-sans inline-flex items-center"
                )}
              >
                Create Banner
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBanners.map((banner, index) => {
            const isHero = banner.placement === "hero"

            return (
              <div
                key={banner.id}
                className={`p-5 border transition-all rounded-none bg-card ${
                  banner.is_active ? "border-border" : "border-border/60 opacity-75 bg-muted/20"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left: Reorder & Thumbnails */}
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col items-center gap-1 shrink-0 pt-1 sm:pt-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMove(index, "up")}
                        title="Move Up"
                        className="p-1 border border-border bg-background hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      >
                        <ArrowUp className="size-3 text-muted-foreground" />
                      </button>
                      <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                        #{index + 1}
                      </span>
                      <button
                        type="button"
                        disabled={index === filteredBanners.length - 1}
                        onClick={() => handleMove(index, "down")}
                        title="Move Down"
                        className="p-1 border border-border bg-background hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      >
                        <ArrowDown className="size-3 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Creative Previews */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      {/* Desktop Preview */}
                      <div className="relative w-36 sm:w-44 aspect-[8/3] bg-neutral-900 border border-border overflow-hidden">
                        {banner.desktop_image_url ? (
                          <Image
                            src={banner.desktop_image_url}
                            alt={banner.title}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] text-muted-foreground">
                            No Desktop
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 text-[8px] font-mono bg-black/80 text-white uppercase tracking-wider">
                          8:3 Desktop
                        </span>
                      </div>

                      {/* Mobile Preview */}
                      <div className="relative w-12 sm:w-14 aspect-[4/5] bg-neutral-900 border border-border overflow-hidden">
                        {banner.mobile_image_url ? (
                          <Image
                            src={banner.mobile_image_url}
                            alt={banner.title}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground">
                            No Mob
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 text-[7px] font-mono bg-black/80 text-white uppercase tracking-wider">
                          4:5
                        </span>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="space-y-1 max-w-md">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 border ${
                            isHero
                              ? "bg-primary/10 text-primary border-primary/20 font-semibold"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 font-semibold"
                          }`}
                        >
                          {isHero ? "Hero Carousel" : "Promo Banner"}
                        </span>
                        {banner.eyebrow && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            • {banner.eyebrow}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-foreground tracking-tight">
                        {banner.title}
                      </h3>

                      {banner.subtitle && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {banner.subtitle}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5 font-mono">
                        {banner.button_label && (
                          <span className="flex items-center gap-1 text-foreground">
                            <span>Button: &quot;{banner.button_label}&quot;</span>
                          </span>
                        )}
                        {banner.button_link && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <ExternalLink className="size-3" />
                            <span>{banner.button_link}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Toggle Switch & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/60 shrink-0">
                    {/* Active Status Badge / Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(banner.id, banner.is_active)}
                      className={`px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider border transition-colors ${
                        banner.is_active
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                      }`}
                    >
                      {banner.is_active ? "● Active" : "○ Inactive"}
                    </button>

                    {/* Preview Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPreviewBanner(banner)
                        setPreviewOpen(true)
                      }}
                      className="rounded-none h-8 text-xs font-sans"
                    >
                      <Eye className="size-3.5 mr-1 text-muted-foreground" />
                      Preview
                    </Button>

                    {/* Edit Button */}
                    <Link
                      href={`/admin/banners/${banner.id}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "rounded-none h-8 text-xs font-sans inline-flex items-center"
                      )}
                    >
                      <Pencil className="size-3.5 mr-1 text-muted-foreground" />
                      Edit
                    </Link>

                    {/* Delete Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(banner.id, banner.title)}
                      className="rounded-none h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Visual Live Preview Modal ── */}
      <BannerPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        banner={previewBanner}
      />
    </div>
  )
}
