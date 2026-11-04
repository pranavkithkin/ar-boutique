import * as React from "react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { StoreHeader } from "@/components/store/StoreHeader"
import { StoreFooter } from "@/components/store/StoreFooter"
import { ProductReviewsFullPage } from "@/components/store/reviews/ProductReviewsFullPage"
import { getProductBySlug } from "@/lib/product-detail"
import { getProductReviewsAction } from "@/features/reviews/actions"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return {
      title: "Product Reviews | AR Boutique",
    }
  }

  return {
    title: `Client Reviews - ${product.name} | AR Boutique`,
    description: `Read verified customer feedback, sizing advice, and craftsmanship reviews for ${product.name}.`,
  }
}

export default async function ProductReviewsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const reviewsData = await getProductReviewsAction(slug)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StoreHeader />

      <main className="flex-1">
        <ProductReviewsFullPage
          product={product}
          initialData={reviewsData}
        />
      </main>

      <StoreFooter />
    </div>
  )
}
