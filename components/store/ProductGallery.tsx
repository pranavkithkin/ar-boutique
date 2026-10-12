"use client"

import * as React from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { ZoomableProductImage } from "@/components/store/ZoomableProductImage"
import { cn } from "@/lib/utils"

const control = "flex h-11 w-11 shrink-0 items-center justify-center border border-input bg-background text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40"

function GalleryArrows({ onNavigate, disabled }: { onNavigate: (direction: number) => void; disabled: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-x-2 top-1/2 z-10 flex -translate-y-1/2 justify-between">
      <button type="button" className={`${control} pointer-events-auto`} aria-label="Previous image" disabled={disabled} onClick={() => onNavigate(-1)}><ChevronLeft strokeWidth={1.5} /></button>
      <button type="button" className={`${control} pointer-events-auto`} aria-label="Next image" disabled={disabled} onClick={() => onNavigate(1)}><ChevronRight strokeWidth={1.5} /></button>
    </div>
  )
}

function Gallery({ images }: { images: string[] }) {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [open, setOpen] = React.useState(false)
  const opener = React.useRef<HTMLButtonElement>(null)
  const thumbnails = React.useRef<HTMLDivElement>(null)
  const imageLabel = `Product image ${selectedIndex + 1} of ${images.length}`
  const navigate = (direction: number) => setSelectedIndex((index) => (index + direction + images.length) % images.length)

  React.useEffect(() => {
    const active = thumbnails.current?.querySelector<HTMLElement>('[aria-pressed="true"]')
    const rail = thumbnails.current
    if (!active || !rail) return
    if (rail.scrollWidth > rail.clientWidth) rail.scrollTo({ left: active.offsetLeft - rail.clientWidth / 2 + active.clientWidth / 2 })
    if (rail.scrollHeight > rail.clientHeight) rail.scrollTo({ top: active.offsetTop - rail.clientHeight / 2 + active.clientHeight / 2 })
  }, [selectedIndex])

  function keys(event: React.KeyboardEvent) {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
    event.preventDefault()
    event.stopPropagation()
    const root = event.currentTarget
    const restoreImageFocus = event.target instanceof HTMLElement && event.target.hasAttribute("data-zoom")
    navigate(event.key === "ArrowRight" ? 1 : -1)
    if (restoreImageFocus) requestAnimationFrame(() => root.querySelector<HTMLElement>("[data-zoom]")?.focus())
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <section aria-label="Product images" aria-roledescription="carousel" onKeyDown={keys} className="grid w-full min-w-0 gap-3 sm:grid-cols-[4rem_minmax(0,1fr)]">
        <div ref={thumbnails} aria-label="Choose product image" className="relative order-2 flex max-w-full gap-2 overflow-auto sm:order-1 sm:max-h-[75dvh] sm:flex-col">
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              aria-label={`Show image ${index + 1}`}
              aria-pressed={selectedIndex === index}
              onClick={() => setSelectedIndex(index)}
              className={cn("relative aspect-[3/4] w-16 shrink-0 overflow-hidden border-2 bg-muted focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring", selectedIndex === index ? "border-foreground" : "border-transparent hover:border-input")}
            >
              <Image src={src} alt="" fill sizes="64px" unoptimized className="object-cover" />
            </button>
          ))}
        </div>
        <div className="order-1 min-w-0 space-y-2 sm:order-2">
          <div className="relative">
            <ZoomableProductImage key={`${selectedIndex}-${images[selectedIndex]}`} src={images[selectedIndex]} alt={imageLabel} onNavigate={navigate} />
            <GalleryArrows onNavigate={navigate} disabled={images.length < 2} />
            <button ref={opener} type="button" aria-label="Open full-screen gallery" className={`${control} absolute top-2 right-2`} onClick={() => setOpen(true)}><Maximize2 size={20} strokeWidth={1.5} /></button>
          </div>
          <p className="flex items-start justify-between gap-3 text-sm text-muted-foreground">
            <span>Click or pinch to zoom. Swipe when unzoomed.</span>
            <span className="shrink-0 tabular-nums" aria-live="polite" aria-atomic="true">{selectedIndex + 1} / {images.length}</span>
          </p>
        </div>
      </section>
      <DialogContent
        showCloseButton={false}
        finalFocus={opener}
        onKeyDown={keys}
        className="grid-rows-[auto_minmax(0,1fr)_auto] gap-3 bg-background p-3 text-foreground sm:p-5"
        style={{ top: 0, left: 0, transform: "none", translate: "none", width: "100vw", maxWidth: "none", height: "100dvh" }}
      >
        <div className="flex items-center justify-between gap-4">
          <DialogTitle className="font-heading text-xl sm:text-2xl">Product gallery</DialogTitle>
          <DialogClose aria-label="Close full-screen gallery" className={control}><X size={22} strokeWidth={1.5} /></DialogClose>
        </div>
        <div className="relative min-h-0">
          <ZoomableProductImage key={`full-${selectedIndex}-${images[selectedIndex]}`} src={images[selectedIndex]} alt={imageLabel} onNavigate={navigate} fullScreen />
          <GalleryArrows onNavigate={navigate} disabled={images.length < 2} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <DialogDescription className="text-sm">Click or pinch to zoom. Drag to explore. Use arrows to change images.</DialogDescription>
          <span className="shrink-0 text-sm tabular-nums" aria-live="polite" aria-atomic="true">{selectedIndex + 1} / {images.length}</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ProductGallery({ images }: { images: string[] }) {
  const usableImages = images.filter((src) => src.trim().length > 0)
  if (usableImages.length === 0) {
    return <div role="status" className="flex aspect-[3/4] items-center justify-center bg-muted p-6 text-muted-foreground">Product images are not available yet.</div>
  }
  // A new colourway/photo set starts at its first image and clears any old zoom.
  return <Gallery key={JSON.stringify(usableImages)} images={usableImages} />
}
