import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { findPublicOffer } from "@/features/offers/service"
import { offerProducts } from "@/features/offers/catalogue"
import { offerState } from "@/features/offers/types"
import { OfferContent } from "@/features/offers/components/OfferContent"

export const dynamic = "force-dynamic"
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const offer = await findPublicOffer((await params).slug)
  return { title: offer ? `${offer.title} | AR Boutique` : "Offer unavailable", robots: { index: offer ? offerState(offer) === "active" : false, follow: true } }
}
export default async function OfferPage({ params, searchParams }: Props) {
  const offer = await findPublicOffer((await params).slug)
  if (!offer) notFound()
  const page = Math.max(1, Math.min(1000, Math.floor(Number((await searchParams).page) || 1)))
  const catalogue = offerState(offer) === "active" ? await offerProducts(offer, page) : { products: [], total: 0 }
  return <OfferContent offer={offer} {...catalogue} page={page} />
}
