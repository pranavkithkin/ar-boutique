import { AppShell } from "@/components/app-shell"
import { Skeleton } from "@/components/ui/skeleton"

function FieldSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-32 max-w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export default function NewOfferLoading() {
  return (
    <AppShell>
      <main aria-label="Loading create offer form" className="mx-auto flex w-full min-w-0 max-w-4xl flex-col gap-6 p-4 sm:p-8">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-48" />

        <section className="flex flex-col gap-6 border border-border bg-card p-5 sm:p-6" aria-label="Loading campaign details">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <div className="flex flex-col gap-5">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
        </section>

        <section className="flex flex-col gap-6 border border-border bg-card p-5 sm:p-6" aria-label="Loading discount and timing">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 8 }, (_, index) => <FieldSkeleton key={index} />)}
          </div>
        </section>

        <section className="flex flex-col gap-6 border border-border bg-card p-5 sm:p-6" aria-label="Loading eligible pieces">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <FieldSkeleton />
        </section>

        <Skeleton className="h-4 w-72 max-w-full" />
        <Skeleton className="h-10 w-full" />
      </main>
    </AppShell>
  )
}
