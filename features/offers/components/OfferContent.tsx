import Link from "next/link"
import { StoreHeader } from "@/components/store/StoreHeader"
import { StoreFooter } from "@/components/store/StoreFooter"
import { AnnouncementBar } from "@/components/store/AnnouncementBar"
import { ProductCard } from "@/components/store/ProductCard"
import { offerState } from "@/features/offers/types"
import { formatAED } from "@/lib/money"

import type { Offer } from "@/features/offers/types"
import { offerTagFor } from "@/features/offers/presentation"
import type { offerProducts } from "@/features/offers/catalogue"

export function OfferContent({ offer, products, total, page, preview = false }: {
  offer: Offer; products: Awaited<ReturnType<typeof offerProducts>>["products"]; total: number; page: number; preview?: boolean
}) {
  const state = offerState(offer)
  const available = preview || state === "active"
  const basePath = preview ? `/admin/offers/${offer.id}/preview` : `/offers/${offer.slug}`
  return <div className="min-h-screen flex flex-col bg-background text-foreground">
    <AnnouncementBar /><StoreHeader />
    <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 flex flex-col gap-12">
      <section className="max-w-3xl flex flex-col gap-5">
        {preview && <p role="status" className="text-sm font-medium">Admin preview — this does not activate the offer.</p>}
        <h1 className="font-heading text-4xl sm:text-5xl">{offer.title}</h1>
        <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{offer.description}</p>
        {!available && <p role="status">{state === "scheduled" ? "This offer has not started yet." : state === "expired" ? "This offer has ended." : "This offer is currently unavailable."}</p>}
      </section>
      {available && <section className="flex flex-col gap-6">
        <h2 className="font-heading text-2xl">Shop This Offer</h2>
        {!products.length && <p className="text-muted-foreground">No eligible pieces are available on this page.</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-8">
          {products.map(p => <ProductCard key={p.id} name={p.name} brand="AR Boutique" price={`${p.variablePrice ? "From " : ""}${formatAED(p.priceFils)}`} href={`/collections/${p.slug}`} imageSrc={p.mediaKey ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto,c_limit,w_800/${p.mediaKey}` : "/images/placeholder.jpg"} offerTags={!preview && available ? [offerTagFor(offer)] : []} />)}
        </div>
        <nav aria-label="Offer products pages" className="flex justify-between text-sm">
          {page > 1 ? <Link href={`${basePath}?page=${page - 1}`}>Previous</Link> : <span />}
          {page * 12 < total && <Link href={`${basePath}?page=${page + 1}`}>Next</Link>}
        </nav>
      </section>}
    </main><StoreFooter />
  </div>
}
