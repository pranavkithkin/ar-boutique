export interface TrackingMilestones {
  status: string
  payment_method?: string
  created_at?: string | null
  confirmed_at?: string | null
  packed_at?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
  cancelled_at?: string | null
  returned_at?: string | null
}

export interface TrackingTimelineStep {
  id: string
  label: string
  state: "complete" | "current" | "upcoming"
  occurredAt: string | null
}

const milestones = [
  { id: "placed", label: "Order placed", date: "created_at" },
  { id: "confirmed", label: "Confirmed", date: "confirmed_at" },
  { id: "packed", label: "Packed", date: "packed_at" },
  { id: "shipped", label: "Shipped", date: "shipped_at" },
  { id: "delivered", label: "Delivered", date: "delivered_at" },
] as const

function validTimestamp(value: string | null | undefined): string | null {
  return value && Number.isFinite(Date.parse(value)) ? value : null
}

export function buildTrackingTimeline(order: TrackingMilestones): TrackingTimelineStep[] {
  const terminalLabels: Record<string, string> = {
    cancelled: "Cancelled", expired: "Expired", returned: "Returned", returned_to_sender: "Returned to sender",
  }
  const terminalLabel = terminalLabels[order.status]
  const currentIndex = milestones.findIndex(step => step.id === order.status)
  const pending = ["pending", "pending_payment", "awaiting_confirmation"].includes(order.status)
  const steps: TrackingTimelineStep[] = []

  for (const [index, step] of milestones.entries()) {
    const occurredAt = validTimestamp(order[step.date])
    // Terminal orders show only milestones with evidence; no promised future delivery steps.
    if (terminalLabel && index !== 0 && !occurredAt) continue
    steps.push({
      id: step.id,
      label: pending && order.payment_method === "cod" && step.id === "confirmed" ? "Awaiting confirmation" : step.label,
      state: !terminalLabel && (index === currentIndex || (pending && order.payment_method === "cod" && index === 1))
        ? "current"
        : occurredAt || index === 0 || (currentIndex >= 0 && index < currentIndex) ? "complete" : "upcoming",
      occurredAt,
    })
  }

  if (pending && order.payment_method !== "cod") {
    steps.splice(1, 0, { id: "payment", label: "Awaiting payment", state: "current", occurredAt: null })
  }
  if (terminalLabel) {
    const terminalDate = order.status === "cancelled" ? order.cancelled_at
      : order.status === "returned" || order.status === "returned_to_sender" ? order.returned_at : null
    steps.push({ id: order.status, label: terminalLabel, state: "current", occurredAt: validTimestamp(terminalDate) })
  }
  return steps
}
