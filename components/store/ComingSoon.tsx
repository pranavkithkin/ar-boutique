import Link from "next/link"
import { StoreHeader } from "@/components/store/StoreHeader"
import { StoreFooter } from "@/components/store/StoreFooter"
import { StoreButton } from "@/components/store/StoreButton"
import { SectionHeading } from "@/components/store/SectionHeading"

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-32">
        <SectionHeading className="mb-4">{title} – Coming Soon</SectionHeading>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          We are currently crafting this experience. Please check back later or continue exploring our curated collections.
        </p>
        <Link href="/">
          <StoreButton>Return to Home</StoreButton>
        </Link>
      </main>
      <StoreFooter />
    </div>
  )
}
