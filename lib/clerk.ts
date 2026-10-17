/**
 * Verifies whether real, valid Clerk authentication credentials are configured.
 */
export function isClerkConfigured(): boolean {
  const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  if (!pubKey) return false

  // Reject dummy placeholders
  if (
    pubKey.includes("placeholder") ||
    pubKey === "pk_test_placeholder" ||
    (!pubKey.startsWith("pk_test_") && !pubKey.startsWith("pk_live_")) ||
    pubKey.length < 20
  ) {
    return false
  }

  return true
}
