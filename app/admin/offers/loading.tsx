import { AppShell } from "@/components/app-shell"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminOffersLoading() {
  return (
    <AppShell>
      <main aria-label="Loading offers" className="flex flex-col gap-6 p-4 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>

        <div className="flex flex-col divide-y divide-border border-y border-border">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-48 max-w-full" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-3 w-44 max-w-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </AppShell>
  )
}
