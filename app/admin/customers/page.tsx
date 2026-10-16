import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { CustomersClientContainer } from "@/features/admin/customers/components/CustomersClientContainer"
import { getAdminCustomersList } from "@/features/admin/customers/actions"

export const metadata: Metadata = {
  title: "Customer Management | AR Boutique Admin",
  description: "View boutique customers, order frequency, total spend, and Cash on Delivery controls.",
  robots: {
    index: false,
    follow: false,
  },
}

interface CustomersPageProps {
  searchParams: Promise<{
    q?: string
    status?: string
    sort?: string
    page?: string
  }>
}

export default async function AdminCustomersPage({ searchParams }: CustomersPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const p = await searchParams
  const q = p.q || ""
  const status = p.status || "all"
  const sort = p.sort || "last_order"
  const page = Math.max(1, parseInt(p.page || "1", 10) || 1)

  const {
    customers,
    total,
    currentPage,
    totalPages,
    pageSize,
    activeCodCount,
    blockedCodCount,
  } = await getAdminCustomersList({
    search: q,
    status,
    sort,
    page,
    pageSize: 10,
  })

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Boutique Operations
            </span>
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-0.5">
            Customer Management
          </h1>
          <p className="text-xs text-muted-foreground font-sans mt-1">
            Track customer activity, lifetime spend, delivery addresses, and manage Cash on Delivery (COD) eligibility.
          </p>
        </div>

        <CustomersClientContainer
          initialCustomers={customers}
          total={total}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          currentSearch={q}
          currentStatus={status}
          activeCodCount={activeCodCount}
          blockedCodCount={blockedCodCount}
        />
      </div>
    </AppShell>
  )
}
