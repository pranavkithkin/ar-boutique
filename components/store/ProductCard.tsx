"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus } from "lucide-react"
import { QuickAddModal } from "./QuickAddModal"
import { WishlistButton } from "@/features/wishlist/components/WishlistButton"

import type { ProductVariantSize } from "@/lib/products"

export interface ProductCardProps {
  name: string
  price: string
  imageSrc: string
  href: string
  brand?: string
  compareAtPrice?: string
  sizes?: ProductVariantSize[]
  sku?: string
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
}: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  // Extract slug from href e.g. /collections/dress-j0395 -> dress-j0395
  const slug = href.replace(/^\/collections\//, "").replace(/^\//, "")

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
              <span className="text-[13px] sm:text-[14px] text-muted-foreground line-through font-sans">
                {compareAtPrice}
              </span>
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
