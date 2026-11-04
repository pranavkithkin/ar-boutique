"use client"

import * as React from "react"
import Image from "next/image"
import { Minus, Plus, RotateCcw } from "lucide-react"

type Point = { x: number; y: number }
type View = Point & { scale: number }
type Gesture = { points: Point[]; view: View; pinched: boolean }
const INITIAL: View = { x: 0, y: 0, scale: 1 }

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
const middle = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

export interface ZoomableProductImageHandle {
  toggleZoom: () => void
  resetZoom: () => void
}

interface ZoomableProductImageProps {
  src: string
  alt: string
  onNavigate: (direction: number) => void
  fullScreen?: boolean
  onZoomChange?: (isZoomed: boolean) => void
}

export const ZoomableProductImage = React.forwardRef<
  ZoomableProductImageHandle,
  ZoomableProductImageProps
>(function ZoomableProductImage(
  { src, alt, onNavigate, fullScreen = false, onZoomChange },
  ref
) {
  const [view, setView] = React.useState<View>(INITIAL)
  const [failed, setFailed] = React.useState(false)
  const [loaded, setLoaded] = React.useState(false)
  const [attempt, setAttempt] = React.useState(0)
  const surface = React.useRef<HTMLDivElement>(null)
  const image = React.useRef<HTMLImageElement>(null)
  const current = React.useRef<View>(INITIAL)
  const pointers = React.useRef(new Map<number, Point>())
  const gesture = React.useRef<Gesture | null>(null)
  const suppressClick = React.useRef(false)

  function apply(next: View) {
    const box = surface.current
    const photo = image.current
    const scale = Math.min(4, Math.max(1, next.scale))
    const width = box?.clientWidth ?? 0
    const height = box?.clientHeight ?? 0
    const ratio =
      photo?.naturalWidth && photo.naturalHeight
        ? photo.naturalWidth / photo.naturalHeight
        : width / (height || 1)
    const fittedWidth = Math.min(width, height * ratio)
    const fittedHeight = fittedWidth / (ratio || 1)
    const boundX = Math.max(0, (fittedWidth * scale - width) / 2)
    const boundY = Math.max(0, (fittedHeight * scale - height) / 2)
    current.current = {
      scale,
      x: Math.max(-boundX, Math.min(boundX, next.x)),
      y: Math.max(-boundY, Math.min(boundY, next.y)),
    }
    setView(current.current)
    onZoomChange?.(current.current.scale > 1)
  }

  function toggleZoom() {
    apply(current.current.scale > 1 ? INITIAL : { ...INITIAL, scale: 2.2 })
  }

  React.useImperativeHandle(ref, () => ({
    toggleZoom,
    resetZoom: () => apply(INITIAL),
  }))

  function start(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const points = [...pointers.current.values()]
    gesture.current = { points, view: current.current, pinched: points.length > 1 }
    suppressClick.current = points.length > 1
  }

  function move(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const points = [...pointers.current.values()]
    const startGesture = gesture.current
    if (points.length >= 2 && startGesture.points.length >= 2) {
      const ratio =
        distance(points[0], points[1]) /
        Math.max(1, distance(startGesture.points[0], startGesture.points[1]))
      const scale = Math.min(4, Math.max(1, startGesture.view.scale * ratio))
      const factor = scale / startGesture.view.scale
      const box = event.currentTarget.getBoundingClientRect()
      const before = middle(startGesture.points[0], startGesture.points[1])
      const after = middle(points[0], points[1])
      apply({
        scale,
        x:
          after.x -
          box.left -
          box.width / 2 -
          (before.x - box.left - box.width / 2 - startGesture.view.x) * factor,
        y:
          after.y -
          box.top -
          box.height / 2 -
          (before.y - box.top - box.height / 2 - startGesture.view.y) * factor,
      })
      suppressClick.current = true
    } else if (points.length === 1 && startGesture.points.length === 1) {
      const dx = points[0].x - startGesture.points[0].x
      const dy = points[0].y - startGesture.points[0].y
      if (Math.hypot(dx, dy) > 8) suppressClick.current = true
      if (startGesture.view.scale > 1) {
        apply({
          scale: startGesture.view.scale,
          x: startGesture.view.x + dx,
          y: startGesture.view.y + dy,
        })
      }
    }
  }

  function end(event: React.PointerEvent<HTMLDivElement>) {
    const startGesture = gesture.current
    if (!startGesture || !pointers.current.has(event.pointerId)) return
    pointers.current.delete(event.pointerId)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (event.type === "pointercancel") {
      pointers.current.clear()
      gesture.current = null
      suppressClick.current = true
      return
    }
    if (pointers.current.size === 0) {
      const dx = event.clientX - startGesture.points[0].x
      const dy = event.clientY - startGesture.points[0].y
      if (
        !startGesture.pinched &&
        startGesture.view.scale === 1 &&
        Math.abs(dx) > 48 &&
        Math.abs(dx) > Math.abs(dy) * 1.4
      ) {
        suppressClick.current = true
        onNavigate(dx < 0 ? 1 : -1)
      }
      gesture.current = null
    } else {
      gesture.current = {
        points: [...pointers.current.values()],
        view: current.current,
        pinched: true,
      }
      suppressClick.current = true
    }
  }

  return (
    <div
      className={`relative min-h-0 w-full overflow-hidden bg-muted/20 ${
        fullScreen ? "h-full" : "aspect-[3/4]"
      }`}
    >
      {failed ? (
        <div
          className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-sm"
          role="status"
        >
          <p className="text-muted-foreground">We couldn&apos;t load this image.</p>
          <button
            type="button"
            className="px-4 py-2 text-xs uppercase tracking-wider font-medium border border-border bg-background hover:bg-muted text-foreground transition-colors rounded-none"
            onClick={() => {
              setFailed(false)
              setLoaded(false)
              setAttempt(attempt + 1)
            }}
          >
            Try again
          </button>
        </div>
      ) : (
        <div
          ref={surface}
          role="button"
          tabIndex={0}
          aria-label={`${
            view.scale > 1 ? "Reset zoom on" : "Zoom in on"
          } ${alt.toLowerCase()}`}
          aria-pressed={view.scale > 1}
          data-zoom={view.scale.toFixed(2)}
          className={`relative h-full w-full overflow-hidden select-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring ${
            view.scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
          }`}
          style={{ touchAction: fullScreen || view.scale > 1 ? "none" : "pan-y" }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onClick={(event) => {
            if (!suppressClick.current || event.detail === 0) {
              toggleZoom()
            }
            suppressClick.current = false
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              event.stopPropagation()
              toggleZoom()
            }
          }}
        >
          {!loaded && (
            <div
              className="absolute inset-0 motion-safe:animate-pulse bg-muted/40"
              role="status"
            >
              <span className="sr-only">Loading image</span>
            </div>
          )}
          <Image
            key={attempt}
            ref={image}
            src={src}
            alt={alt}
            fill
            sizes={fullScreen ? "100vw" : "(min-width: 1024px) 50vw, 100vw"}
            unoptimized
            priority={!fullScreen}
            draggable={false}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className="pointer-events-none object-contain"
            style={{
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            }}
          />
        </div>
      )}

      {/* Sleek Floating Zoom In/Out Controls - Visible Only When Zoomed In */}
      {!failed && view.scale > 1 && (
        <div
          className="absolute right-3 bottom-3 z-10 flex items-center gap-1 rounded-full bg-background/85 backdrop-blur-md border border-border/70 p-1 shadow-md transition-all"
          aria-label="Image zoom controls"
        >
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
            disabled={view.scale <= 1}
            aria-label="Zoom out"
            onClick={(e) => {
              e.stopPropagation()
              apply({ ...view, scale: view.scale - 0.5 })
            }}
          >
            <Minus size={14} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
            disabled={view.scale >= 4}
            aria-label="Zoom in"
            onClick={(e) => {
              e.stopPropagation()
              apply({ ...view, scale: view.scale + 0.5 })
            }}
          >
            <Plus size={14} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors"
            aria-label="Reset zoom"
            onClick={(e) => {
              e.stopPropagation()
              apply(INITIAL)
            }}
          >
            <RotateCcw size={14} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  )
})
