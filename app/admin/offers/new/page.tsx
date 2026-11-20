import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { requireAdmin } from "@/lib/supabase/admin-auth"
import { offerChoices } from "@/features/offers/service"
import { OfferForm } from "@/features/offers/components/OfferForm"

export const metadata = { title: "Create Offer | AR Boutique Admin", robots: { index: false, follow: false } }
export default async function NewOfferPage() {
  if (!await requireAdmin()) redirect("/admin/login")
  const choices = await offerChoices()
  return <AppShell><OfferForm {...choices} /></AppShell>
}
