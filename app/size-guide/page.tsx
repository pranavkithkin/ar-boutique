import type { Metadata } from "next"
import { ComingSoon } from "@/components/store/ComingSoon"

export const metadata: Metadata = {
  title: "Size Guide | AR Boutique",
  description: "Measurement and size guide for AR Boutique collections.",
}

export default function SizeGuidePage() {
  return <ComingSoon title="Size Guide" />
}
