import * as React from "react"
import { Metadata } from "next"
import { StoreHeader } from "@/components/store/StoreHeader"
import { StoreFooter } from "@/components/store/StoreFooter"
import { CartView } from "@/features/cart/components/CartView"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export const metadata: Metadata = {
  title: "Shopping Bag | AR Boutique",
  description: "Review items in your luxury shopping bag before proceeding to secure checkout.",
}

export default function CartPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StoreHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb Navigation */}
          <div className="mb-8">
            <Breadcrumb>
              <BreadcrumbList className="text-xs sm:text-sm">
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="text-muted-foreground hover:text-foreground">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-foreground font-medium">Shopping Bag</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="mb-10">
            <h1 className="font-heading text-3xl sm:text-4xl text-foreground font-normal tracking-tight">
              Shopping Bag
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Review your selected pieces, adjust quantities, and proceed to checkout.
            </p>
          </div>

          <CartView />
        </div>
      </main>

      <StoreFooter />
    </div>
  )
}
