import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { SettingsForm } from "@/features/admin/settings/components/SettingsForm"
import { getStoreSettings } from "@/features/admin/settings/actions"

export const metadata: Metadata = {
  title: "Store Settings | AR Boutique Admin",
  description: "Configure store details, delivery, VAT, COD, returns and notifications.",
  robots: { index: false, follow: false },
}

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")

  const settings = await getStoreSettings()

  return (
    <AppShell>
      <SettingsForm initialSettings={settings} />
    </AppShell>
  )
}
