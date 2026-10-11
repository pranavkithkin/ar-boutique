import { Suspense } from "react"
import Link from "next/link"
import { AnnouncementBar } from "@/components/store/AnnouncementBar"
import { StoreHeader } from "@/components/store/StoreHeader"
import { StoreFooter } from "@/components/store/StoreFooter"
import { ProductCard } from "@/components/store/ProductCard"
import { SidebarFilters } from "@/components/store/SidebarFilters"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Filter, X } from "lucide-react"
import { getProductsPage } from "@/lib/products"
import { SortSelect } from "@/components/store/SortSelect"

export const dynamic = "force-dynamic"

interface CollectionPageProps {
  searchParams: Promise<{
    page?: string
    sort?: string
    category?: string
    size?: string
    fabric?: string
    pattern?: string
    minPrice?: string
    maxPrice?: string
  }>
}

export default async function CollectionPage({ searchParams }: CollectionPageProps) {
  const resolvedParams = await searchParams
  const currentPage = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1)
  const sort = (resolvedParams.sort as any) || "newest"
  const category = resolvedParams.category || ""
  const size = resolvedParams.size || ""
  const fabric = resolvedParams.fabric || ""
  const pattern = resolvedParams.pattern || ""
  
  const minPriceNum = resolvedParams.minPrice ? parseInt(resolvedParams.minPrice, 10) : undefined
  const maxPriceNum = resolvedParams.maxPrice ? parseInt(resolvedParams.maxPrice, 10) : undefined
  const pageSize = 12

  // Server-side query with filters and sorting
  const { products, total, totalPages } = await getProductsPage({
    page: currentPage,
    limit: pageSize,
    sort,
    categorySlug: category,
    size,
    fabric,
    pattern,
    minPrice: minPriceNum,
    maxPrice: maxPriceNum,
  })

  // Helper to build URL preserving filters
  function buildPageHref(p: number) {
    const params = new URLSearchParams()
    if (sort && sort !== "newest") params.set("sort", sort)
    if (category) params.set("category", category)
    if (size) params.set("size", size)
    if (fabric) params.set("fabric", fabric)
    if (pattern) params.set("pattern", pattern)
    if (minPriceNum && minPriceNum > 80) params.set("minPrice", String(minPriceNum))
    if (maxPriceNum && maxPriceNum < 160) params.set("maxPrice", String(maxPriceNum))
    params.set("page", String(p))
    return `/collections?${params.toString()}`
  }

  function buildRemoveFilterHref(keyToRemove: string) {
    const params = new URLSearchParams()
    if (sort && sort !== "newest") params.set("sort", sort)
    if (category && keyToRemove !== "category") params.set("category", category)
    if (size && keyToRemove !== "size") params.set("size", size)
    if (fabric && keyToRemove !== "fabric") params.set("fabric", fabric)
    if (pattern && keyToRemove !== "pattern") params.set("pattern", pattern)
    if (keyToRemove !== "price") {
      if (minPriceNum && minPriceNum > 80) params.set("minPrice", String(minPriceNum))
      if (maxPriceNum && maxPriceNum < 160) params.set("maxPrice", String(maxPriceNum))
    }
    params.set("page", "1")
    return `/collections?${params.toString()}`
  }

  const isPriceFiltered = (minPriceNum && minPriceNum > 80) || (maxPriceNum && maxPriceNum < 160)
  const hasActiveFilters = Boolean(category || size || fabric || pattern || isPriceFiltered)

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBar text="FREE SHIPPING ON ORDERS OVER 150 AED | EASY RETURNS WITHIN 14 DAYS" />
      <StoreHeader />

      <div className="flex-1 pb-16">
        {/* Page Header */}
        <div className="bg-muted py-6 md:py-10">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb className="mb-4 md:mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>All Collections</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-heading text-foreground mb-3">All Collections</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
                Discover our complete range of timeless designs, crafted to bring elegance and heritage to your everyday wardrobe.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 md:mt-12">
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
            {/* Desktop Sidebar */}
            <div
              className="hidden md:block w-52 shrink-0 sticky top-24 self-start h-[calc(100vh-10rem)] overflow-y-auto overscroll-contain pr-4 pb-8 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <Suspense fallback={<div className="h-64 animate-pulse bg-muted/40 rounded-sm" />}>
                <SidebarFilters />
              </Suspense>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
                <div className="flex items-center gap-4">
                  <Sheet>
                    <SheetTrigger render={<button className="md:hidden flex items-center gap-2 text-sm font-medium border border-border px-3 py-1.5 bg-background cursor-pointer" />}>
                      <Filter className="w-4 h-4" />
                      Filter
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] sm:w-[350px]">
                      <div className="p-6 pt-12 h-full overflow-y-auto overscroll-contain pb-24">
                        <h2 className="font-heading text-xl mb-6">Filters</h2>
                        <Suspense fallback={<div className="h-64 animate-pulse bg-muted/40 rounded-sm" />}>
                          <SidebarFilters />
                        </Suspense>
                      </div>
                    </SheetContent>
                  </Sheet>
                  <span className="text-sm text-muted-foreground">
                    Showing {products.length} of {total} products
                  </span>
                </div>

                {/* Sort Dropdown */}
                <Suspense fallback={<div className="w-[190px] h-8 animate-pulse bg-muted/40" />}>
                  <SortSelect currentSort={sort} />
                </Suspense>
              </div>

              {/* Active Filter Badges */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="text-xs text-muted-foreground font-medium mr-1">Filtered by:</span>
                  {category && (
                    <Link
                      href={buildRemoveFilterHref("category")}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border border-border bg-secondary/60 hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
                    >
                      <span>Category: {category}</span>
                      <X className="w-3 h-3 text-muted-foreground" />
                    </Link>
                  )}
                  {size && (
                    <Link
                      href={buildRemoveFilterHref("size")}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border border-border bg-secondary/60 hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
                    >
                      <span>Size: {size}</span>
                      <X className="w-3 h-3 text-muted-foreground" />
                    </Link>
                  )}
                  {fabric && (
                    <Link
                      href={buildRemoveFilterHref("fabric")}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border border-border bg-secondary/60 hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
                    >
                      <span>Fabric: {fabric}</span>
                      <X className="w-3 h-3 text-muted-foreground" />
                    </Link>
                  )}
                  {pattern && (
                    <Link
                      href={buildRemoveFilterHref("pattern")}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border border-border bg-secondary/60 hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
                    >
                      <span>Pattern: {pattern}</span>
                      <X className="w-3 h-3 text-muted-foreground" />
                    </Link>
                  )}
                  {isPriceFiltered && (
                    <Link
                      href={buildRemoveFilterHref("price")}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border border-border bg-secondary/60 hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
                    >
                      <span>Price: AED {minPriceNum ?? 80} – {maxPriceNum ?? 160}</span>
                      <X className="w-3 h-3 text-muted-foreground" />
                    </Link>
                  )}
                  <Link
                    href={`/collections?sort=${sort}`}
                    className="text-xs text-primary underline ml-2 font-medium"
                  >
                    Clear all
                  </Link>
                </div>
              )}

              {/* Product Grid */}
              {products.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground border border-dashed border-border p-8">
                  <p className="text-base font-medium text-foreground mb-2">No products match your selected filters.</p>
                  <p className="text-sm text-muted-foreground mb-6">Try clearing some filters or browsing all collections.</p>
                  <Link
                    href="/collections"
                    className="inline-block text-xs uppercase tracking-wider font-semibold px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Reset all filters
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-2 gap-y-6 sm:gap-x-4 sm:gap-y-8">
                  {products.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      brand={prod.brand}
                      name={prod.name}
                      price={prod.price}
                      imageSrc={prod.imageSrc}
                      href={`/collections/${prod.slug}`}
                    />
                  ))}
                </div>
              )}

              {/* Server-side Pagination */}
              {totalPages > 1 && (
                <div className="mt-16 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      {currentPage > 1 ? (
                        <PaginationItem>
                          <PaginationPrevious
                            href={buildPageHref(currentPage - 1)}
                          />
                        </PaginationItem>
                      ) : null}

                      {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pNum) => (
                        <PaginationItem key={pNum}>
                          <PaginationLink
                            href={buildPageHref(pNum)}
                            isActive={pNum === currentPage}
                          >
                            {pNum}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      {currentPage < totalPages ? (
                        <PaginationItem>
                          <PaginationNext
                            href={buildPageHref(currentPage + 1)}
                          />
                        </PaginationItem>
                      ) : null}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <StoreFooter />
    </div>
  )
}
