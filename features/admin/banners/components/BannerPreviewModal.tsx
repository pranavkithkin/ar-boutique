"use client"

import * as React from "react"
import Image from "next/image"
import { AdminBannerItem } from "../types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Monitor, Smartphone, ArrowRight, Eye } from "lucide-react"

interface BannerPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  banner?: AdminBannerItem | null
}

export function BannerPreviewModal({
  open,
  onOpenChange,
  banner,
}: BannerPreviewModalProps) {
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop")

  if (!banner) return null

  const currentImg =
    device === "desktop"
      ? banner.desktop_image_url || banner.mobile_image_url
      : banner.mobile_image_url || banner.desktop_image_url

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-none p-6 space-y-5 bg-card border-border font-sans">
        <DialogHeader className="border-b border-border pb-3 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">
              <Eye className="size-3.5 text-primary" />
              <span>Visual Live Preview</span>
            </div>
            <DialogTitle className="font-sans text-xl font-semibold text-foreground tracking-tight">
              {banner.title}
            </DialogTitle>
          </div>

          {/* Device Switcher */}
          <div className="inline-flex items-center p-0.5 border border-border bg-muted/40 rounded-none mr-6">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-sans font-medium transition-colors ${
                device === "desktop"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Monitor className="size-3.5" />
              <span>Desktop (8:3)</span>
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-sans font-medium transition-colors ${
                device === "mobile"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Smartphone className="size-3.5" />
              <span>Mobile (4:5)</span>
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted/20 border border-border text-[11px] text-muted-foreground font-sans flex items-center justify-between">
            <span>
              Placement: <strong className="text-foreground uppercase">{banner.placement}</strong>
            </span>
            <span>
              Target: <strong className="text-foreground">{banner.button_link || "/collections"}</strong>
            </span>
            <span>
              Status: <strong className={banner.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                {banner.is_active ? "Active" : "Draft / Inactive"}
              </strong>
            </span>
          </div>

          {/* Interactive Screen Simulation */}
          <div className="flex items-center justify-center p-4 sm:p-8 bg-neutral-900/90 rounded-none border border-border/80">
            {device === "desktop" ? (
              /* Desktop Frame */
              <div className="relative w-full aspect-[8/3] max-w-4xl bg-neutral-950 overflow-hidden shadow-2xl border border-white/10 flex items-center">
                {currentImg ? (
                  <Image
                    src={currentImg}
                    alt={banner.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-neutral-900">
                    No desktop creative uploaded
                  </div>
                )}

                {/* Gradient vignette for legibility */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent pointer-events-none" />

                {/* Content Overlay */}
                <div className="relative z-10 p-6 sm:p-10 max-w-lg space-y-2.5 text-white">
                  {banner.eyebrow && (
                    <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-semibold text-white/80 block">
                      {banner.eyebrow}
                    </span>
                  )}
                  <h2 className="font-heading text-xl sm:text-3xl lg:text-4xl font-normal leading-tight">
                    {banner.title}
                  </h2>
                  {banner.subtitle && (
                    <p className="text-xs sm:text-sm text-white/80 font-sans leading-relaxed line-clamp-2">
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.button_label && (
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest bg-white text-black hover:bg-white/90 shadow-md">
                        <span>{banner.button_label}</span>
                        <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Mobile Frame */
              <div className="relative w-[280px] sm:w-[320px] aspect-[4/5] bg-neutral-950 overflow-hidden shadow-2xl border-2 border-white/20 rounded-2xl flex flex-col justify-end">
                {currentImg ? (
                  <Image
                    src={currentImg}
                    alt={banner.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-neutral-900">
                    No mobile creative uploaded
                  </div>
                )}

                {/* Gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

                {/* Content Overlay */}
                <div className="relative z-10 p-5 space-y-2 text-white">
                  {banner.eyebrow && (
                    <span className="text-[9px] uppercase tracking-[0.16em] font-semibold text-white/80 block">
                      {banner.eyebrow}
                    </span>
                  )}
                  <h2 className="font-heading text-lg sm:text-xl font-normal leading-tight">
                    {banner.title}
                  </h2>
                  {banner.subtitle && (
                    <p className="text-[11px] text-white/80 font-sans leading-snug line-clamp-2">
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.button_label && (
                    <div className="pt-1.5">
                      <span className="inline-flex items-center justify-center gap-1.5 w-full py-2 text-[11px] font-semibold uppercase tracking-wider bg-white text-black shadow-md">
                        <span>{banner.button_label}</span>
                        <ArrowRight className="size-3" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
