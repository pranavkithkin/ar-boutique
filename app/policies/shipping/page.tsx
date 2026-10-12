import type { Metadata } from "next"
import { ComingSoon } from "@/components/store/ComingSoon"

export const metadata: Metadata = {
  title: "Shipping & Delivery | AR Boutique",
  description: "Shipping and delivery policy for AR Boutique across the UAE.",
}

export default function ShippingPage() {
  return <ComingSoon title="Shipping & Delivery" />
}
