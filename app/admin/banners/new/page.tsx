import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { BannerForm } from "@/features/admin/banners/components/BannerForm"

export const metadata: Metadata = {
  title: "New Banner Slide | AR Boutique Admin",
  description: "Create a new hero carousel slide or promo banner.",
  robots: { index: false, follow: false },
}

export default async function AdminNewBannerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")

  return (
    <AppShell>
      <BannerForm mode="create" />
    </AppShell>
  )
}
