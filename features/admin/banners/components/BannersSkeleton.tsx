import { Skeleton } from "@/components/ui/skeleton"

export function BannersSkeleton() {
  return (
    <div className="space-y-6">
      {/* ── Page Header Skeleton ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      {/* ── Summary KPI Cards Skeleton ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-card border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="size-4 rounded-full" />
            </div>
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* ── Filter / Search Toolbar Skeleton ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-muted/20 p-2 border border-border">
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="h-9 w-full md:w-72" />
      </div>

      {/* ── Banner Items List Skeleton ── */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 bg-card border border-border flex flex-col md:flex-row items-start md:items-center gap-4 justify-between"
          >
            {/* Thumbnail + Info */}
            <div className="flex items-start gap-4 min-w-0 flex-1">
              {/* Order index pill */}
              <Skeleton className="h-6 w-7 shrink-0 hidden sm:block" />

              {/* Banner image thumbnail */}
              <Skeleton className="w-28 sm:w-36 h-20 shrink-0 bg-muted border border-border" />

              {/* Content info */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-5 w-48 sm:w-72" />
                <Skeleton className="h-3.5 w-64 max-w-full" />
                <div className="flex items-center gap-2 pt-0.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-2 md:pt-0">
              <div className="flex items-center gap-1 border border-border p-1">
                <Skeleton className="size-7" />
                <Skeleton className="size-7" />
              </div>
              <Skeleton className="size-8" />
              <Skeleton className="size-8" />
              <Skeleton className="h-5 w-10" />
              <Skeleton className="size-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
