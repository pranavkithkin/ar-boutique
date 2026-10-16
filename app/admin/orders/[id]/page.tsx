import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { getAdminOrderById } from "@/features/admin/orders/actions"
import { OrderDetailView } from "@/features/admin/orders/components/OrderDetailView"

export const metadata: Metadata = {
  title: "Order Details | AR Boutique Admin",
  description: "View and manage customer order details, tracking and status.",
  robots: { index: false, follow: false },
}

interface OrderDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const { id } = await params
  const order = await getAdminOrderById(id)

  if (!order) {
    notFound()
  }

  return (
    <AppShell>
      <OrderDetailView order={order} />
    </AppShell>
  )
}
