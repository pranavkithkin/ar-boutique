import type { Metadata } from "next"
import { AnnouncementBar } from "@/components/store/AnnouncementBar"
import { StoreHeader } from "@/components/store/StoreHeader"
import { StoreFooter } from "@/components/store/StoreFooter"
import { CheckoutView } from "@/features/checkout/components/CheckoutView"
import { getCheckoutInitialDataAction } from "@/features/checkout/actions"

export const metadata: Metadata = {
  title: "Secure Checkout | AR Boutique",
  description:
    "Complete your luxury order with secure card payment or cash on delivery across all seven UAE Emirates.",
}

export default async function CheckoutPage() {
  const { config, customerContext } = await getCheckoutInitialDataAction()

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 pb-16">
        <CheckoutView config={config} customerContext={customerContext} />
      </main>

      <StoreFooter />
    </div>
  )
}
