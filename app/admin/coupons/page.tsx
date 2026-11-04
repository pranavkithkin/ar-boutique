import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { getAdminCouponsAction } from "@/features/coupons/actions"
import { CouponsManagerView } from "@/features/admin/coupons/components/CouponsManagerView"

export const metadata: Metadata = {
  title: "Promo Codes & Discounts | AR Boutique Admin",
  description: "Create and manage promotional discount codes, validity periods, spend thresholds, and redemption caps.",
  robots: { index: false, follow: false },
}

export default async function AdminCouponsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")

  const res = await getAdminCouponsAction()
  const coupons = res.coupons || []

  return (
    <AppShell>
      <CouponsManagerView initialCoupons={coupons} />
    </AppShell>
  )
}
