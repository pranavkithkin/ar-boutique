import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { getAdminDashboardData } from "@/features/admin/dashboard/actions"
import { DashboardClientContainer } from "@/features/admin/dashboard/components/DashboardClientContainer"

export const metadata: Metadata = {
  title: "Admin Dashboard | AR Boutique",
  description: "AR Boutique Management Console",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const initialData = await getAdminDashboardData("7d")

  return (
    <AppShell>
      <DashboardClientContainer initialData={initialData} />
    </AppShell>
  )
}
