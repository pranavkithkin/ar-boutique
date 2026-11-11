import { expect, test } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { buildTrackingTimeline } from "@/features/order-tracking/timeline"
import { OrderTimeline } from "@/features/order-tracking/components/OrderTimeline"

const placed = "2026-11-11T06:00:00Z"
const shipped = "2026-11-12T07:30:00Z"

test("pending COD shows placement, awaiting confirmation and upcoming delivery steps", () => {
  const steps = buildTrackingTimeline({ status: "pending", payment_method: "cod", created_at: placed })
  expect(steps.map(s => [s.id, s.state])).toEqual([
    ["placed", "complete"], ["confirmed", "current"], ["packed", "upcoming"], ["shipped", "upcoming"], ["delivered", "upcoming"],
  ])
  expect(steps[1].label).toBe("Awaiting confirmation")
  expect(steps[1].occurredAt).toBeNull()
})

test("unpaid card orders show payment pending before confirmation", () => {
  const steps = buildTrackingTimeline({ status: "pending", payment_method: "card", created_at: placed })
  expect(steps[1]).toEqual({ id: "payment", label: "Awaiting payment", state: "current", occurredAt: null })
  expect(steps[2].state).toBe("upcoming")
})

test("shipped orders show prior progress without inventing missing timestamps", () => {
  const steps = buildTrackingTimeline({ status: "shipped", created_at: placed, shipped_at: shipped })
  expect(steps.find(s => s.id === "confirmed")).toMatchObject({ state: "complete", occurredAt: null })
  expect(steps.find(s => s.id === "shipped")).toMatchObject({ state: "current", occurredAt: shipped })
  expect(steps.find(s => s.id === "delivered")?.state).toBe("upcoming")
})

test("cancelled orders do not promise packing, shipping or delivery", () => {
  const steps = buildTrackingTimeline({ status: "cancelled", created_at: placed, cancelled_at: shipped })
  expect(steps.map(s => s.id)).toEqual(["placed", "cancelled"])
  expect(steps.at(-1)).toMatchObject({ state: "current", occurredAt: shipped })
})

test("returned orders preserve completed delivery evidence", () => {
  const steps = buildTrackingTimeline({ status: "returned", delivered_at: shipped, returned_at: "2026-11-13T00:00:00Z" })
  expect(steps.find(s => s.id === "delivered")?.state).toBe("complete")
  expect(steps.at(-1)?.label).toBe("Returned")
})

test("invalid or absent timestamps are not displayed as dates", () => {
  const steps = buildTrackingTimeline({ status: "confirmed", created_at: "bad-date", confirmed_at: null })
  expect(steps.every(s => s.occurredAt === null)).toBe(true)
  expect(renderToStaticMarkup(OrderTimeline({ steps }))).not.toContain("Invalid Date")
})

test("timeline renders semantic steps with actual timestamps in UAE time", () => {
  const steps = buildTrackingTimeline({ status: "shipped", created_at: placed, shipped_at: shipped })
  const html = renderToStaticMarkup(OrderTimeline({ steps }))
  expect(html).toContain('aria-current="step"')
  expect(html).toContain(`dateTime="${shipped}"`)
  expect(html).toContain("11:30")
  expect(html).toContain("Times shown in UAE time.")
  expect(html).toContain("Not yet reached")
})
