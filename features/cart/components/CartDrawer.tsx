"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useCartStore } from "../store"
import { formatAED } from "@/lib/money"
import { StoreButton } from "@/components/store/StoreButton"

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    getSubtotalFils,
  } = useCartStore()

  // Avoid hydration mismatch by waiting for mount
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const subtotalFils = getSubtotalFils()
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-background border-l border-border h-full shadow-2xl"
      >
        {/* Header */}
        <SheetHeader className="p-6 border-b border-border/80 flex flex-row items-center justify-between">
          <div className="flex items-baseline gap-2">
            <SheetTitle className="font-heading text-2xl font-normal tracking-wide text-foreground">
              Your Bag
            </SheetTitle>
            <span className="text-xs text-muted-foreground uppercase tracking-widest">
              ({totalCount} {totalCount === 1 ? "item" : "items"})
            </span>
          </div>
        </SheetHeader>

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
              <ShoppingBag className="w-8 h-8 stroke-[1.25]" />
            </div>
            <div className="flex flex-col gap-1 max-w-xs">
              <h3 className="font-heading text-xl text-foreground">
                Your bag is empty
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Explore our latest collection of contemporary luxury ensembles and find your signature piece.
              </p>
            </div>
            <Link href="/collections" onClick={closeCart}>
              <StoreButton
                variant="outline"
                className="mt-2 text-xs uppercase tracking-wider"
              >
                Discover Collection
              </StoreButton>
            </Link>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/60 p-6 space-y-4">
              {items.map((item) => (
                <div key={item.sku} className="pt-4 first:pt-0 flex gap-4">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-26 bg-muted/30 shrink-0 overflow-hidden rounded-xs border border-border/50">
                    <Image
                      src={item.image}
                      alt={item.productName}
                      fill
                      sizes="80px"
                      className="object-cover object-top"
                      unoptimized={item.image.startsWith("http")}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/collections/${item.productSlug}`}
                          onClick={closeCart}
                          className="font-heading text-base text-foreground hover:opacity-75 transition-opacity line-clamp-1"
                        >
                          {item.productName}
                        </Link>
                        <button
                          onClick={() => removeItem(item.sku)}
                          aria-label={`Remove ${item.productName} from bag`}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Variant Specs: Colour & Size */}
                      <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2">
                        {item.colourName && (
                          <span>Colour: {item.colourName}</span>
                        )}
                        {item.colourName && item.sizeLabel && <span>•</span>}
                        {item.sizeLabel && (
                          <span>Size: {item.sizeLabel}</span>
                        )}
                      </div>

                      <div className="text-[11px] font-mono text-muted-foreground/75">
                        SKU: {item.sku}
                      </div>
                    </div>

                    {/* Price and Quantity Controls */}
                    <div className="flex items-center justify-between pt-2 mt-auto">
                      <div className="flex items-center border border-border bg-background rounded-xs">
                        <button
                          onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-medium tabular-nums text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                          disabled={item.quantity >= 5}
                          aria-label="Increase quantity"
                          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-sm font-medium text-foreground tabular-nums">
                        {formatAED(item.priceFils * item.quantity)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer with subtotal and checkout */}
            <div className="p-6 border-t border-border bg-card/40 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm text-foreground">
                  <span className="text-muted-foreground uppercase text-xs tracking-wider">
                    Subtotal
                  </span>
                  <span className="text-lg font-medium tabular-nums font-heading">
                    {formatAED(subtotalFils)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Delivery and applicable VAT calculated at checkout. Free shipping available across UAE on eligible orders.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Link href="/cart" onClick={closeCart} className="w-full">
                  <StoreButton
                    className="w-full h-12 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                  >
                    <span>View Cart</span>
                    <ArrowRight className="w-4 h-4" />
                  </StoreButton>
                </Link>
                
                <StoreButton
                  variant="outline"
                  onClick={closeCart}
                  className="w-full h-10 uppercase tracking-widest text-xs"
                >
                  Continue Shopping
                </StoreButton>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
