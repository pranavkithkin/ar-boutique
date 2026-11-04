"use client"

import * as React from "react"
import { ProductDetail, ProductColourway } from "@/lib/product-detail"
import { SyncScrollLayout } from "./SyncScrollLayout"
import { ProductGallery } from "./ProductGallery"
import { ProductInfo } from "./ProductInfo"

interface ProductDetailViewProps {
  product: ProductDetail
  initialColourSlug?: string
  reviewSummary?: {
    averageRating: number
    totalCount: number
  }
}

export function ProductDetailView({
  product,
  initialColourSlug,
  reviewSummary,
}: ProductDetailViewProps) {
  // Find matching initial colourway or default to first
  const initialColourway = React.useMemo(() => {
    if (initialColourSlug && product.colourways && product.colourways.length > 0) {
      const match = product.colourways.find(
        (cw) =>
          cw.colourSlug.toLowerCase() === initialColourSlug.toLowerCase() ||
          cw.colourName.toLowerCase() === initialColourSlug.toLowerCase()
      )
      if (match) return match
    }
    return product.colourways?.[0] || null
  }, [product.colourways, initialColourSlug])

  const [activeColourway, setActiveColourway] = React.useState<ProductColourway | null>(
    initialColourway
  )

  // Keep in sync if initialColourway changes via SSR navigation
  React.useEffect(() => {
    if (initialColourway) {
      setActiveColourway(initialColourway)
    }
  }, [initialColourway])

  const handleSelectColourway = React.useCallback(
    (cw: ProductColourway) => {
      setActiveColourway(cw)

      // Update URL query ?colour= without full page re-render
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        url.searchParams.set("colour", cw.colourSlug)
        window.history.replaceState({}, "", url.toString())
      }
    },
    []
  )

  const currentColourway = activeColourway || product.colourways?.[0]
  const galleryImages = currentColourway?.images || product.images

  return (
    <SyncScrollLayout
      left={<ProductGallery images={galleryImages} />}
      right={
        <ProductInfo
          product={product}
          title={product.name}
          activeColourway={currentColourway}
          onSelectColourway={handleSelectColourway}
          reviewSummary={reviewSummary}
        />
      }
    />
  )
}
