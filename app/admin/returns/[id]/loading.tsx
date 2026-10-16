import { AppShell } from "@/components/app-shell"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminReturnDetailLoading() {
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-none" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-7 w-44" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-28 rounded-none" />
            <Skeleton className="h-6 w-20 rounded-none" />
          </div>
        </div>

        {/* Action Card Skeleton */}
        <Skeleton className="h-20 w-full rounded-none" />

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full rounded-none" />
            <Skeleton className="h-28 w-full rounded-none" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-44 w-full rounded-none" />
            <Skeleton className="h-56 w-full rounded-none" />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
