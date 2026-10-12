import type { Metadata } from "next"
import { ComingSoon } from "@/components/store/ComingSoon"

export const metadata: Metadata = {
  title: "Returns Policy | AR Boutique",
  description: "Returns and exchange policy for AR Boutique.",
}

export default function ReturnsPage() {
  return <ComingSoon title="Returns & Exchanges" />
}
