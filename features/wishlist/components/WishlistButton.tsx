"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Heart, Lock } from "lucide-react"
import { useWishlistStore } from "../store"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { StoreButton } from "@/components/store/StoreButton"

interface WishlistButtonProps {
  product: {
    productId: string
    slug: string
    name: string
    price: string
    imageSrc: string
    colourName?: string
  }
  className?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function WishlistButton({
  product,
  className,
  size = "md",
  showText = false,
}: WishlistButtonProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [mounted, setMounted] = React.useState(false)
  const [showAuthModal, setShowAuthModal] = React.useState(false)
  const [isPending, setIsPending] = React.useState(false)

  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product.slug))
  const toggleItem = useWishlistStore((state) => state.toggleItem)
  const syncWithDatabase = useWishlistStore((state) => state.syncWithDatabase)
  const isInitialized = useWishlistStore((state) => state.isInitialized)

  React.useEffect(() => {
    setMounted(true)
    if (!isInitialized) {
      void syncWithDatabase()
    }
  }, [isInitialized, syncWithDatabase])

  const isFavorited = mounted && isInWishlist

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isPending) return
    setIsPending(true)

    try {
      const res = await toggleItem(product)
      if (res.requiresAuth) {
        setShowAuthModal(true)
      }
    } finally {
      setIsPending(false)
    }
  }

  const handleSignInRedirect = () => {
    setShowAuthModal(false)
    const currentUrl = pathname || "/"
    router.push(`/sign-in?redirect=${encodeURIComponent(currentUrl)}`)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={isFavorited ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        className={cn(
          "group relative flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
          showText ? "gap-2" : "",
          className
        )}
      >
        <Heart
          className={cn(
            iconSizes[size],
            "transition-all duration-200",
            isFavorited
              ? "fill-foreground text-foreground scale-110"
              : "text-foreground/80 group-hover:text-foreground group-hover:scale-110"
          )}
          strokeWidth={1.5}
        />
        {showText && (
          <span className="text-xs uppercase tracking-wider font-medium">
            {isFavorited ? "Saved in Wishlist" : "Save to Wishlist"}
          </span>
        )}
      </button>

      {/* Auth Prompt Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="max-w-[420px] p-6 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 border border-border text-foreground">
            <Lock className="h-5 w-5 stroke-[1.5]" />
          </div>

          <DialogHeader className="space-y-1.5 text-center sm:text-center">
            <DialogTitle className="font-heading text-xl sm:text-2xl font-normal text-foreground">
              Sign In to Save
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Please sign in to your AR Boutique account to save your favorite garments and access your wishlist across all your devices.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <StoreButton
              variant="outline"
              onClick={() => setShowAuthModal(false)}
              className="flex-1 text-xs uppercase tracking-wider h-10"
            >
              Cancel
            </StoreButton>
            <StoreButton
              onClick={handleSignInRedirect}
              className="flex-1 text-xs uppercase tracking-wider h-10"
            >
              Sign In
            </StoreButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
