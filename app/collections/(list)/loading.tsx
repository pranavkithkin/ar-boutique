import { AnnouncementBar } from "@/components/store/AnnouncementBar"
import { StoreHeader } from "@/components/store/StoreHeader"
import { StoreFooter } from "@/components/store/StoreFooter"
import { SidebarFilters } from "@/components/store/SidebarFilters"
import { ProductGridSkeleton } from "@/components/store/ProductSkeleton"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function CollectionsLoading() {
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
              <SidebarFilters />
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar skeleton */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
                <Skeleton className="h-5 w-36" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-12 hidden sm:inline-block" />
                  <Skeleton className="h-8 w-[180px]" />
                </div>
              </div>

              {/* Grid Skeleton */}
              <ProductGridSkeleton count={12} />

              {/* Pagination Skeleton */}
              <div className="mt-16 flex justify-center gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <StoreFooter />
    </div>
  )
}
