import { expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { OrderConfirmationEmail, type OrderConfirmationEmailProps } from "@/components/emails/OrderConfirmationEmail"

const orderId = "590095e2-7283-45d1-80b3-723dc50527b3"
const emailProps: OrderConfirmationEmailProps = {
  orderId,
  trackingUrl: "https://www.thearboutique.com/track-order",
  orderNumber: "AR-1001",
  orderDate: "6 November 2026",
  customerName: "Test Customer",
  customerEmail: "guest@example.com",
  paymentMethod: "card",
  items: [],
  subtotalAed: "AED 100",
  deliveryFeeAed: "AED 25",
  vatAed: "AED 0",
  totalAed: "AED 125",
  address: { street: "Test Street", area: "Test Area", emirate: "Dubai" },
}

it.each(["card", "cod"] as const)("includes the UUID and tracking page in %s confirmations", (paymentMethod) => {
  const html = renderToStaticMarkup(OrderConfirmationEmail({ ...emailProps, paymentMethod }))
  expect(html).toContain(`Order ID: <strong>${orderId}</strong>`)
  expect(html).toContain('href="https://www.thearboutique.com/track-order"')
  expect(html).toContain("Use this ID and your checkout email")
})

it("preserves existing email callers that do not supply tracking information", () => {
  const html = renderToStaticMarkup(OrderConfirmationEmail({ ...emailProps, orderId: undefined, trackingUrl: undefined }))
  expect(html).toContain("AR-1001")
  expect(html).not.toContain("Order ID:")
})
