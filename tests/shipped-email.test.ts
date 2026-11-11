import { expect, test } from "vitest"
import { render } from "@react-email/components"
import { OrderShippedEmail } from "@/components/emails/OrderShippedEmail"

const props = {
  orderNumber: "AR-TEST",
  customerName: "Test Customer",
  deliveryAddress: "Test delivery address",
  items: [],
}

test("shipping email never invents missing courier or tracking details", async () => {
  const html = await render(OrderShippedEmail(props))
  expect(html).not.toContain("CR-98721345")
  expect(html).not.toContain("Careem Express")
  expect(html).not.toContain("Express Boutique Courier")
  expect(html).not.toContain("COURIER PARTNER")
  expect(html).toContain("Tracking details are not available yet.")
})

test("shipping email displays supplied shipping details", async () => {
  const html = await render(OrderShippedEmail({ ...props, courier: "Actual Courier", trackingNumber: "TEST-123" }))
  expect(html).toContain("Actual Courier")
  expect(html).toContain("TEST-123")
  expect(html).not.toContain("Tracking details are not available yet.")
})

test("blank shipping details use the same missing-data message", async () => {
  const html = await render(OrderShippedEmail({ ...props, courier: "  ", trackingNumber: "  " }))
  expect(html).not.toContain("COURIER PARTNER")
  expect(html).toContain("Tracking details are not available yet.")
})
