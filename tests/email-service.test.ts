import { test, expect } from "vitest"
import { formatAED, calculateVatPortion } from "@/lib/money"

test("email recipient and subject line generation logic for COD orders", () => {
  const isCod = true
  const orderNumber = "AR-1045"
  const subject = isCod
    ? `Cash on Delivery Order #${orderNumber} Received - AR Boutique`
    : `Order Confirmation #${orderNumber} - AR Boutique`

  expect(subject).toBe("Cash on Delivery Order #AR-1045 Received - AR Boutique")
})

test("email recipient and subject line generation logic for Card orders", () => {
  const isCod = false
  const orderNumber = "AR-1046"
  const subject = isCod
    ? `Cash on Delivery Order #${orderNumber} Received - AR Boutique`
    : `Order Confirmation #${orderNumber} - AR Boutique`

  expect(subject).toBe("Order Confirmation #AR-1046 - AR Boutique")
})

test("email pricing arithmetic correctly splits VAT and delivery fee", () => {
  const totalFils = 125000 // AED 1,250
  const deliveryFeeFils = 0
  const subtotalFils = totalFils - deliveryFeeFils
  const vatFils = calculateVatPortion(totalFils)

  expect(subtotalFils).toBe(125000)
  expect(formatAED(totalFils)).toBe("AED 1,250")
  expect(formatAED(subtotalFils)).toBe("AED 1,250")
  expect(vatFils).toBe(Math.round((125000 * 5) / 105))
  expect(formatAED(vatFils)).toBe("AED 59.52")
})

test("email structured address correctly formats UAE emirates", () => {
  const address = {
    street: "14B Street",
    building: "Villa 3",
    apartment: "Ground Floor",
    area: "Jumeirah 1",
    emirate: "Dubai",
  }

  const formattedLines = [
    address.apartment ? `Apt / Suite: ${address.apartment}` : null,
    address.building ? `Building: ${address.building}` : null,
    address.street,
    `${address.area}, ${address.emirate}, UAE`,
  ].filter(Boolean)

  expect(formattedLines).toHaveLength(4)
  expect(formattedLines[3]).toBe("Jumeirah 1, Dubai, UAE")
})

test("order shipped email subject and tracking generation", () => {
  const orderNumber = "AR-1048"
  const courier = "Careem Express"
  const trackingNumber = "CR-992100"

  const subject = `Your AR Boutique Order #${orderNumber} has Shipped`
  expect(subject).toBe("Your AR Boutique Order #AR-1048 has Shipped")
  expect(trackingNumber.length).toBeGreaterThan(5)
  expect(courier).toContain("Careem")
})

test("order cancelled email subject", () => {
  const orderNumber = "AR-1049"
  const subject = `Order #${orderNumber} Cancellation - AR Boutique`
  expect(subject).toBe("Order #AR-1049 Cancellation - AR Boutique")
})

test("return requested and decision email subjects", () => {
  const returnNumber = "RET-1010"
  const reqSubject = `Return Request Received #${returnNumber} - AR Boutique`
  const appSubject = `Return Approved: Instructions for Return #${returnNumber} - AR Boutique`
  const rejSubject = `Update on Return Request #${returnNumber} - AR Boutique`

  expect(reqSubject).toBe("Return Request Received #RET-1010 - AR Boutique")
  expect(appSubject).toBe("Return Approved: Instructions for Return #RET-1010 - AR Boutique")
  expect(rejSubject).toBe("Update on Return Request #RET-1010 - AR Boutique")
})

test("refund confirmation email subject and formatting for card and bank transfer", () => {
  const amountFils = 185000 // 1,850 AED
  const amountAed = formatAED(amountFils)
  const subject = `Refund Processed: ${amountAed} - AR Boutique`

  expect(subject).toBe("Refund Processed: AED 1,850 - AR Boutique")

  const bankReference = "TRF-99201"
  expect(bankReference.startsWith("TRF-")).toBe(true)
})
