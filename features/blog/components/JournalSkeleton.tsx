import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function JournalSkeleton() {
  return (
    <div aria-hidden="true" className="mx-auto mt-10 flex max-w-[1340px] flex-col gap-14 px-4 sm:px-6 md:mt-14 md:gap-20 lg:px-8 motion-reduce:[&_[data-slot=skeleton]]:animate-none">
      <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <Skeleton className="h-[300px] sm:h-[400px] lg:col-span-7 lg:h-[480px]" />
          <CardContent className="flex flex-col justify-between gap-6 p-6 sm:p-8 md:p-12 lg:col-span-5">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="space-y-3 py-1">
                <Skeleton className="h-8 w-full md:h-10" />
                <Skeleton className="h-8 w-5/6 md:h-10" />
                <Skeleton className="h-8 w-2/3 md:h-10" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
            <Skeleton className="h-12 w-full sm:w-40" />
          </CardContent>
        </div>
      </Card>

      <div className="flex flex-col gap-6 md:gap-8">
        <div className="space-y-2 border-b border-border/40 pb-4">
          <Skeleton className="h-8 w-56 md:h-9" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="flex flex-col gap-10 md:gap-14">
          <div className="flex gap-2 overflow-hidden pb-2 sm:gap-2.5 md:justify-center">
            {["w-16", "w-40", "w-32", "w-32", "w-32", "w-40"].map((width, index) => (
              <Skeleton key={index} className={`h-8 shrink-0 sm:h-9 ${width}`} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Card key={index} className="h-full gap-0 overflow-hidden border-border/60 pt-0 shadow-xs">
                <Skeleton className="aspect-[16/10] w-full" />
                <CardContent className="flex flex-col gap-5 p-6 sm:p-7">
                  <Skeleton className="h-3 w-40" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-4/5" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
