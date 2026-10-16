import { AppShell } from "@/components/app-shell"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminCategoriesLoading() {
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Toolbar skeleton */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-44" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-3 w-80" />
            </div>
            <Skeleton className="h-9 w-36" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-9 w-72" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="border border-border bg-card">
          <div className="h-10 bg-muted/30 border-b border-border flex items-center px-4 gap-4">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16 ml-auto" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center px-4 py-3 gap-4">
                <Skeleton className="h-11 w-11 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-16 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
