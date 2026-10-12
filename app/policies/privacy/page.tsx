import type { Metadata } from "next"
import { ComingSoon } from "@/components/store/ComingSoon"

export const metadata: Metadata = {
  title: "Privacy Policy | AR Boutique",
  description: "Privacy policy and data protection for AR Boutique customers.",
}

export default function PrivacyPage() {
  return <ComingSoon title="Privacy Policy" />
}
