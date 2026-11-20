import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { requireAdmin } from "@/lib/supabase/admin-auth"
import { listOffers, offerUsage, offerAttention } from "@/features/offers/service"
import { OffersManagerView } from "@/features/offers/components/OffersManagerView"

export const metadata: Metadata = {
  title: "Offer Campaigns | AR Boutique Admin",
  description: "Manage campaign landing pages, banner promotional links, and redemption limits.",
  robots: { index: false, follow: false },
}

export default async function OffersAdminPage() {
  if (!(await requireAdmin())) redirect("/admin/login")

  const [offers, attention] = await Promise.all([listOffers(), offerAttention()])
  const usage = await offerUsage(offers.map((o) => o.id))

  return (
    <AppShell>
      <main className="p-4 sm:p-8">
        <OffersManagerView
          initialOffers={offers}
          initialUsage={usage}
          attention={attention}
        />
      </main>
    </AppShell>
  )
}
