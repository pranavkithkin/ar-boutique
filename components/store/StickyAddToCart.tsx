"use client"

import * as React from "react"
import Image from "next/image"
import { ShoppingBag, Check, Clock } from "lucide-react"
import { formatAED } from "@/lib/money"
import { cn } from "@/lib/utils"

interface StickyAddToCartProps {
  productTitle: string
  colourName: string
  sizeName: string
  priceFils: number
  imageUrl: string
  isAvailable: boolean
  unitsLeft: number | null
  targetButtonId?: string
  onAddToCart: () => void
  isAdded: boolean
}

export function StickyAddToCart({
  productTitle,
  colourName,
  sizeName,
  priceFils,
  imageUrl,
  isAvailable,
  unitsLeft,
  targetButtonId = "main-add-to-cart-container",
  onAddToCart,
  isAdded,
}: StickyAddToCartProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const target = document.getElementById(targetButtonId)
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when the main button scrolls above the viewport
        const isPastMainButton =
          !entry.isIntersecting && entry.boundingClientRect.top < 0
        setIsVisible(isPastMainButton)
      },
      {
        threshold: 0,
        rootMargin: "0px",
      }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [targetButtonId])

  return (
    <aside
      aria-label="Quick add to cart"
      className={cn(
        "sm:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-border p-3 shadow-2xl transition-transform duration-300 ease-in-out",
        isVisible ? "translate-y-0" : "translate-y-full pointer-events-none"
      )}
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))" }}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Thumbnail & Product Details */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-11 h-14 bg-muted/30 shrink-0 overflow-hidden border border-border/60">
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="44px"
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-medium text-foreground truncate max-w-[140px]">
              {productTitle}
            </h3>
            <p className="text-[11px] text-muted-foreground truncate">
              {colourName} {sizeName && `• ${sizeName}`}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-semibold text-foreground font-sans">
                {formatAED(priceFils)}
              </span>
              {unitsLeft && unitsLeft <= 3 && isAvailable && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                  <Clock className="w-2.5 h-2.5" />
                  Only {unitsLeft} left
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!isAvailable || isAdded}
          className={cn(
            "h-10 px-4 text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 flex items-center justify-center gap-1.5 rounded-none",
            isAvailable
              ? isAdded
                ? "bg-emerald-700 text-white"
                : "bg-foreground text-background hover:bg-foreground/90 active:scale-[0.98]"
              : "bg-muted text-muted-foreground cursor-not-allowed border border-border"
          )}
        >
          {isAvailable ? (
            isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Added
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                Add to Bag
              </>
            )
          ) : (
            "Sold Out"
          )}
        </button>
      </div>
    </aside>
  )
}
