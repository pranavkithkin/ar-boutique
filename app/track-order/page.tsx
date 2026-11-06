import type { Metadata } from "next"
import { AnnouncementBar } from "@/components/store/AnnouncementBar"
import { StoreHeader } from "@/components/store/StoreHeader"
import { StoreFooter } from "@/components/store/StoreFooter"
import { OrderTrackingForm } from "@/features/order-tracking/components/OrderTrackingForm"

export const metadata: Metadata = {
  title: "Track Your Order | AR Boutique",
  description: "Check your order status using your unique Order ID and checkout email.",
  robots: { index: false, follow: false },
}

export default function TrackOrderPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBar />
      <StoreHeader />
      <main className="mx-auto w-full max-w-xl flex-1 space-y-8 px-4 py-12 sm:px-6 sm:py-16">
        <div className="space-y-3 text-center">
          <h1 className="font-heading text-3xl sm:text-4xl">Track Your Order</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">Enter your Order Number (e.g. AR-1001) and the email you used at checkout to see your latest order status.</p>
        </div>
        <OrderTrackingForm />
      </main>
      <StoreFooter />
    </div>
  )
}
