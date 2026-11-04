/**
 * Pure utility functions for admin orders presentation and formatting.
 */

export function formatActorLabel(actorSub: string, customerName?: string): string {
  if (!actorSub) return "System"
  if (actorSub === "admin") return "Boutique Staff (Admin)"
  if (actorSub === "system_resend") return "Automated Email (Resend)"
  if (actorSub === "storefront_shopper") return "Customer (Guest Checkout)"
  if (actorSub.startsWith("user_")) {
    return customerName ? `Customer (${customerName})` : "Customer (Signed-in Account)"
  }
  return actorSub
}
