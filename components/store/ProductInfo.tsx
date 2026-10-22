"use client"

import * as React from "react"
import Link from "next/link"
import { Ruler, Minus, Plus, Check, Clock, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductAccordions } from "./ProductAccordions"
import { ProductTrustStrip } from "./ProductTrustStrip"
import { SizeChartModal } from "./SizeChartModal"
import { StickyAddToCart } from "./StickyAddToCart"
import { useCartStore } from "@/features/cart/store"
import { formatAED } from "@/lib/money"
import type { ProductDetail, ProductColourway, ProductVariantSize } from "@/lib/product-detail"

export interface ProductType {
  id: string
  name: string
  slug?: string
  brand?: string
  sku: string
  colour?: string
  price: string
  compareAtPrice?: string
  description?: string
  details?: Record<string, string>
  images: string[]
  sizes: Array<{
    id: string
    name: string
    sku: string
    priceFils?: number
    status?: "in_stock" | "low" | "sold_out"
    unitsLeft?: number | null
    isAvailable?: boolean
  }>
  colourways?: ProductColourway[]
}

interface ProductInfoProps {
  product: ProductDetail | ProductType
  title: string
  activeColourway?: ProductColourway | null
  onSelectColourway?: (colourway: ProductColourway) => void
}

export function ProductInfo({
  product,
  title,
  activeColourway: controlledColourway,
  onSelectColourway,
}: ProductInfoProps) {
  const colourways = (product as ProductDetail).colourways || []
  const hasMultipleColours = colourways.length > 1

  // Resolve current active colourway
  const activeColourway =
    controlledColourway || colourways[0] || null

  const currentColourName =
    activeColourway?.colourName || product.colour || ""

  // Available sizes for the active colourway
  const currentSizes: ProductVariantSize[] = React.useMemo(() => {
    if (activeColourway?.sizes && activeColourway.sizes.length > 0) {
      return activeColourway.sizes
    }
    // Fallback to product.sizes
    return (product.sizes || []).map((s, idx) => ({
      id: s.id,
      name: s.name,
      sku: s.sku,
      priceFils: s.priceFils || 9000,
      compareAtFils: null,
      status: (s.status as any) || "in_stock",
      unitsLeft: s.unitsLeft ?? null,
      isAvailable: s.isAvailable !== false,
      sort: idx,
    }))
  }, [activeColourway, product.sizes])

  // Select initial size (first available in-stock size, or first size)
  const [selectedSizeId, setSelectedSizeId] = React.useState<string>(() => {
    const firstAvailable = currentSizes.find((s) => s.isAvailable)
    return firstAvailable ? firstAvailable.id : currentSizes[0]?.id || ""
  })

  // Synchronize size selection when colourway switches
  React.useEffect(() => {
    if (currentSizes.length === 0) return

    setSelectedSizeId((prevId) => {
      // Find the name of previous size
      const prevSize = currentSizes.find((s) => s.id === prevId)
      if (prevSize && prevSize.isAvailable) {
        return prevSize.id
      }
      // If previous size doesn't exist or is sold out, select first available
      const firstAvailable = currentSizes.find((s) => s.isAvailable)
      return firstAvailable ? firstAvailable.id : currentSizes[0]?.id || ""
    })
  }, [currentSizes])

  const [quantity, setQuantity] = React.useState(1)
  const [added, setAdded] = React.useState(false)
  const [isSizeChartOpen, setIsSizeChartOpen] = React.useState(false)

  const addItem = useCartStore((state) => state.addItem)

  // Currently selected size/variant
  const selectedSize =
    currentSizes.find((s) => s.id === selectedSizeId) || currentSizes[0]

  const currentSku =
    selectedSize?.sku || activeColourway?.styleCode || product.sku
  const priceFils = selectedSize?.priceFils || 9000
  const isAvailable = selectedSize ? selectedSize.isAvailable : true
  const unitsLeft = selectedSize?.unitsLeft ?? null

  const compareAtFils = selectedSize?.compareAtFils
  const compareAtPrice =
    compareAtFils && compareAtFils > priceFils
      ? formatAED(compareAtFils)
      : product.compareAtPrice

  // Active details object for accordions
  const activeDetails = activeColourway?.details || product.details || {}
  const activeImage =
    activeColourway?.images?.[0] || product.images?.[0] || "/images/placeholder.jpg"

  const handleAddToCart = () => {
    if (!isAvailable) return

    addItem(
      {
        id: currentSku,
        variantId: selectedSize?.id || product.id,
        sku: currentSku,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug || product.id,
        colourName: currentColourName,
        sizeLabel: selectedSize?.name || "One Size",
        priceFils,
        image: activeImage,
      },
      quantity
    )

    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  // Check if Active Colourway has multiple sizes
  const hasMultipleSizes = currentSizes.length > 1

  return (
    <div className="bg-secondary/50 rounded-xs p-6 sm:p-8 lg:p-10 flex flex-col min-h-full">
      {/* Title */}
      <h1 className="font-heading text-3xl sm:text-4xl text-foreground leading-tight mb-2">
        {title}
      </h1>

      {/* Meta Bar: Brand, SKU, and single Colour label if only 1 colour exists */}
      <div className="flex flex-wrap items-center gap-y-1 mb-4 text-[13px] sm:text-sm text-muted-foreground">
        <span>by <strong className="font-medium text-foreground">{product.brand || "AR Boutique Atelier"}</strong></span>
        <span className="mx-2">•</span>
        <span>SKU: <span className="font-mono text-foreground font-medium">{currentSku}</span></span>
        {!hasMultipleColours && currentColourName && (
          <>
            <span className="mx-2">•</span>
            <span>Colour: <strong className="text-foreground font-medium">{currentColourName}</strong></span>
          </>
        )}
      </div>

      {/* Price Header */}
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-2xl sm:text-3xl font-semibold text-foreground font-sans tracking-tight">
          {formatAED(priceFils)}
        </span>
        {compareAtPrice && (
          <span className="text-sm sm:text-base text-muted-foreground line-through font-sans">
            {compareAtPrice}
          </span>
        )}
      </div>

      {/* ── Multi-Colour Switcher (Shown ONLY when product has > 1 visible colourway) ── */}
      {hasMultipleColours && (
        <div className="mb-6 pb-6 border-b border-border/60">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="font-medium text-foreground">
              Colour:{" "}
              <span className="font-normal text-muted-foreground">
                {currentColourName}
              </span>
            </span>
          </div>

          <div
            className="flex flex-wrap items-center gap-3"
            role="radiogroup"
            aria-label="Choose product colour"
          >
            {colourways.map((cw) => {
              const isSelected = activeColourway?.id === cw.id
              const isSoldOut = cw.isSoldOut

              if (cw.swatchHex) {
                return (
                  <button
                    key={cw.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`${cw.colourName}${isSoldOut ? " (Sold Out)" : ""}`}
                    onClick={() => onSelectColourway?.(cw)}
                    className={`relative w-8 h-8 rounded-full border border-border/80 transition-all flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-105"
                        : "hover:scale-105 hover:border-foreground/80"
                    } ${isSoldOut ? "opacity-60" : ""}`}
                    style={{ backgroundColor: cw.swatchHex }}
                    title={`${cw.colourName}${isSoldOut ? " - Sold Out" : ""}`}
                  >
                    {isSoldOut && (
                      <span className="absolute inset-x-0 top-1/2 h-[1.5px] bg-foreground/70 -rotate-45" />
                    )}
                  </button>
                )
              }

              // Text chip fallback for colours without hex
              return (
                <button
                  key={cw.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelectColourway?.(cw)}
                  className={`h-9 px-3.5 border text-xs font-medium rounded-none transition-colors ${
                    isSelected
                      ? "border-foreground bg-foreground text-background font-semibold"
                      : "border-input bg-background/60 text-foreground hover:border-foreground"
                  } ${isSoldOut ? "opacity-40 line-through cursor-not-allowed" : ""}`}
                >
                  {cw.colourName}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Size Picker & Size Guide ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-foreground">
            Size:{" "}
            <span className="font-normal text-muted-foreground">
              {selectedSize?.name || "One Size"}
            </span>
          </div>

          {currentSizes.length > 0 && currentSizes[0].name !== "One Size" && (
            <button
              type="button"
              onClick={() => setIsSizeChartOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors cursor-pointer"
            >
              <Ruler className="w-3.5 h-3.5" />
              Size Chart
            </button>
          )}
        </div>

        {/* Multiple sizes: show interactive square chips */}
        {hasMultipleSizes ? (
          <div
            className="flex flex-wrap gap-2.5 sm:gap-3"
            role="radiogroup"
            aria-label="Choose product size"
          >
            {currentSizes.map((s) => {
              const isSelected = s.id === selectedSizeId
              const isAvailable = s.isAvailable

              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={!isAvailable}
                  onClick={() => setSelectedSizeId(s.id)}
                  className={`min-w-[48px] h-12 px-4 flex items-center justify-center border text-xs sm:text-sm font-medium transition-colors rounded-none relative ${
                    isSelected
                      ? "border-foreground bg-foreground text-background font-semibold shadow-xs"
                      : isAvailable
                      ? "border-input bg-background/50 text-foreground hover:border-foreground cursor-pointer"
                      : "border-border/60 bg-muted/30 text-muted-foreground/60 line-through opacity-40 cursor-not-allowed"
                  }`}
                  title={!isAvailable ? `${s.name} - Sold Out` : s.name}
                >
                  {s.name}
                </button>
              )
            })}
          </div>
        ) : (
          /* Single SKU: auto-selected text label */
          <div className="text-xs text-muted-foreground py-1">
            Standard boutique fit (Free Size)
          </div>
        )}
      </div>

      {/* ── Live Scarcity & Availability Notices (ADR-026: Only N left at <= 3) ── */}
      {isAvailable && unitsLeft !== null && unitsLeft <= 3 && (
        <div className="flex items-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/25 px-3.5 py-2.5 rounded-none mb-5 animate-fade-in">
          <Clock className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Only {unitsLeft} left in stock - order soon</span>
        </div>
      )}

      {!isAvailable && (
        <div className="flex items-center gap-2 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/25 px-3.5 py-2.5 rounded-none mb-5 animate-fade-in">
          <span>This size is currently sold out in {currentColourName}.</span>
        </div>
      )}

      {/* ── Quantity & Add to Cart (Container ID for mobile sticky intersection observer) ── */}
      <div id="main-add-to-cart-container" className="mb-4">
        <div className="text-sm text-foreground mb-3 font-medium">Quantity</div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center border border-border bg-background h-12 w-28 shrink-0 rounded-none">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1 || !isAvailable}
              aria-label="Decrease quantity"
              className="flex-1 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors h-full"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="flex-1 flex items-center justify-center text-sm font-medium tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(5, q + 1))}
              disabled={quantity >= 5 || !isAvailable}
              aria-label="Increase quantity"
              className="flex-1 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors h-full"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <Button
            type="button"
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className={`flex-1 h-12 text-xs sm:text-[13px] uppercase font-semibold tracking-widest rounded-none flex items-center justify-center gap-2 transition-all ${
              !isAvailable
                ? "bg-muted text-muted-foreground border border-border cursor-not-allowed"
                : added
                ? "bg-emerald-700 text-white hover:bg-emerald-800"
                : "bg-foreground text-background hover:bg-foreground/90 active:scale-[0.99]"
            }`}
            size="lg"
          >
            {isAvailable ? (
              added ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Bag</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Bag</span>
                </>
              )
            ) : (
              <span>Sold Out</span>
            )}
          </Button>
        </div>
      </div>

      {/* Tax & Delivery Footnote */}
      <div className="text-xs text-muted-foreground mb-6">
        Prices include 5% UAE VAT. Complimentary delivery across UAE for orders over AED 500.
      </div>

      {/* Accordions (Details & Specifications, Care, Shipping) */}
      <div className="mt-4">
        <ProductAccordions
          product={{
            ...product,
            colour: currentColourName,
            details: activeDetails,
          }}
        />
        <ProductTrustStrip />
      </div>

      {/* Size Chart Modal */}
      <SizeChartModal
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
      />

      {/* ── Mobile Sticky Add-to-Bag Bar ── */}
      <StickyAddToCart
        productTitle={title}
        colourName={currentColourName}
        sizeName={selectedSize?.name || "One Size"}
        priceFils={priceFils}
        imageUrl={activeImage}
        isAvailable={isAvailable}
        unitsLeft={unitsLeft}
        targetButtonId="main-add-to-cart-container"
        onAddToCart={handleAddToCart}
        isAdded={added}
      />
    </div>
  )
}

