import type { Metadata } from "next"
import { ComingSoon } from "@/components/store/ComingSoon"

export const metadata: Metadata = {
  title: "Account | AR Boutique",
  description: "Account features coming soon to AR Boutique.",
}

export default function AccountPage() {
  return <ComingSoon title="Account" />
}
