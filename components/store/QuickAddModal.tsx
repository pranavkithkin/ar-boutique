"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, Minus, Plus, Loader2, ArrowRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StoreButton } from "@/components/store/StoreButton"
import { useCartStore } from "@/features/cart/store"
import { formatAED } from "@/lib/money"
import type { ProductDetail } from "@/lib/product-detail"

interface QuickAddModalProps {
  slug: string
  isOpen: boolean
  onClose: () => void
  initialName?: string
  initialPrice?: string
  initialImageSrc?: string
  initialSizes?: Array<{ id: string; name: string; sku: string; priceFils: number; stock?: number }>
  initialSku?: string
}

export function QuickAddModal({
  slug,
  isOpen,
  onClose,
  initialName,
  initialPrice,
  initialImageSrc,
  initialSizes,
  initialSku,
}: QuickAddModalProps) {
  const [product, setProduct] = React.useState<ProductDetail | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [selectedSizeId, setSelectedSizeId] = React.useState<string>(
    initialSizes && initialSizes.length > 0 ? initialSizes[0].id : ""
  )
  const [quantity, setQuantity] = React.useState(1)
  const [added, setAdded] = React.useState(false)

  const addItem = useCartStore((state) => state.addItem)

  // Initialize selected size when initialSizes are supplied
  React.useEffect(() => {
    if (initialSizes && initialSizes.length > 0 && !selectedSizeId) {
      setSelectedSizeId(initialSizes[0].id)
    }
  }, [initialSizes, selectedSizeId])

  // Fetch full details only if initialSizes are not provided or for extra details
  React.useEffect(() => {
    if (!isOpen || !slug) return

    let cancelled = false
    setAdded(false)
    setQuantity(1)

    // If initial sizes already exist, we don't block the UI with loading
    if (!initialSizes || initialSizes.length === 0) {
      setLoading(true)
    }

    fetch(`/api/products/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Product fetch failed")
        return res.json()
      })
      .then((data: ProductDetail) => {
        if (!cancelled && data) {
          setProduct(data)
          if (!selectedSizeId && data.sizes && data.sizes.length > 0) {
            setSelectedSizeId(data.sizes[0].id)
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching product modal data:", err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, slug, initialSizes, selectedSizeId])

  // Available sizes from either full product or initial preloaded sizes
  const availableSizes =
    product?.sizes && product.sizes.length > 0
      ? product.sizes
      : initialSizes && initialSizes.length > 0
      ? initialSizes
      : []

  // Selected variant details
  const selectedSize =
    availableSizes.find((s) => s.id === selectedSizeId) || availableSizes[0]
  const currentSku = selectedSize?.sku || product?.sku || initialSku || ""
  const priceFils = selectedSize?.priceFils || (initialSizes?.[0]?.priceFils ?? 9000)

  const handleAddToCart = () => {
    const itemSku = currentSku || slug
    const itemName = product?.name || initialName || "Product"
    const itemImage = product?.images?.[0] || initialImageSrc || "/images/placeholder.jpg"

    addItem(
      {
        id: itemSku,
        variantId: selectedSize?.id || product?.id || slug,
        sku: itemSku,
        productId: product?.id || slug,
        productName: itemName,
        productSlug: product?.slug || slug,
        colourName: product?.colour || "",
        sizeLabel: selectedSize?.name || "One Size",
        priceFils,
        image: itemImage,
      },
      quantity
    )

    setAdded(true)
    setTimeout(() => {
      setAdded(false)
      onClose()
    }, 1000)
  }

  // Display values
  const displayName = product?.name || initialName || "Ensemble"
  const displayImage = product?.images?.[0] || initialImageSrc || "/images/placeholder.jpg"
  const displayPrice = product ? formatAED(priceFils) : initialPrice || "AED 90.00"
  const displayBrand = product?.brand || "AR Boutique Exclusive"

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-[calc(100%-1.5rem)] sm:max-w-xl max-h-[90vh] p-0 flex flex-col overflow-hidden bg-background border border-border rounded-xs shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-6 pb-3 border-b border-border/60 shrink-0 pr-12">
          <DialogTitle className="font-heading text-lg sm:text-xl font-normal text-foreground">
            Quick Add to Bag
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content Body - ALWAYS show product preview instantly */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div className="flex flex-col sm:grid sm:grid-cols-12 gap-5 sm:gap-6 items-start">
            {/* Product Header row on mobile (Thumbnail + Title side by side on small screens) */}
            <div className="w-full sm:col-span-5 flex sm:flex-col gap-4 sm:gap-0">
              <div className="relative w-24 sm:w-full aspect-[2/3] bg-muted/40 rounded-xs overflow-hidden border border-border/50 shrink-0">
                <Image
                  src={displayImage}
                  alt={displayName}
                  fill
                  sizes="(max-width: 640px) 96px, 220px"
                  className="object-cover object-top"
                  unoptimized
                />
              </div>

              {/* Mobile-only compact metadata next to thumbnail */}
              <div className="sm:hidden flex-1 flex flex-col justify-center min-w-0">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  {displayBrand}
                </span>
                <h3 className="font-heading text-lg text-foreground font-normal leading-tight line-clamp-2">
                  {displayName}
                </h3>
                <div className="text-base font-bold text-foreground font-sans mt-1">
                  {displayPrice}
                </div>
                {product?.colour && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Colour: <span className="text-foreground">{product.colour}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Desktop Details & Selectors */}
            <div className="w-full sm:col-span-7 flex flex-col justify-between space-y-4">
              {/* Desktop metadata */}
              <div className="hidden sm:block space-y-1.5">
                <span className="text-xs text-muted-foreground tracking-wider uppercase font-sans">
                  {displayBrand}
                </span>
                <h3 className="font-heading text-2xl text-foreground font-normal leading-tight">
                  {displayName}
                </h3>
                <div className="text-lg font-bold text-foreground font-sans">
                  {displayPrice}
                </div>
                {product?.colour && (
                  <p className="text-xs text-muted-foreground">
                    Colour: <span className="text-foreground font-medium">{product.colour}</span>
                  </p>
                )}
                {currentSku && (
                  <p className="text-[11px] font-mono text-muted-foreground/75">
                    SKU: {currentSku}
                  </p>
                )}
              </div>

              {/* Sizes */}
              <div className="space-y-2 pt-1 border-t sm:border-t-0 border-border/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground font-medium">Select Size:</span>
                  {selectedSize ? (
                    <span className="text-muted-foreground">{selectedSize.name}</span>
                  ) : loading ? (
                    <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Loading sizes...
                    </span>
                  ) : null}
                </div>

                {availableSizes.length > 0 && availableSizes[0].name !== "One Size" ? (
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((s) => {
                      const isSelected = s.id === selectedSizeId
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedSizeId(s.id)}
                          className={`h-9 sm:h-10 px-3.5 text-xs font-medium rounded-xs border transition-colors ${
                            isSelected
                              ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                              : "bg-background text-foreground border-border hover:border-foreground"
                          }`}
                        >
                          {s.name}
                        </button>
                      )
                    })}
                  </div>
                ) : loading ? (
                  <div className="flex gap-2 animate-pulse">
                    <div className="h-9 w-14 bg-muted rounded-xs" />
                    <div className="h-9 w-14 bg-muted rounded-xs" />
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Standard Fit (One Size)</div>
                )}
              </div>

              {/* Quantity */}
              <div className="space-y-2 pt-1">
                <span className="text-xs text-foreground font-medium">Quantity:</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-border bg-background rounded-xs h-10 w-28">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                      className="flex-1 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors h-full"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="flex-1 flex items-center justify-center text-xs font-semibold tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(5, q + 1))}
                      disabled={quantity >= 5}
                      aria-label="Increase quantity"
                      className="flex-1 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors h-full"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Dynamic Stock Indicator per ADR-026: 'In Stock' if > 3, 'Only N left' if <= 3 */}
                  {(() => {
                    const stock = selectedSize?.stock ?? 5
                    if (stock <= 0) {
                      return (
                        <span className="text-[11px] font-medium text-destructive flex items-center gap-1.5 bg-destructive/10 px-2.5 py-1 rounded-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                          Sold out
                        </span>
                      )
                    }
                    if (stock <= 3) {
                      return (
                        <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Only {stock} left
                        </span>
                      )
                    }
                    return (
                      <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        In Stock
                      </span>
                    )
                  })()}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2.5 pt-3 border-t border-border/40 sm:border-t-0">
                <StoreButton
                  onClick={handleAddToCart}
                  className="w-full h-11 sm:h-12 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Added to Bag</span>
                    </>
                  ) : (
                    <span>Add to Bag</span>
                  )}
                </StoreButton>

                <Link
                  href={`/collections/${slug}`}
                  onClick={onClose}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 py-1"
                >
                  <span>View Full Product Details</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
