"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function OfferLinks({ slug, id }: { slug: string; id: string }) {
  const [message, setMessage] = useState("")
  const path = `/offers/${slug}`
  return <div className="flex flex-wrap items-center gap-3 text-sm">
    <Link href={`/admin/offers/${id}/preview`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Preview</Link>
    <Button variant="outline" size="sm" onClick={async () => {
      try { await navigator.clipboard.writeText(path); setMessage("Offer link copied") } catch { setMessage(path) }
    }}>Copy banner link</Button><span aria-live="polite" className="text-xs text-muted-foreground">{message}</span>
  </div>
}
