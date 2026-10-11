import Link from "next/link"
import { Ruler, Minus, Plus, Wind, ShieldCheck, Shirt, HeartHandshake, Package, HeadphonesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductAccordions } from "./ProductAccordions"
import { ProductTrustStrip } from "./ProductTrustStrip"

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
  sizes: { id: string; name: string }[]
}


interface ProductInfoProps {
  product: ProductType
  title: string
}

export function ProductInfo({ product, title }: ProductInfoProps) {
  return (
    <div className="bg-secondary/50 rounded-lg p-6 sm:p-8 lg:p-10 flex flex-col min-h-full">
      <h1 className="font-heading text-3xl sm:text-4xl text-foreground leading-tight mb-3">
        {title}
      </h1>
      
      <div className="flex items-center justify-between mb-4 text-[13px] sm:text-sm">
        <div className="text-muted-foreground">
          by <Link href="#" className="text-primary hover:underline">{product.brand}</Link> <span className="mx-2">|</span> SKU: {product.sku}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-foreground font-sans">{product.price}</span>
          {product.compareAtPrice && (
            <span className="text-sm text-muted-foreground line-through font-sans">{product.compareAtPrice}</span>
          )}
        </div>
      </div>

      {/* Size Chart Button */}
      <div className="mb-6">
        <button className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-sm text-sm font-medium hover:bg-foreground/90 transition-colors">
          <Ruler className="w-4 h-4" />
          Size Chart
        </button>
      </div>

      {/* Sizes */}
      <div className="mb-8">
        <div className="text-sm text-foreground mb-3">
          Size: <span className="font-medium">L-38</span>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {product.sizes.map(s => {
            const isSelected = s.name === "L-38"
            return (
              <button
                key={s.id}
                className={`flex h-10 px-3 sm:px-4 items-center justify-center border text-[13px] sm:text-sm font-medium transition-colors
                  ${isSelected 
                      ? "border-foreground bg-transparent text-foreground shadow-[0_0_0_1px_rgba(17,17,17,1)]" 
                      : "border-border bg-transparent text-foreground hover:border-foreground"
                  }
                `}
              >
                {s.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Quantity & Add to Cart */}
      <div className="mb-4">
        <div className="text-sm text-foreground mb-3">Quantity</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-border bg-transparent h-12 w-28 shrink-0">
            <button className="flex-1 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors h-full">
              <Minus className="w-4 h-4" />
            </button>
            <span className="flex-1 flex items-center justify-center text-sm font-medium">1</span>
            <button className="flex-1 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors h-full">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <Button className="flex-1 h-12 text-[15px] rounded-none uppercase tracking-wide" size="lg">
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Tax Note */}
      <div className="text-[13px] text-muted-foreground mb-4">
        Tax included. <Link href="#" className="text-primary underline">Shipping</Link> calculated at checkout.
      </div>

      {/* Features Grid (Commented out per user request)
      <div className="grid grid-cols-3 gap-y-6 gap-x-2 border-t border-border pt-6 mb-6">
        <div className="flex flex-col items-center text-center gap-1.5">
          <Wind className="w-5 h-5 stroke-[1.5] text-foreground" />
          <span className="text-xs text-foreground font-medium">Breathable</span>
        </div>
        <div className="flex flex-col items-center text-center gap-1.5">
          <Shirt className="w-5 h-5 stroke-[1.5] text-foreground" />
          <span className="text-xs text-foreground font-medium">Premium Fabric</span>
        </div>
        <div className="flex flex-col items-center text-center gap-1.5">
          <HeartHandshake className="w-5 h-5 stroke-[1.5] text-foreground" />
          <span className="text-xs text-foreground font-medium">Everyday Wear</span>
        </div>
        <div className="flex flex-col items-center text-center gap-1.5">
          <Package className="w-5 h-5 stroke-[1.5] text-foreground" />
          <span className="text-xs text-foreground font-medium">Secured Packing</span>
        </div>
        <div className="flex flex-col items-center text-center gap-1.5">
          <ShieldCheck className="w-5 h-5 stroke-[1.5] text-foreground" />
          <span className="text-xs text-foreground font-medium">100% Genuine</span>
        </div>
        <div className="flex flex-col items-center text-center gap-1.5">
          <HeadphonesIcon className="w-5 h-5 stroke-[1.5] text-foreground" />
          <span className="text-xs text-foreground font-medium">Dedicated support</span>
        </div>
      </div>
      */}


      <div className="mt-6">
        <ProductAccordions product={product} />
        <ProductTrustStrip />
      </div>
    </div>
  )
}
