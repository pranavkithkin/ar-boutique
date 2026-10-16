import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { StockClientContainer } from "@/features/admin/stock/components/StockClientContainer"
import { getAdminStockData } from "@/features/admin/stock/actions"
import { StockFilter } from "@/features/admin/stock/types"

export const metadata: Metadata = {
  title: "Inventory & Stock Grid | AR Boutique Admin",
  description: "Manage product stock levels, examine colours x sizes matrix, and record inventory adjustments.",
  robots: { index: false, follow: false },
}

interface StockPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    page?: string
  }>
}

export default async function AdminStockPage({ searchParams }: StockPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")

  const p = await searchParams
  const search = p.search || ""
  const status = (p.status as StockFilter) || "all"
  const page = Math.max(1, parseInt(p.page || "1", 10) || 1)

  const { items, matrixRows, allSizeLabels, summary, pagination } =
    await getAdminStockData({
      search,
      status,
      page,
      pageSize: 20,
    })

  return (
    <AppShell>
      <StockClientContainer
        initialItems={items}
        matrixRows={matrixRows}
        allSizeLabels={allSizeLabels}
        summary={summary}
        pagination={pagination}
        currentSearch={search}
        currentStatus={status}
      />
    </AppShell>
  )
}
