import Link from "next/link"
import { StoreHeader } from "@/components/store/StoreHeader"
import { StoreFooter } from "@/components/store/StoreFooter"

export default function StoryNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />
      <main className="mx-auto flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <p className="text-sm text-muted-foreground">The Journal</p>
        <h1 className="font-heading text-3xl sm:text-4xl">Story Not Found</h1>
        <p className="max-w-md text-muted-foreground">This story may have moved or is no longer available. Explore the Journal for more inspiration.</p>
        <Link href="/journal" className="underline underline-offset-4">Explore All Stories</Link>
      </main>
      <StoreFooter />
    </div>
  )
}
