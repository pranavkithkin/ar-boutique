import { AppShell } from "@/components/app-shell"
import { Skeleton } from "@/components/ui/skeleton"

const COLUMN_WIDTHS = ["w-12", "w-48", "w-24", "w-24", "w-16", "w-24", "w-16", "w-16"]
const ROW_COUNT = 10

export default function AdminProductsLoading() {
  return (
    <AppShell>
      <div className="space-y-6">
        {/* ── Toolbar skeleton ── */}
        <div className="space-y-4">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-3 w-72" />
            </div>
            {/* Add Product button */}
            <Skeleton className="h-9 w-32" />
          </div>

          {/* Filter bar row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
            {/* Status tabs */}
            <div className="flex items-center gap-1">
              {["w-24", "w-20", "w-16", "w-20"].map((w, i) => (
                <Skeleton key={i} className={`h-8 ${w}`} />
              ))}
            </div>
            {/* Search + category filter */}
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-9 w-44" />
              <Skeleton className="h-9 w-64" />
            </div>
          </div>
        </div>

        {/* ── Table skeleton ── */}
        <div className="border border-border bg-card rounded-none overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-4 px-4 py-3 bg-muted/30 border-b border-border">
            {COLUMN_WIDTHS.map((w, i) => (
              <Skeleton key={i} className={`h-3 ${w}`} />
            ))}
          </div>

          {/* Table rows */}
          <div className="divide-y divide-border">
            {Array.from({ length: ROW_COUNT }).map((_, rowIdx) => (
              <ProductRowSkeleton key={rowIdx} />
            ))}
          </div>
        </div>

        {/* ── Pagination footer skeleton ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 py-1">
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-20" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="size-8" />
            ))}
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function ProductRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      {/* Thumbnail */}
      <Skeleton className="size-12 shrink-0" />

      {/* Product name + slug */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-2.5 w-28 opacity-60" />
      </div>

      {/* Category */}
      <Skeleton className="h-3 w-20 shrink-0" />

      {/* Style code */}
      <Skeleton className="h-3 w-20 shrink-0" />

      {/* Variants */}
      <Skeleton className="h-3 w-12 shrink-0" />

      {/* Price */}
      <Skeleton className="h-3 w-20 shrink-0 ml-auto" />

      {/* Status badge */}
      <Skeleton className="h-5 w-16 shrink-0" />

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Skeleton className="size-7" />
        <Skeleton className="size-7" />
      </div>
    </div>
  )
}
