import { z } from "zod"

export const orderTrackingSchema = z.object({
  orderId: z
    .string()
    .trim()
    .min(3, "Enter your Order Number (e.g. AR-1001) or Order ID.")
    .max(64, "Order Number or ID is too long.")
    .refine(
      (val) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val) ||
        /^AR-?[0-9]+$/i.test(val) ||
        /^[0-9]+$/.test(val),
      { message: "Enter a valid Order Number (e.g. AR-1001) or Order ID." }
    ),
  email: z
    .string()
    .trim()
    .max(254)
    .email("Enter the email used at checkout.")
    .transform((value) => value.toLowerCase()),
})

export type OrderTrackingInput = z.input<typeof orderTrackingSchema>
