"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react"
import { useCartStore } from "@/features/cart/store"
import {
  formatAED,
  calculateVatPortion,
  calculateDeliveryEstimate,
  FREE_DELIVERY_MINIMUM_LABEL,
} from "@/lib/money"
import { StoreButton } from "@/components/store/StoreButton"

export function CartView() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotalFils,
  } = useCartStore()

  // Wait for client mount to avoid hydration mismatch
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="py-24 text-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-muted rounded-full" />
          <div className="h-6 w-48 bg-muted rounded" />
        </div>
      </div>
    )
  }

  const subtotalFils = getSubtotalFils()
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const { isFreeShipping, deliveryFeeFils, remainingFils, progressPercent } =
    calculateDeliveryEstimate(subtotalFils, items.length > 0)
  const estimatedTotalFils = subtotalFils + deliveryFeeFils
  const vatPortionFils = calculateVatPortion(estimatedTotalFils)

  if (items.length === 0) {
    return (
      <div className="py-20 sm:py-28 flex flex-col items-center justify-center text-center max-w-lg mx-auto px-4">
        <div className="w-20 h-20 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-6">
          <ShoppingBag className="w-10 h-10 stroke-[1.25]" />
        </div>
        <h2 className="font-heading text-3xl sm:text-4xl text-foreground font-normal mb-3">
          Your Shopping Bag is Empty
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-md">
          Discover our curated collection of luxury artisanal ensembles crafted with exquisite hand-embroidery and timeless fabrics.
        </p>
        <Link href="/collections">
          <StoreButton className="px-8 h-12 uppercase tracking-widest text-xs">
            Explore Collections
          </StoreButton>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
      {/* Left: Cart Items List (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-baseline justify-between pb-4 border-b border-border">
          <h2 className="font-heading text-2xl text-foreground">
            Items ({totalItemCount})
          </h2>
          <button
            onClick={clearCart}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            Clear Bag
          </button>
        </div>

        <div className="divide-y divide-border/60">
          {items.map((item) => (
            <div key={item.sku} className="py-6 first:pt-2 flex gap-5 sm:gap-6">
              {/* Product Thumbnail */}
              <div className="relative w-24 sm:w-28 h-32 sm:h-36 bg-muted/30 shrink-0 overflow-hidden rounded-xs border border-border/60">
                <Image
                  src={item.image}
                  alt={item.productName}
                  fill
                  sizes="(max-width: 640px) 96px, 112px"
                  className="object-cover object-top"
                  unoptimized={item.image.startsWith("http")}
                />
              </div>

              {/* Product Details */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/collections/${item.productSlug}`}
                      className="font-heading text-lg sm:text-xl text-foreground hover:opacity-75 transition-opacity line-clamp-1"
                    >
                      {item.productName}
                    </Link>
                    <button
                      onClick={() => removeItem(item.sku)}
                      aria-label={`Remove ${item.productName} from bag`}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Attributes */}
                  <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                    {item.colourName && (
                      <span>Colour: <span className="text-foreground">{item.colourName}</span></span>
                    )}
                    {item.colourName && item.sizeLabel && <span>•</span>}
                    {item.sizeLabel && (
                      <span>Size: <span className="text-foreground">{item.sizeLabel}</span></span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-muted-foreground/75">
                    SKU: {item.sku}
                  </div>
                </div>

                {/* Stepper & Price */}
                <div className="flex items-center justify-between pt-4 mt-auto">
                  <div className="flex items-center border border-border bg-background rounded-xs">
                    <button
                      onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                      className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-xs font-semibold tabular-nums text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                      disabled={item.quantity >= 5}
                      aria-label="Increase quantity"
                      className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-base sm:text-lg font-semibold text-foreground tabular-nums font-sans">
                      {formatAED(item.priceFils * item.quantity)}
                    </div>
                    {item.quantity > 1 && (
                      <div className="text-[11px] text-muted-foreground tabular-nums">
                        {formatAED(item.priceFils)} each
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Confidence Badges */}
        <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border/60">
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xs">
            <Truck className="w-4 h-4 text-primary shrink-0" />
            <div className="text-xs">
              <span className="font-medium text-foreground block">Free UAE Delivery</span>
              <span className="text-muted-foreground text-[11px]">On orders of {FREE_DELIVERY_MINIMUM_LABEL}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xs">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <div className="text-xs">
              <span className="font-medium text-foreground block">100% Authentic</span>
              <span className="text-muted-foreground text-[11px]">Direct from our atelier</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xs">
            <RotateCcw className="w-4 h-4 text-primary shrink-0" />
            <div className="text-xs">
              <span className="font-medium text-foreground block">Easy Returns</span>
              <span className="text-muted-foreground text-[11px]">7 days return policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Order Summary Card (5 cols) */}
      <div className="lg:col-span-5 bg-card border border-border p-6 sm:p-8 rounded-xs shadow-xs space-y-6 lg:sticky lg:top-28">
        <h3 className="font-heading text-2xl text-foreground pb-4 border-b border-border/80">
          Order Summary
        </h3>

        {/* Free Shipping Progress Indicator */}
        <div className="bg-secondary/40 p-4 rounded-xs border border-border/40 space-y-2">
          <div className="flex justify-between text-xs">
            {isFreeShipping ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                You have unlocked free UAE delivery!
              </span>
            ) : (
              <span className="text-muted-foreground">
                Add <span className="font-semibold text-foreground">{formatAED(remainingFils)}</span> more for Free Delivery
              </span>
            )}
            <span className="font-medium text-foreground">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>
        </div>

        {/* Pricing breakdown */}
        <div className="space-y-3.5">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Bag Subtotal
            </span>
            <span className="font-medium text-foreground tabular-nums text-sm">
              {formatAED(subtotalFils)}
            </span>
          </div>

          <div className="flex justify-between items-baseline text-xs">
            <span className="font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Estimated Delivery
            </span>
            <span className="font-medium text-foreground tabular-nums text-sm">
              {isFreeShipping ? "FREE" : formatAED(deliveryFeeFils)}
            </span>
          </div>

          <div className="flex justify-between items-baseline text-[11px]">
            <span className="uppercase tracking-[0.08em] text-muted-foreground/80">
              Included 5% UAE VAT
            </span>
            <span className="text-muted-foreground tabular-nums">
              {formatAED(vatPortionFils)}
            </span>
          </div>

          <div className="pt-4 border-t border-border flex justify-between items-baseline">
            <span className="font-heading text-xl text-foreground">Estimated Total</span>
            <span className="text-2xl font-semibold text-foreground tabular-nums font-sans">
              {formatAED(estimatedTotalFils)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Link href="/checkout" className="block w-full">
            <StoreButton className="w-full h-12 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </StoreButton>
          </Link>

          <Link href="/collections" className="block w-full">
            <StoreButton variant="outline" className="w-full h-10 uppercase tracking-widest text-xs">
              Continue Shopping
            </StoreButton>
          </Link>
        </div>

        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          Cards, Apple Pay, and Cash on Delivery accepted. All transactions are securely encrypted.
        </p>
      </div>
    </div>
  )
}
