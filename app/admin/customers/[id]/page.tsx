import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { getAdminCustomerDetails } from "@/features/admin/customers/actions"
import { CustomerDetailView } from "@/features/admin/customers/components/CustomerDetailView"

export const metadata: Metadata = {
  title: "Customer Profile | AR Boutique Admin",
  description: "View and manage customer order history, UAE delivery addresses, and Cash on Delivery eligibility.",
  robots: {
    index: false,
    follow: false,
  },
}

interface CustomerDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminCustomerDetailPage({ params }: CustomerDetailPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const { id } = await params
  const customer = await getAdminCustomerDetails(id)

  if (!customer) {
    notFound()
  }

  return (
    <AppShell>
      <CustomerDetailView customer={customer} />
    </AppShell>
  )
}
