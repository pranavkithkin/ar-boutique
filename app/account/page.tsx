import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"
import { isClerkConfigured } from "@/lib/clerk"
import { getCurrentCustomerAction } from "@/features/auth/actions"
import { getCustomerAccountDataAction } from "@/features/account/actions"
import type {
  AccountUserProfile,
  AccountOrder,
  AccountAddress,
} from "@/features/account/types"
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
import { getStoreSettings } from "@/features/admin/settings/actions"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Account | AR Boutique",
  description:
    "Manage your orders, track active shipments, update UAE delivery addresses, and customize your boutique preferences.",
}

export default async function AccountPage() {
  let email: string | undefined
  let fullName: string | undefined
  let phone: string | undefined

  if (isClerkConfigured()) {
    try {
      const { userId } = await auth()
      if (userId) {
        const clerkUser = await currentUser()
        if (clerkUser) {
          email = clerkUser.primaryEmailAddress?.emailAddress
          fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || undefined
          phone = clerkUser.primaryPhoneNumber?.phoneNumber || undefined
        }
      }
    } catch (authErr) {
      console.warn("Clerk auth resolution in AccountPage:", authErr)
    }
  }

  // Fallback to customer session cookie if Clerk session is not present
  if (!email) {
    try {
      const customer = await getCurrentCustomerAction()
      if (customer) {
        email = customer.email
        fullName = `${customer.firstName} ${customer.lastName}`.trim() || undefined
        phone = customer.phone || undefined
      }
    } catch {
      // Ignore
    }
  }

  // If unauthenticated, redirect to sign-in
  if (!email) {
    redirect("/sign-in?redirect=/account")
  }

  // Server-side hydration of customer profile, orders, and addresses
  let initialProfile: AccountUserProfile = {
    id: "",
    firstName: fullName?.split(" ")[0] || "",
    lastName: fullName?.split(" ").slice(1).join(" ") || "",
    email: email,
    phone: phone || "",
    memberSince: "2026",
    tier: "Member",
    preferredLanguage: "en",
    notifyWhatsApp: true,
    notifyEmail: true,
  }
  let initialOrders: AccountOrder[] = []
  let initialAddresses: AccountAddress[] = []
  let returnWindowDays = 7

  try {
    const [accountData, settings] = await Promise.all([
      getCustomerAccountDataAction(email, { fullName, phone }),
      getStoreSettings(),
    ])
    if (accountData.success) {
      if (accountData.profile) initialProfile = accountData.profile
      if (accountData.orders) initialOrders = accountData.orders
      if (accountData.addresses) initialAddresses = accountData.addresses
    }
    if (settings && typeof settings.return_window_days === "number") {
      returnWindowDays = settings.return_window_days
    }
  } catch (err) {
    console.error("Failed to load customer account data on server:", err)
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

        {/* Interactive Account Workspace with server-hydrated data */}
        <AccountView
          initialProfile={initialProfile}
          initialOrders={initialOrders}
          initialAddresses={initialAddresses}
          returnWindowDays={returnWindowDays}
        />
      </main>

      <StoreFooter />
    </div>
  )
}
