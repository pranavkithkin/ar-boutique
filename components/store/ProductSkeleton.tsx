import { Skeleton } from "@/components/ui/skeleton"

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col w-full">
      {/* 2:3 Aspect Ratio Image Skeleton */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted rounded-none">
        <Skeleton className="h-full w-full" />
      </div>

      {/* Info Skeletons */}
      <div className="flex flex-col gap-1.5 pt-3">
        {/* Brand */}
        <Skeleton className="h-3 w-24" />
        {/* Title */}
        <Skeleton className="h-4 w-4/5 mt-0.5" />
        {/* Price */}
        <div className="flex items-center gap-2 mt-1">
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-2 gap-y-6 sm:gap-x-4 sm:gap-y-8">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pb-24">
      {/* Breadcrumb Skeleton */}
      <div className="py-4 sm:py-6 flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <span className="text-muted-foreground/30">/</span>
        <Skeleton className="h-4 w-20" />
        <span className="text-muted-foreground/30">/</span>
        <Skeleton className="h-4 w-36" />
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16 lg:items-start relative">
        {/* Left: Gallery Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-start w-full">
          {/* Thumbnails */}
          <div className="hidden sm:flex flex-col gap-3 w-14 xl:w-16 shrink-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full" />
            ))}
          </div>

          {/* Main Photo (4:5 Aspect Ratio) */}
          <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full flex-1 overflow-hidden bg-muted">
            <Skeleton className="h-full w-full" />
          </div>
        </div>

        {/* Right: Info Skeleton */}
        <div className="mt-8 lg:mt-0 bg-secondary/50 rounded-lg p-6 sm:p-8 lg:p-10 flex flex-col">
          {/* Title */}
          <Skeleton className="h-9 w-3/4 mb-3" />

          {/* SKU & Brand */}
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-4 w-28" />
            <span className="text-muted-foreground/30">|</span>
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Price */}
          <Skeleton className="h-8 w-32 mb-6" />

          {/* Size Chart Button */}
          <Skeleton className="h-9 w-28 mb-6" />

          {/* Sizes */}
          <div className="mb-8">
            <Skeleton className="h-4 w-20 mb-3" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-12" />
              <Skeleton className="h-10 w-12" />
              <Skeleton className="h-10 w-12" />
            </div>
          </div>

          {/* Quantity & Add to Cart */}
          <div className="flex gap-4 mb-4">
            <Skeleton className="h-12 w-28" />
            <Skeleton className="h-12 flex-1" />
          </div>

          <Skeleton className="h-4 w-48 mb-8" />

          {/* Feature Grid Skeleton (Commented out per user request)
          <div className="grid grid-cols-3 gap-y-6 gap-x-2 border-t border-border pt-6 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
          */}


          {/* Accordions */}
          <div className="space-y-4 border-t border-border pt-6">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
