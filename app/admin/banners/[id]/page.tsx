import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { BannerForm } from "@/features/admin/banners/components/BannerForm"
import { getAdminBannerById } from "@/features/admin/banners/actions"

export const metadata: Metadata = {
  title: "Edit Banner Slide | AR Boutique Admin",
  description: "Edit hero carousel slide or promo banner.",
  robots: { index: false, follow: false },
}

interface EditBannerPageProps {
  params: Promise<{ id: string }>
}

import { Suspense } from "react"

export default async function AdminEditBannerPage({ params }: EditBannerPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")

  const { id } = await params
  const banner = await getAdminBannerById(id)

  if (!banner) {
    notFound()
  }

  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading banner form...</div>}>
        <BannerForm mode="edit" initialBanner={banner} />
      </Suspense>
    </AppShell>
  )
}
