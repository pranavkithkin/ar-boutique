import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { BannerForm } from "@/features/admin/banners/components/BannerForm"

export const metadata: Metadata = {
  title: "New Banner Slide | AR Boutique Admin",
  description: "Create a new hero carousel slide or promo banner.",
  robots: { index: false, follow: false },
}

interface NewBannerPageProps {
  searchParams?: Promise<{ type?: string }>
}

export default async function AdminNewBannerPage({ searchParams }: NewBannerPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")

  const resolvedParams = searchParams ? await searchParams : {}

  const { data: existingPromo } = await supabase
    .from("banners")
    .select("id")
    .eq("placement", "promo")
    .limit(1)
    .maybeSingle()

  if (resolvedParams.type === "promo" && existingPromo?.id) {
    redirect(`/admin/banners/${existingPromo.id}`)
  }

  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading banner form...</div>}>
        <BannerForm mode="create" existingPromoId={existingPromo?.id} />
      </Suspense>
    </AppShell>
  )
}

