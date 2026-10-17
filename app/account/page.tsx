import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { isClerkConfigured } from "@/lib/clerk"
import { getCurrentCustomerAction } from "@/features/auth/actions"
import { AnnouncementBar } from "@/components/store/AnnouncementBar"
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
import { AccountView } from "@/features/account/components/AccountView"

export const metadata: Metadata = {
  title: "Account | AR Boutique",
  description:
    "Manage your orders, track active shipments, update UAE delivery addresses, and customize your boutique preferences.",
}

export default async function AccountPage() {
  if (isClerkConfigured()) {
    const { userId } = await auth()
    if (!userId) {
      redirect("/sign-in?redirect=/account")
    }
  } else {
    const customer = await getCurrentCustomerAction()
    if (!customer) {
      redirect("/sign-in?redirect=/account")
    }
  }
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 pb-20">
        {/* Standardized Hero Masthead */}
        <section className="border-b border-border/50 bg-muted/20 py-8 md:py-12">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb className="mb-4 md:mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="hover:text-foreground">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Account</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <h1 className="text-3xl md:text-4xl font-sans font-semibold tracking-tight text-foreground">
              Account
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl leading-relaxed">
              Manage your orders, track doorstep deliveries, update UAE addresses, and access bespoke concierge care.
            </p>
          </div>
        </section>

        {/* Interactive Account Workspace */}
        <AccountView />
      </main>

      <StoreFooter />
    </div>
  )
}
