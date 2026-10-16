import { AppShell } from "@/components/app-shell"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminOrderDetailLoading() {
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-none" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-7 w-36" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-none" />
          </div>
        </div>

        {/* 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Line items & Timeline */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-card border border-border p-5 rounded-none space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>

              {/* Items */}
              <div className="space-y-4">
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-start gap-4 py-2">
                    <Skeleton className="size-16 rounded-none shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="space-y-1 text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                      <Skeleton className="h-3 w-12 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-card border border-border p-5 rounded-none space-y-4">
              <Skeleton className="h-4 w-36 pb-3 border-b border-border" />
              <div className="space-y-3">
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="size-2 rounded-full mt-1.5" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-2.5 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Customer, Delivery, Payment & Notes */}
          <div className="lg:col-span-4 space-y-6">
            {[0, 1, 2, 3].map((cardIdx) => (
              <div key={cardIdx} className="bg-card border border-border p-5 rounded-none space-y-3">
                <Skeleton className="h-4 w-28 pb-2 border-b border-border" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
