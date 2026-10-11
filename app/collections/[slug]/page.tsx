import * as React from "react"
import { notFound } from "next/navigation"
import { StoreHeader } from "@/components/store/StoreHeader"
import { StoreFooter } from "@/components/store/StoreFooter"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ProductGallery } from "@/components/store/ProductGallery"
import { SyncScrollLayout } from "@/components/store/SyncScrollLayout"
import { ProductInfo } from "@/components/store/ProductInfo"
import { ProductCard } from "@/components/store/ProductCard"
import { getProductBySlug } from "@/lib/product-detail"
import { getProductsPage } from "@/lib/products"

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  // Recommended products: fetch next 5 items from the database
  const { products: recommended } = await getProductsPage({ limit: 5 })
  const filteredRecommended = recommended.filter((p) => p.slug !== slug).slice(0, 4)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StoreHeader />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <Breadcrumb>
            <BreadcrumbList className="text-xs sm:text-sm">
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-primary hover:text-primary/80">
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/collections" className="text-primary hover:text-primary/80">
                  Collections
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-muted-foreground">{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pb-24">
          <SyncScrollLayout
            left={<ProductGallery images={product.images} />}
            right={<ProductInfo product={product} title={product.name} />}
          />

          {/* Recommended Products */}
          {filteredRecommended.length > 0 && (
            <div className="mt-24 pt-16 border-t border-border">
              <h2 className="font-heading text-2xl sm:text-3xl text-foreground text-center mb-10">
                You May Also Like
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {filteredRecommended.map((item) => (
                  <ProductCard
                    key={item.id}
                    brand={item.brand}
                    name={item.name}
                    price={item.price}
                    imageSrc={item.imageSrc}
                    href={`/collections/${item.slug}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <StoreFooter />
    </div>
  )
}
