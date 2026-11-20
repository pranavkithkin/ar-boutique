"use client"

import { Button } from "@/components/ui/button"
export default function OfferError({ reset }: { reset: () => void }) {
  return <div role="alert" className="p-8 flex flex-col items-start gap-4"><h2 className="text-xl font-medium">Offers could not be loaded</h2><p className="text-muted-foreground">Please try again. If this continues, contact the store administrator.</p><Button onClick={reset}>Try again</Button></div>
}
