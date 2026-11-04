import { test, expect } from "vitest"
import { formatActorLabel } from "@/features/admin/orders/utils"

test("formatActorLabel: formats signed-in customer Clerk user IDs with name", () => {
  const result = formatActorLabel("user_3KozGw490YSgc6FlZ4jrAH5ylcy", "Vivek VR")
  expect(result).toBe("Customer (Vivek VR)")
})

test("formatActorLabel: formats signed-in customer Clerk user IDs without name fallback", () => {
  const result = formatActorLabel("user_3KozGw490YSgc6FlZ4jrAH5ylcy")
  expect(result).toBe("Customer (Signed-in Account)")
})

test("formatActorLabel: formats guest shopper, admin, and system actions", () => {
  expect(formatActorLabel("storefront_shopper")).toBe("Customer (Guest Checkout)")
  expect(formatActorLabel("admin")).toBe("Boutique Staff (Admin)")
  expect(formatActorLabel("system_resend")).toBe("Automated Email (Resend)")
  expect(formatActorLabel("")).toBe("System")
})
