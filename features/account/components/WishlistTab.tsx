"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, Trash2, ShoppingBag, ArrowRight } from "lucide-react"
import { useWishlistStore } from "@/features/wishlist/store"
import { useCartStore } from "@/features/cart/store"
import { StoreButton } from "@/components/store/StoreButton"

export function WishlistTab() {
  const [mounted, setMounted] = React.useState(false)
  const items = useWishlistStore((state) => state.items)
  const removeItem = useWishlistStore((state) => state.removeItem)
  const clearWishlist = useWishlistStore((state) => state.clearWishlist)
  const syncWithDatabase = useWishlistStore((state) => state.syncWithDatabase)
  const isLoading = useWishlistStore((state) => state.isLoading)

  React.useEffect(() => {
    setMounted(true)
    void syncWithDatabase()
  }, [syncWithDatabase])

  if (!mounted) {
    return (
      <div className="bg-card border border-border rounded-xs p-8 shadow-xs text-center">
        <div className="h-6 w-32 bg-muted mx-auto animate-pulse rounded-xs" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xs p-10 sm:p-14 shadow-xs text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-muted/60 border border-border flex items-center justify-center mx-auto text-muted-foreground">
          <Heart className="h-6 w-6 stroke-[1.5]" />
        </div>
        <div className="space-y-1">
          <h3 className="font-heading text-xl sm:text-2xl text-foreground font-normal">
            Your Wishlist is Empty
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Save your favorite handcrafted boutique pieces, festive dresses, and co-ord sets to revisit them anytime.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/collections">
            <StoreButton className="text-xs uppercase tracking-wider h-10 px-6">
              <span>Explore Collections</span>
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </StoreButton>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-card border border-border rounded-xs p-5 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Saved Pieces ({items.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your curated wishlist across collections.
          </p>
        </div>
        <button
          type="button"
          onClick={clearWishlist}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5 cursor-pointer font-sans"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      {/* Grid of Wishlist Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {items.map((item) => (
          <div
            key={item.slug}
            className="group relative bg-card border border-border rounded-xs overflow-hidden shadow-xs flex flex-col justify-between hover:border-foreground/50 transition-colors"
          >
            {/* Image Header with Remove Button */}
            <div className="relative aspect-[3/4] w-full bg-muted overflow-hidden">
              {item.imageSrc ? (
                <Image
                  src={item.imageSrc}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  Boutique Piece
                </div>
              )}

              {/* Remove Heart Trigger */}
              <button
                type="button"
                onClick={() => removeItem(item.slug)}
                aria-label={`Remove ${item.name} from wishlist`}
                className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm border border-border/80 flex items-center justify-center text-foreground hover:bg-destructive hover:text-white hover:border-destructive transition-colors shadow-xs cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Details & CTA */}
            <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
              <div className="space-y-1">
                {item.colourName && (
                  <span className="text-[11px] font-sans text-muted-foreground block">
                    {item.colourName}
                  </span>
                )}
                <Link
                  href={`/collections/${item.slug}`}
                  className="block font-sans text-sm font-medium text-foreground hover:underline truncate"
                >
                  {item.name}
                </Link>
                <div className="font-sans font-semibold text-sm text-foreground">
                  {item.price}
                </div>
              </div>

              <div className="pt-2 border-t border-border/50 flex items-center gap-2">
                <Link
                  href={`/collections/${item.slug}`}
                  className="flex-1"
                >
                  <StoreButton
                    variant="outline"
                    className="w-full text-xs uppercase tracking-wider h-9"
                  >
                    View Piece
                  </StoreButton>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
