import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { ProductsToolbar } from "@/features/admin/products/components/ProductsToolbar"
import { ProductsTable } from "@/features/admin/products/components/ProductsTable"
import {
  getAdminProductsList,
  getCategoriesList,
} from "@/features/admin/products/actions"

export const metadata: Metadata = {
  title: "Products Catalogue | AR Boutique Admin",
  description: "Manage luxury garments, colourways, and variants.",
  robots: {
    index: false,
    follow: false,
  },
}

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string
    status?: string
    category?: string
    page?: string
  }>
}

export default async function AdminProductsPage({ searchParams }: ProductsPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const resolvedParams = await searchParams
  const q = resolvedParams?.q || ""
  const status = resolvedParams?.status || "all"
  const categoryId = resolvedParams?.category || "all"
  const page = Math.max(1, parseInt(resolvedParams?.page || "1", 10) || 1)

  const [categories, paginatedResult] = await Promise.all([
    getCategoriesList(),
    getAdminProductsList({
      search: q,
      status,
      categoryId,
      page,
      pageSize: 10,
    }),
  ])

  const { products, total, currentPage, totalPages, pageSize } = paginatedResult

  return (
    <AppShell>
      <div className="space-y-6">
        <ProductsToolbar
          categories={categories}
          currentSearch={q}
          currentStatus={status}
          currentCategory={categoryId}
          totalCount={total}
        />

        <ProductsTable
          products={products}
          total={total}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
        />
      </div>
    </AppShell>
  )
}
