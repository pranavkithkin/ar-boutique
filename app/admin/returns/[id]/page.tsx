import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { getAdminReturnById } from "@/features/admin/returns/actions"
import { ReturnDetailView } from "@/features/admin/returns/components/ReturnDetailView"

export const metadata: Metadata = {
  title: "Return Claim Details | AR Boutique Admin",
  description: "Inspect returned garments, manage approval, and process refunds.",
  robots: { index: false, follow: false },
}

interface ReturnDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminReturnDetailPage({
  params,
}: ReturnDetailPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const { id } = await params
  const returnDetail = await getAdminReturnById(id)

  if (!returnDetail) {
    notFound()
  }

  return (
    <AppShell>
      <ReturnDetailView returnDetail={returnDetail} />
    </AppShell>
  )
}
