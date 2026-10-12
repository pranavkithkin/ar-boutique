"use client"

import * as React from "react"
import Image from "next/image"
import { Minus, Plus, RotateCcw } from "lucide-react"

type Point = { x: number; y: number }
type View = Point & { scale: number }
type Gesture = { points: Point[]; view: View; pinched: boolean }
const INITIAL: View = { x: 0, y: 0, scale: 1 }
const control = "flex h-11 w-11 items-center justify-center border border-input bg-background text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40"
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
const middle = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

export function ZoomableProductImage({ src, alt, onNavigate, fullScreen = false }: {
  src: string
  alt: string
  onNavigate: (direction: number) => void
  fullScreen?: boolean
}) {
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
    const ratio = photo?.naturalWidth && photo.naturalHeight ? photo.naturalWidth / photo.naturalHeight : width / (height || 1)
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
  }

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
    const start = gesture.current
    if (points.length >= 2 && start.points.length >= 2) {
      const ratio = distance(points[0], points[1]) / Math.max(1, distance(start.points[0], start.points[1]))
      const scale = Math.min(4, Math.max(1, start.view.scale * ratio))
      const factor = scale / start.view.scale
      const box = event.currentTarget.getBoundingClientRect()
      const before = middle(start.points[0], start.points[1])
      const after = middle(points[0], points[1])
      apply({
        scale,
        x: after.x - box.left - box.width / 2 - (before.x - box.left - box.width / 2 - start.view.x) * factor,
        y: after.y - box.top - box.height / 2 - (before.y - box.top - box.height / 2 - start.view.y) * factor,
      })
      suppressClick.current = true
    } else if (points.length === 1 && start.points.length === 1) {
      const dx = points[0].x - start.points[0].x
      const dy = points[0].y - start.points[0].y
      if (Math.hypot(dx, dy) > 8) suppressClick.current = true
      if (start.view.scale > 1) apply({ scale: start.view.scale, x: start.view.x + dx, y: start.view.y + dy })
    }
  }

  function end(event: React.PointerEvent<HTMLDivElement>) {
    const start = gesture.current
    if (!start || !pointers.current.has(event.pointerId)) return
    pointers.current.delete(event.pointerId)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (event.type === "pointercancel") {
      pointers.current.clear()
      gesture.current = null
      suppressClick.current = true
      return
    }
    if (pointers.current.size === 0) {
      const dx = event.clientX - start.points[0].x
      const dy = event.clientY - start.points[0].y
      if (!start.pinched && start.view.scale === 1 && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        suppressClick.current = true
        onNavigate(dx < 0 ? 1 : -1)
      }
      gesture.current = null
    } else {
      gesture.current = { points: [...pointers.current.values()], view: current.current, pinched: true }
      suppressClick.current = true
    }
  }

  function toggleZoom() {
    apply(current.current.scale > 1 ? INITIAL : { ...INITIAL, scale: 2 })
  }

  return (
    <div className={`relative min-h-0 w-full overflow-hidden bg-muted ${fullScreen ? "h-full" : "aspect-[3/4]"}`}>
      {failed ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center" role="status">
          <p>We couldn&apos;t load this image.</p>
          <button type="button" className={`${control} w-auto px-4`} onClick={() => { setFailed(false); setLoaded(false); setAttempt(attempt + 1) }}>Try again</button>
        </div>
      ) : (
        <div
          ref={surface}
          role="button"
          tabIndex={0}
          aria-label={`${view.scale > 1 ? "Reset zoom on" : "Zoom in on"} ${alt.toLowerCase()}`}
          aria-pressed={view.scale > 1}
          data-zoom={view.scale.toFixed(2)}
          className={`relative h-full w-full overflow-hidden select-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring ${view.scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
          style={{ touchAction: fullScreen || view.scale > 1 ? "none" : "pan-y" }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onClick={(event) => { if (!suppressClick.current || event.detail === 0) toggleZoom(); suppressClick.current = false }}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); toggleZoom() } }}
        >
          {!loaded && <div className="absolute inset-0 motion-safe:animate-pulse bg-muted" role="status"><span className="sr-only">Loading image</span></div>}
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
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
          />
        </div>
      )}
      {!failed && (
        <div className="absolute right-2 bottom-2 flex gap-1" aria-label="Image zoom controls">
          <button type="button" className={control} disabled={view.scale <= 1} aria-label="Zoom out" onClick={() => apply({ ...view, scale: view.scale - 0.5 })}><Minus size={18} strokeWidth={1.5} /></button>
          <button type="button" className={control} disabled={view.scale >= 4} aria-label="Zoom in" onClick={() => apply({ ...view, scale: view.scale + 0.5 })}><Plus size={18} strokeWidth={1.5} /></button>
          <button type="button" className={control} disabled={view.scale === 1} aria-label="Reset zoom" onClick={() => apply(INITIAL)}><RotateCcw size={18} strokeWidth={1.5} /></button>
        </div>
      )}
    </div>
  )
}
