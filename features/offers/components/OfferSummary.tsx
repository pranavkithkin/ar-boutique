"use client"

import Link from "next/link"
import type { OfferQuote } from "../types"
import { formatAED } from "@/lib/money"

export function OfferSummary({ offer, quote, error, pending }: {
  offer: { slug: string; title: string } | null
  quote?: OfferQuote
  error?: string
  pending?: boolean
}) {
  if (!offer && !error) return null
  return <section aria-label="Offer applied" className="border border-border bg-muted/30 p-4 flex flex-col gap-2 text-sm">
    {offer && <Link href={`/offers/${offer.slug}`} className="font-medium underline underline-offset-4">{offer.title}</Link>}
    <p aria-live="polite" className="text-muted-foreground">
      {pending ? "Checking available offers…" : error || (quote ? quote.free_shipping ? "Free delivery applied. COD fees are separate." : `${formatAED(quote.discount_fils)} off eligible items.` : "Offer applied to eligible items.")}
    </p>
    <p className="text-xs text-muted-foreground">The best eligible offer is applied automatically. Offers cannot be combined with promo codes.</p>
  </section>
}
