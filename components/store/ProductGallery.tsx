"use client"

import * as React from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, ZoomIn, RotateCcw } from "lucide-react"
import {
  ZoomableProductImage,
  type ZoomableProductImageHandle,
} from "@/components/store/ZoomableProductImage"
import { cn } from "@/lib/utils"

interface ProductGalleryProps {
  images: string[]
}

/**
 * Main Product Gallery with In-Place Direct Zoom & Sleek Slider Navigation
 * No sheet or modal dialog — zoom occurs directly within the image frame.
 */
export function ProductGallery({ images }: ProductGalleryProps) {
  const usableImages = React.useMemo(
    () => images.filter((src) => src.trim().length > 0),
    [images]
  )

  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [isZoomed, setIsZoomed] = React.useState(false)
  const zoomImageRef = React.useRef<ZoomableProductImageHandle>(null)
  const thumbnailsRef = React.useRef<HTMLDivElement>(null)

  // Navigate between images
  const navigate = React.useCallback(
    (direction: number) => {
      if (usableImages.length <= 1) return
      setIsZoomed(false)
      setSelectedIndex((prev) => (prev + direction + usableImages.length) % usableImages.length)
    },
    [usableImages.length]
  )

  // Scroll active thumbnail into view
  React.useEffect(() => {
    const rail = thumbnailsRef.current
    if (!rail) return
    const activeThumb = rail.querySelector<HTMLElement>('[data-active="true"]')
    if (!activeThumb) return

    if (rail.scrollWidth > rail.clientWidth) {
      rail.scrollTo({
        left: activeThumb.offsetLeft - rail.clientWidth / 2 + activeThumb.clientWidth / 2,
        behavior: "smooth",
      })
    }
    if (rail.scrollHeight > rail.clientHeight) {
      rail.scrollTo({
        top: activeThumb.offsetTop - rail.clientHeight / 2 + activeThumb.clientHeight / 2,
        behavior: "smooth",
      })
    }
  }, [selectedIndex])

  // Keyboard navigation when unzoomed
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault()
        navigate(-1)
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        navigate(1)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [navigate])

  const selectPhoto = (index: number) => {
    setIsZoomed(false)
    setSelectedIndex(index)
  }

  const handleToggleZoom = () => {
    zoomImageRef.current?.toggleZoom()
  }

  if (usableImages.length === 0) {
    return (
      <div
        role="status"
        className="flex aspect-[3/4] items-center justify-center bg-muted/20 p-6 text-muted-foreground text-sm"
      >
        Product images are not available yet.
      </div>
    )
  }

  const currentImage = usableImages[selectedIndex] || usableImages[0]
  const imageLabel = `Product image ${selectedIndex + 1} of ${usableImages.length}`

  return (
    <div className="w-full select-none">
      <div className="grid w-full gap-3.5 sm:grid-cols-[4.5rem_minmax(0,1fr)]">
        {/* Left Vertical Thumbnail Rail (Horizontal on mobile) */}
        {usableImages.length > 1 && (
          <div
            ref={thumbnailsRef}
            aria-label="Product thumbnails"
            className="order-2 flex max-w-full gap-2.5 overflow-x-auto pb-1 sm:order-1 sm:max-h-[72vh] sm:flex-col sm:overflow-y-auto sm:pb-0 scrollbar-none"
          >
            {usableImages.map((src, index) => {
              const isActive = selectedIndex === index
              return (
                <button
                  key={`thumb-${src}-${index}`}
                  type="button"
                  data-active={isActive ? "true" : "false"}
                  aria-label={`View photo ${index + 1}`}
                  aria-pressed={isActive}
                  onClick={() => selectPhoto(index)}
                  className={cn(
                    "relative aspect-[3/4] w-14 sm:w-full shrink-0 overflow-hidden border transition-all rounded-xs focus-visible:outline-2 focus-visible:outline-ring",
                    isActive
                      ? "border-foreground ring-1 ring-foreground/20 shadow-xs opacity-100"
                      : "border-border/60 opacity-60 hover:opacity-100 hover:border-foreground/40"
                  )}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="72px"
                    unoptimized
                    className="object-cover"
                  />
                </button>
              )
            })}
          </div>
        )}

        {/* Main In-Place Zoomable Viewing Stage */}
        <div
          className={cn(
            "order-1 min-w-0 sm:order-2",
            usableImages.length <= 1 && "sm:col-span-2"
          )}
        >
          <div className="relative group w-full overflow-hidden bg-muted/20 border border-border/40 rounded-xs">
            {/* The In-Place Zoom Engine (exact same zoom behavior as before) */}
            <ZoomableProductImage
              key={`${selectedIndex}-${currentImage}`}
              ref={zoomImageRef}
              src={currentImage}
              alt={imageLabel}
              onNavigate={navigate}
              onZoomChange={setIsZoomed}
            />

            {/* Floating Navigation Controls (sleek rounded frosted-glass icons) */}
            {usableImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(-1)
                  }}
                  aria-label="Previous image"
                  className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/85 backdrop-blur-md border border-border/70 text-foreground shadow-md transition-all hover:bg-background hover:scale-105 active:scale-95 sm:opacity-0 sm:group-hover:opacity-100",
                    isZoomed && "hidden"
                  )}
                >
                  <ChevronLeft className="h-5 w-5 stroke-[1.5]" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(1)
                  }}
                  aria-label="Next image"
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/85 backdrop-blur-md border border-border/70 text-foreground shadow-md transition-all hover:bg-background hover:scale-105 active:scale-95 sm:opacity-0 sm:group-hover:opacity-100",
                    isZoomed && "hidden"
                  )}
                >
                  <ChevronRight className="h-5 w-5 stroke-[1.5]" />
                </button>
              </>
            )}

            {/* Top-Right In-Place Zoom Toggle Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleToggleZoom()
              }}
              aria-label={isZoomed ? "Reset zoom" : "Zoom in on image"}
              className={cn(
                "absolute top-3 right-3 z-10 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-background/85 backdrop-blur-md border border-border/70 text-foreground shadow-md hover:bg-background hover:scale-105 active:scale-95 transition-all",
                isZoomed && "bg-foreground text-background border-foreground hover:bg-foreground/90"
              )}
            >
              {isZoomed ? (
                <RotateCcw className="h-4 w-4 stroke-[1.5]" />
              ) : (
                <ZoomIn className="h-4 w-4 stroke-[1.5]" />
              )}
            </button>

            {/* Bottom-Right Slide Index Pill */}
            {usableImages.length > 1 && (
              <div
                className={cn(
                  "absolute bottom-3 right-3 z-10 flex items-center px-2.5 py-1 rounded-full bg-background/85 backdrop-blur-md border border-border/60 text-foreground text-[11px] font-mono tracking-wider shadow-xs pointer-events-none transition-opacity",
                  isZoomed && "opacity-0"
                )}
              >
                {selectedIndex + 1} / {usableImages.length}
              </div>
            )}

            {/* Bottom-Left Status Indicator */}
            <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/85 backdrop-blur-md border border-border/50 text-foreground text-[10px] uppercase font-medium tracking-wider shadow-xs pointer-events-none">
              {isZoomed ? (
                <>
                  <RotateCcw className="h-3 w-3" />
                  <span>Click to Reset Zoom</span>
                </>
              ) : (
                <>
                  <ZoomIn className="h-3 w-3" />
                  <span>Click to Zoom</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
