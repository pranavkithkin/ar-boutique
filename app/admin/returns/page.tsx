import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { ReturnsClientContainer } from "@/features/admin/returns/components/ReturnsClientContainer"
import { getAdminReturnsList } from "@/features/admin/returns/actions"

export const metadata: Metadata = {
  title: "Returns & Exchanges | AR Boutique Admin",
  description: "Review customer claims, inspect received garments, and record refunds.",
  robots: { index: false, follow: false },
}

interface ReturnsPageProps {
  searchParams: Promise<{
    q?: string
    status?: string
    page?: string
  }>
}

export default async function AdminReturnsPage({ searchParams }: ReturnsPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")

  const p = await searchParams
  const q = p.q || ""
  const status = p.status || "all"
  const page = Math.max(1, parseInt(p.page || "1", 10) || 1)

  const { returns, total, currentPage, totalPages, pageSize } =
    await getAdminReturnsList({
      search: q,
      status,
      page,
      pageSize: 10,
    })

  return (
    <AppShell>
      <ReturnsClientContainer
        initialReturns={returns}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        currentSearch={q}
        currentStatus={status}
      />
    </AppShell>
  )
}
