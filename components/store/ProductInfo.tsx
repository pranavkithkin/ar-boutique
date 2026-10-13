"use client"

import * as React from "react"
import Link from "next/link"
import { Ruler, Minus, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductAccordions } from "./ProductAccordions"
import { ProductTrustStrip } from "./ProductTrustStrip"
import { useCartStore } from "@/features/cart/store"
import { formatAED } from "@/lib/money"

import { SizeChartModal } from "./SizeChartModal"

export interface ProductType {
  id: string
  name: string
  brand?: string
  sku: string
  colour?: string
  price: string
  compareAtPrice?: string
  description?: string
  details?: Record<string, string>
  images: string[]
  sizes: Array<{ id: string; name: string; sku: string; priceFils?: number }>
}

interface ProductInfoProps {
  product: ProductType
  title: string
}

export function ProductInfo({ product, title }: ProductInfoProps) {
  // If sizes exist, default to the first available size
  const [selectedSizeId, setSelectedSizeId] = React.useState<string>(() => {
    return product.sizes[0]?.id || ""
  })
  const [quantity, setQuantity] = React.useState(1)
  const [added, setAdded] = React.useState(false)
  const [isSizeChartOpen, setIsSizeChartOpen] = React.useState(false)

  const addItem = useCartStore((state) => state.addItem)

  // Find currently selected variant/size
  const selectedSize = product.sizes.find((s) => s.id === selectedSizeId) || product.sizes[0]
  const currentSku = selectedSize?.sku || product.sku
  const priceFils = selectedSize?.priceFils || 9000

  const handleAddToCart = () => {
    addItem(
      {
        id: currentSku,
        variantId: selectedSize?.id || product.id,
        sku: currentSku,
        productId: product.id,
        productName: product.name,
        productSlug: product.id, // Or slug
        colourName: product.colour || "",
        sizeLabel: selectedSize?.name || "One Size",
        priceFils,
        image: product.images[0] || "/images/placeholder.jpg",
      },
      quantity
    )

    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="bg-secondary/50 rounded-lg p-6 sm:p-8 lg:p-10 flex flex-col min-h-full">
      <h1 className="font-heading text-3xl sm:text-4xl text-foreground leading-tight mb-3">
        {title}
      </h1>

      <div className="flex items-center justify-between mb-4 text-[13px] sm:text-sm">
        <div className="text-muted-foreground">
          by <Link href="#" className="text-primary hover:underline">{product.brand}</Link>
          <span className="mx-2">|</span>
          SKU: <span className="font-mono text-foreground">{currentSku}</span>
          {product.colour && (
            <>
              <span className="mx-2">|</span>
              Colour: <span className="text-foreground">{product.colour}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-foreground font-sans">
            {formatAED(priceFils)}
          </span>
          {product.compareAtPrice && (
            <span className="text-sm text-muted-foreground line-through font-sans">
              {product.compareAtPrice}
            </span>
          )}
        </div>
      </div>

      {/* Size Chart Button */}
      {product.sizes.length > 0 && product.sizes[0].name !== "One Size" && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setIsSizeChartOpen(true)}
            className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-xs text-xs sm:text-sm font-medium hover:bg-foreground/90 transition-colors cursor-pointer"
          >
            <Ruler className="w-4 h-4" />
            Size Chart
          </button>
        </div>
      )}

      {/* Sizes Selection */}
      {product.sizes.length > 0 && product.sizes[0].name !== "One Size" && (
        <div className="mb-8">
          <div className="text-sm text-foreground mb-3">
            Size: <span className="font-medium">{selectedSize?.name}</span>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {product.sizes.map((s) => {
              const isSelected = s.id === selectedSizeId
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSizeId(s.id)}
                  className={`flex h-10 px-3 sm:px-4 items-center justify-center border text-[13px] sm:text-sm font-medium transition-colors rounded-xs
                    ${
                      isSelected
                        ? "border-foreground bg-foreground text-background shadow-xs font-semibold"
                        : "border-border bg-background/50 text-foreground hover:border-foreground"
                    }
                  `}
                >
                  {s.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Quantity & Add to Cart */}
      <div className="mb-4">
        <div className="text-sm text-foreground mb-3">Quantity</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-border bg-background h-12 w-28 shrink-0 rounded-xs">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="flex-1 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors h-full"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="flex-1 flex items-center justify-center text-sm font-medium tabular-nums">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => Math.min(5, q + 1))}
              disabled={quantity >= 5}
              aria-label="Increase quantity"
              className="flex-1 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors h-full"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={handleAddToCart}
            className="flex-1 h-12 text-[14px] uppercase tracking-widest rounded-xs flex items-center justify-center gap-2"
            size="lg"
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added to Bag</span>
              </>
            ) : (
              <span>Add to Cart</span>
            )}
          </Button>
        </div>
      </div>

      {/* Tax Note */}
      <div className="text-[13px] text-muted-foreground mb-4">
        Tax included (5% UAE VAT). Free shipping calculated at checkout.
      </div>

      <div className="mt-6">
        <ProductAccordions product={product} />
        <ProductTrustStrip />
      </div>

      <SizeChartModal
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
      />
    </div>
  )
}
