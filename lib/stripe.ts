import "server-only"
import Stripe from "stripe"

let stripeInstance: Stripe | null = null

/**
 * Returns the singleton server-side Stripe SDK client.
 * Throws a helpful error if STRIPE_SECRET_KEY is not configured in .env.
 */
export function getStripeServer(): Stripe {
  if (stripeInstance) {
    return stripeInstance
  }

  const apiKey = process.env.STRIPE_SECRET_KEY
  if (!apiKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured in the environment variables. Please check your .env file."
    )
  }

  stripeInstance = new Stripe(apiKey, {
    apiVersion: "2025-02-24.acacia" as any,
    appInfo: {
      name: "The AR Boutique Dubai",
      version: "1.0.0",
    },
  })

  return stripeInstance
}

