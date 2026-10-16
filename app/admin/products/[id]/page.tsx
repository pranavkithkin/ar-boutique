import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { ProductForm } from "@/features/admin/products/components/ProductForm"
import {
  getAdminProductById,
  getCategoriesList,
  getSizesList,
  getColoursList,
} from "@/features/admin/products/actions"

export const metadata: Metadata = {
  title: "Edit Product | AR Boutique Admin",
  description: "Edit product details, colourways, and variant SKUs.",
  robots: {
    index: false,
    follow: false,
  },
}

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminEditProductPage({ params }: EditProductPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const { id } = await params
  const [product, categories, sizes, colours] = await Promise.all([
    getAdminProductById(id),
    getCategoriesList(),
    getSizesList(),
    getColoursList(),
  ])

  if (!product) {
    notFound()
  }

  return (
    <AppShell>
      <ProductForm
        mode="edit"
        initialProduct={product}
        categories={categories}
        sizes={sizes}
        colours={colours}
      />
    </AppShell>
  )
}
