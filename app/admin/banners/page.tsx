import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { BannersClientView } from "@/features/admin/banners/components/BannersClientView"
import { getAdminBannersList } from "@/features/admin/banners/actions"

export const metadata: Metadata = {
  title: "Banners & Carousel | AR Boutique Admin",
  description: "Manage homepage hero slides, promo banners, aspect ratios, and scheduled visibility.",
  robots: { index: false, follow: false },
}

export default async function AdminBannersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")

  const banners = await getAdminBannersList()

  return (
    <AppShell>
      <BannersClientView initialBanners={banners} />
    </AppShell>
  )
}
