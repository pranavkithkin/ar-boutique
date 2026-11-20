import { notFound, redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { requireAdmin } from "@/lib/supabase/admin-auth"
import { listOffers, offerChoices } from "@/features/offers/service"
import { OfferForm } from "@/features/offers/components/OfferForm"

export const metadata = { title: "Edit Offer | AR Boutique Admin", robots: { index: false, follow: false } }
export default async function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) redirect("/admin/login")
  const id = (await params).id
  const [offers, choices] = await Promise.all([listOffers(), offerChoices()])
  const offer = offers.find(o => o.id === id)
  if (!offer) notFound()
  return <AppShell><OfferForm offer={offer} {...choices} /></AppShell>
}
