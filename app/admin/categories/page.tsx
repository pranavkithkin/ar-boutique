import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { getAdminCategoriesList } from "@/features/admin/categories/actions"
import { CategoriesClientContainer } from "@/features/admin/categories/components/CategoriesClientContainer"

export const metadata: Metadata = {
  title: "Categories Management | AR Boutique Admin",
  description: "Manage boutique categories, merchandising hierarchy, and visibility.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminCategoriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const categories = await getAdminCategoriesList()

  return (
    <AppShell>
      <CategoriesClientContainer initialCategories={categories} />
    </AppShell>
  )
}
