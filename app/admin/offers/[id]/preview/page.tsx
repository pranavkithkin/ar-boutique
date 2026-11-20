import { notFound, redirect } from "next/navigation"
import { requireAdmin } from "@/lib/supabase/admin-auth"
import { listOffers } from "@/features/offers/service"
import { offerProducts } from "@/features/offers/catalogue"
import { OfferContent } from "@/features/offers/components/OfferContent"

export const metadata = { title: "Offer Preview | AR Boutique", robots: { index: false, follow: false } }
export default async function PreviewOffer({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }> }) {
  if (!await requireAdmin()) redirect("/admin/login")
  const id = (await params).id
  const offer = (await listOffers()).find(o => o.id === id)
  if (!offer) notFound()
  const page = Math.max(1, Math.min(1000, Math.floor(Number((await searchParams).page) || 1)))
  const catalogue = await offerProducts(offer, page)
  return <OfferContent offer={offer} {...catalogue} page={page} preview />
}
