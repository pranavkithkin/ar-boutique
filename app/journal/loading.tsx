import { AnnouncementBar } from "@/components/store/AnnouncementBar"
import { StoreHeader } from "@/components/store/StoreHeader"
import { StoreFooter } from "@/components/store/StoreFooter"
import { JournalPageHeader } from "@/features/blog/components/JournalPageHeader"
import { JournalSkeleton } from "@/features/blog/components/JournalSkeleton"

export default function JournalLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBar />
      <StoreHeader />
      <main aria-busy="true" aria-label="Loading Journal" className="flex-1 pb-20">
        <span role="status" className="sr-only">Loading stories</span>
        <JournalPageHeader />
        <JournalSkeleton />
      </main>
      <StoreFooter />
    </div>
  )
}
