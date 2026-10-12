import type { Metadata } from "next"
import { ComingSoon } from "@/components/store/ComingSoon"

export const metadata: Metadata = {
  title: "Password Recovery | AR Boutique",
  description: "Reset your AR Boutique account password.",
}

export default function ForgotPasswordPage() {
  return <ComingSoon title="Password Recovery" />
}
