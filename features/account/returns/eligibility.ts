import type { OrderReturnEligibility, OrderItemReturnEligibility } from "./types"

export const RETURN_WINDOW_DAYS = 7

export interface OrderItemForEligibility {
  id: string
  quantity: number
  isFinalSale?: boolean
}

export interface OrderForEligibility {
  id: string
  orderNumber: string
  status: string
  deliveredAt?: string | null
  createdAt: string
  items: OrderItemForEligibility[]
}

export interface ExistingReturnedItem {
  orderItemId: string
  quantity: number
  status: string // 'requested' | 'approved' | 'received' | 'rejected' | 'closed'
}

/**
 * Pure evaluation of return eligibility for an order and its items.
 */
export function evaluateOrderReturnEligibility(
  order: OrderForEligibility,
  existingReturnedItems: ExistingReturnedItem[] = [],
  currentTime: Date = new Date()
): OrderReturnEligibility {
  // 1. Must be delivered
  if (order.status !== "delivered") {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      isEligible: false,
      ineligibleReason:
        order.status === "shipped"
          ? "Garments are currently in transit. You can initiate a return once doorstep delivery is completed."
          : "Only delivered orders are eligible for return.",
      items: order.items.map((it) => ({
        orderItemId: it.id,
        isEligible: false,
        ineligibleReason: "Order has not yet been delivered.",
        orderedQuantity: it.quantity,
        alreadyReturnedQuantity: 0,
        maxReturnableQuantity: 0,
      })),
    }
  }

  // 2. Check 7-day return window
  const deliveryIso = order.deliveredAt || order.createdAt
  const deliveryDate = new Date(deliveryIso)
  const diffMs = currentTime.getTime() - deliveryDate.getTime()
  const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (daysElapsed > RETURN_WINDOW_DAYS) {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      isEligible: false,
      ineligibleReason: `The ${RETURN_WINDOW_DAYS}-day return window expired on ${new Date(
        deliveryDate.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000
      ).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.`,
      deliveredAt: deliveryIso,
      daysRemaining: 0,
      items: order.items.map((it) => ({
        orderItemId: it.id,
        isEligible: false,
        ineligibleReason: "Return window has expired.",
        orderedQuantity: it.quantity,
        alreadyReturnedQuantity: 0,
        maxReturnableQuantity: 0,
      })),
    }
  }

  const daysRemaining = Math.max(0, RETURN_WINDOW_DAYS - daysElapsed)

  // 3. Map returned quantities per item
  const returnedCountMap = new Map<string, number>()
  for (const ret of existingReturnedItems) {
    if (ret.status !== "rejected") {
      const current = returnedCountMap.get(ret.orderItemId) || 0
      returnedCountMap.set(ret.orderItemId, current + ret.quantity)
    }
  }

  const itemEligibilities: OrderItemReturnEligibility[] = order.items.map((it) => {
    if (it.isFinalSale) {
      return {
        orderItemId: it.id,
        isEligible: false,
        ineligibleReason: "Final Sale garments are non-returnable.",
        orderedQuantity: it.quantity,
        alreadyReturnedQuantity: 0,
        maxReturnableQuantity: 0,
      }
    }

    const alreadyReturned = returnedCountMap.get(it.id) || 0
    const returnable = Math.max(0, it.quantity - alreadyReturned)

    if (returnable <= 0) {
      return {
        orderItemId: it.id,
        isEligible: false,
        ineligibleReason: "All units of this piece have already been submitted for return.",
        orderedQuantity: it.quantity,
        alreadyReturnedQuantity: alreadyReturned,
        maxReturnableQuantity: 0,
      }
    }

    return {
      orderItemId: it.id,
      isEligible: true,
      orderedQuantity: it.quantity,
      alreadyReturnedQuantity: alreadyReturned,
      maxReturnableQuantity: returnable,
    }
  })

  const hasEligibleItems = itemEligibilities.some((it) => it.isEligible)

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    isEligible: hasEligibleItems,
    ineligibleReason: hasEligibleItems
      ? undefined
      : "No eligible items remain for return on this order.",
    deliveredAt: deliveryIso,
    daysRemaining,
    items: itemEligibilities,
  }
}
