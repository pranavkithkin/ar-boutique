"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function JournalError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <h1 className="font-heading text-3xl">We couldn’t load this story</h1>
      <p role="alert" className="text-muted-foreground">Please try again, or return to the Journal to explore another story.</p>
      <Button onClick={reset}>Try Again</Button>
      <Link href="/journal" className="underline underline-offset-4">Back to the Journal</Link>
      <Link href="/" className="underline underline-offset-4">Return Home</Link>
    </main>
  )
}
