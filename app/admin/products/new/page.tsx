import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { ProductForm } from "@/features/admin/products/components/ProductForm"
import { getCategoriesList } from "@/features/admin/products/actions"

export const metadata: Metadata = {
  title: "New Product | AR Boutique Admin",
  description: "Create a new luxury garment in the AR Boutique catalogue.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminNewProductPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const categories = await getCategoriesList()

  return (
    <AppShell>
      <ProductForm mode="create" categories={categories} />
    </AppShell>
  )
}
