import { AnnouncementBar } from "@/components/store/AnnouncementBar"
import { StoreFooter } from "@/components/store/StoreFooter"
import { StoreHeader } from "@/components/store/StoreHeader"
import { Skeleton } from "@/components/ui/skeleton"

export default function OfferLoading() {
  return <div aria-label="Loading offer" className="min-h-screen flex flex-col bg-background">
    <AnnouncementBar />
    <StoreHeader />
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <section aria-hidden="true" className="mb-12 flex max-w-3xl flex-col gap-5">
        <Skeleton className="h-10 w-2/3 sm:h-12" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-5/6 max-w-xl" />
      </section>
      <section aria-hidden="true" className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-5 sm:gap-8 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(item => <div key={item} className="flex flex-col gap-3">
            <Skeleton className="aspect-[3/4] w-full rounded-xl" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>)}
        </div>
      </section>
    </main>
    <StoreFooter />
  </div>
}
