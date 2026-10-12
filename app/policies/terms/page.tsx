import type { Metadata } from "next"
import { ComingSoon } from "@/components/store/ComingSoon"

export const metadata: Metadata = {
  title: "Terms & Conditions | AR Boutique",
  description: "Terms and conditions for AR Boutique customers.",
}

export default function TermsPage() {
  return <ComingSoon title="Terms & Conditions" />
}
