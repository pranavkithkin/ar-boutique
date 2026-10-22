import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { PaymentSettingsForm } from "@/features/admin/settings/components/PaymentSettingsForm"
import { getStoreSettings } from "@/features/admin/settings/actions"

export const metadata: Metadata = {
  title: "Payment Methods | AR Boutique Admin",
  description: "Configure online gateways, Stripe card payments, and Cash on Delivery rules.",
  robots: { index: false, follow: false },
}

export default async function AdminPaymentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")

  const settings = await getStoreSettings()

  return (
    <AppShell>
      <PaymentSettingsForm initialSettings={settings} />
    </AppShell>
  )
}
