import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { OrdersClientContainer } from "@/features/admin/orders/components/OrdersClientContainer"
import { getAdminOrdersList } from "@/features/admin/orders/actions"

export const metadata: Metadata = {
  title: "Customer Orders | AR Boutique Admin",
  description: "Track, confirm and fulfil customer orders.",
  robots: { index: false, follow: false },
}

interface OrdersPageProps {
  searchParams: Promise<{
    q?: string
    status?: string
    payment_method?: string
    page?: string
  }>
}

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")

  const p = await searchParams
  const q = p.q || ""
  const status = p.status || "all"
  const paymentMethod = p.payment_method || "all"
  const page = Math.max(1, parseInt(p.page || "1", 10) || 1)

  const { orders, total, currentPage, totalPages, pageSize } = await getAdminOrdersList({
    search: q,
    status,
    paymentMethod,
    page,
    pageSize: 10,
  })

  return (
    <AppShell>
      <OrdersClientContainer
        initialOrders={orders}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        currentSearch={q}
        currentStatus={status}
        currentPaymentMethod={paymentMethod}
      />
    </AppShell>
  )
}
