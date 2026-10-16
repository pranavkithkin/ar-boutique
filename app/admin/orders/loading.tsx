import { AppShell } from "@/components/app-shell"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminOrdersLoading() {
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Toolbar skeleton */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-52" />
              <Skeleton className="h-3 w-64" />
            </div>
            {/* Payment filter pills */}
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-8 w-14 rounded-none" />
              <Skeleton className="h-8 w-14 rounded-none" />
              <Skeleton className="h-8 w-14 rounded-none" />
            </div>
          </div>

          {/* Status tabs + search bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1 overflow-x-auto">
              {["w-24", "w-20", "w-24", "w-20", "w-20", "w-20", "w-20"].map((w, i) => (
                <Skeleton key={i} className={`h-8 ${w} rounded-none`} />
              ))}
            </div>
            <Skeleton className="h-9 w-full lg:w-72 rounded-none" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="border border-border bg-card rounded-none overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3.5">
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-20 rounded-none" />
                <Skeleton className="h-5 w-20 rounded-none" />
                <Skeleton className="size-7 rounded-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Pagination skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 py-1">
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="size-8" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
