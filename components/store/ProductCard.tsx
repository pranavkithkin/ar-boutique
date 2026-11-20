"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus } from "lucide-react"
import { QuickAddModal } from "./QuickAddModal"
import { WishlistButton } from "@/features/wishlist/components/WishlistButton"

import type { ProductVariantSize } from "@/lib/products"
import type { ProductOfferTag } from "@/features/offers/types"
import { OfferTagLink } from "./OfferTagLink"

export interface ProductCardProps {
  name: string
  price: string
  imageSrc: string
  href: string
  brand?: string
  compareAtPrice?: string
  sizes?: ProductVariantSize[]
  sku?: string
  offerTags?: ProductOfferTag[]
}

export function ProductCard({
  name,
  price,
  imageSrc,
  href,
  brand,
  compareAtPrice,
  sizes,
  sku,
  offerTags = [],
}: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [activeBadgeIndex, setActiveBadgeIndex] = React.useState(0)
  const saleBadgeCount = compareAtPrice ? 1 : 0
  const badgeCount = saleBadgeCount + offerTags.length
  const displayedBadgeIndex = badgeCount ? activeBadgeIndex % badgeCount : 0

  React.useEffect(() => {
    if (badgeCount < 2) return

    const timer = window.setInterval(() => {
      setActiveBadgeIndex(index => (index + 1) % badgeCount)
    }, 4000)

    return () => window.clearInterval(timer)
  }, [badgeCount])

  // Extract slug from href e.g. /collections/dress-j0395 -> dress-j0395
  const slug = href.replace(/^\/collections\//, "").replace(/^\//, "")

  // Calculate discount percentage if both price and compareAtPrice are numeric
  const discountPercent = React.useMemo(() => {
    if (!compareAtPrice) return null
    const p = parseFloat(price.replace(/[^0-9.]/g, ""))
    const c = parseFloat(compareAtPrice.replace(/[^0-9.]/g, ""))
    if (!isNaN(p) && !isNaN(c) && c > p && p > 0) {
      return Math.round(((c - p) / c) * 100)
    }
    return null
  }, [price, compareAtPrice])

  return (
    <>
      <div className="group relative flex flex-col w-full">
        {/* Image container and badges */}
        <div className="relative w-full">
          <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted rounded-lg">
            <Image
              src={imageSrc}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              unoptimized
            />
          </div>

          {badgeCount > 0 && (
            <div className="absolute bottom-2.5 left-2.5 z-20 max-w-[calc(100%-1.25rem)] sm:bottom-3 sm:left-3">
              {compareAtPrice && displayedBadgeIndex === 0 ? (
                <span
                  key="sale-badge"
                  className="inline-flex max-w-full items-center px-2 py-0.5 text-[10px] sm:text-[11px] font-sans font-semibold uppercase tracking-wider bg-destructive text-destructive-foreground rounded-xs shadow-xs animate-in fade-in-0 slide-in-from-bottom-1 duration-300 motion-reduce:animate-none"
                >
                  {discountPercent ? `Sale -${discountPercent}%` : "Sale"}
                </span>
              ) : offerTags[displayedBadgeIndex - saleBadgeCount] ? (
                <OfferTagLink
                  key={offerTags[displayedBadgeIndex - saleBadgeCount].slug}
                  tag={offerTags[displayedBadgeIndex - saleBadgeCount]}
                  className="block max-w-full min-w-0 animate-in fade-in-0 slide-in-from-bottom-1 duration-300 motion-reduce:animate-none"
                />
              ) : null}
            </div>
          )}

          {/* Wishlist Heart Button */}
          <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10">
            <WishlistButton
              product={{
                productId: slug,
                slug,
                name,
                price,
                imageSrc,
              }}
              size="sm"
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-background/85 backdrop-blur-sm text-foreground shadow-xs hover:bg-background"
            />
          </div>

          {/* Quick Add Plus Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsModalOpen(true)
            }}
            aria-label={`Quick add ${name} to bag`}
            className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-background/85 backdrop-blur-sm text-foreground shadow-xs transition-transform hover:scale-105 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-5 w-5 opacity-90" strokeWidth={1.5} />
          </button>
        </div>

        {/* Text Content */}
        <div className="flex flex-col gap-0.5 pt-3">
          {brand && (
            <span className="text-[13px] text-muted-foreground font-sans">
              {brand}
            </span>
          )}
          <div className="mt-0.5 relative z-10">
            <h3
              className="font-sans text-[15px] sm:text-[16px] font-medium leading-tight truncate text-foreground pointer-events-none"
              title={name}
            >
              {name}
            </h3>
          </div>
          <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
            <span className="text-[15px] sm:text-[16px] font-bold text-foreground font-sans">
              {price}
            </span>
            {compareAtPrice && (
              <>
                <span className="text-[13px] sm:text-[14px] text-muted-foreground line-through font-sans">
                  {compareAtPrice}
                </span>
                <span className="text-[11px] font-sans font-semibold text-destructive">
                  {discountPercent ? `Save ${discountPercent}%` : "Sale"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* The main hit area link */}
        <Link
          href={href}
          className="absolute inset-0 z-[1] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`View ${name}`}
        >
          <span className="sr-only">View {name}</span>
        </Link>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        slug={slug}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialName={name}
        initialPrice={price}
        initialImageSrc={imageSrc}
        initialSizes={sizes}
        initialSku={sku}
      />
    </>
  )
}
