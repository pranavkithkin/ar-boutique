"use server"

import { orderTrackingSchema } from "./schemas"
import { findTrackedOrder, type TrackedOrder } from "./service"

export type TrackingResult =
  | { success: true; order: TrackedOrder }
  | { success: false; error: string }

export async function trackOrderAction(input: unknown): Promise<TrackingResult> {
  const parsed = orderTrackingSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "Enter a valid Order ID and checkout email." }
  }

  try {
    const order = await findTrackedOrder(parsed.data.orderId, parsed.data.email)
    if (!order) {
      return { success: false, error: "No matching order found. Check your Order ID and checkout email." }
    }
    return { success: true, order }
  } catch {
    return { success: false, error: "We couldn’t check your order right now. Please try again." }
  }
}
