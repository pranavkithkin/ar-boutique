import { StoreHeader } from "@/components/store/StoreHeader"
import { StoreFooter } from "@/components/store/StoreFooter"
import { ProductDetailSkeleton } from "@/components/store/ProductSkeleton"

export default function ProductLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StoreHeader />

      <main className="flex-1">
        <ProductDetailSkeleton />
      </main>

      <StoreFooter />
    </div>
  )
}
