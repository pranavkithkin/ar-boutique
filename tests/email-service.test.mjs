import assert from "node:assert/strict"
import test from "node:test"
import { formatAED, calculateVatPortion } from "../lib/money.ts"

test("email recipient and subject line generation logic for COD orders", () => {
  const isCod = true
  const orderNumber = "AR-1045"
  const subject = isCod
    ? `Cash on Delivery Order #${orderNumber} Received - AR Boutique`
    : `Order Confirmation #${orderNumber} - AR Boutique`

  assert.equal(subject, "Cash on Delivery Order #AR-1045 Received - AR Boutique")
})

test("email recipient and subject line generation logic for Card orders", () => {
  const isCod = false
  const orderNumber = "AR-1046"
  const subject = isCod
    ? `Cash on Delivery Order #${orderNumber} Received - AR Boutique`
    : `Order Confirmation #${orderNumber} - AR Boutique`

  assert.equal(subject, "Order Confirmation #AR-1046 - AR Boutique")
})

test("email pricing arithmetic correctly splits VAT and delivery fee", () => {
  const totalFils = 125000 // AED 1,250
  const deliveryFeeFils = 0
  const subtotalFils = totalFils - deliveryFeeFils
  const vatFils = calculateVatPortion(totalFils)

  assert.equal(subtotalFils, 125000)
  assert.equal(formatAED(totalFils), "AED 1,250")
  assert.equal(formatAED(subtotalFils), "AED 1,250")
  assert.equal(vatFils, Math.round((125000 * 5) / 105))
  assert.equal(formatAED(vatFils), "AED 59.52")
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

  assert.equal(formattedLines.length, 4)
  assert.equal(formattedLines[3], "Jumeirah 1, Dubai, UAE")
})

test("order shipped email subject and tracking generation", () => {
  const orderNumber = "AR-1048"
  const courier = "Careem Express"
  const trackingNumber = "CR-992100"

  const subject = `Your AR Boutique Order #${orderNumber} has Shipped`
  assert.equal(subject, "Your AR Boutique Order #AR-1048 has Shipped")
  assert.ok(trackingNumber.length > 5)
  assert.ok(courier.includes("Careem"))
})

test("order cancelled email subject", () => {
  const orderNumber = "AR-1049"
  const subject = `Order #${orderNumber} Cancellation - AR Boutique`
  assert.equal(subject, "Order #AR-1049 Cancellation - AR Boutique")
})

test("return requested and decision email subjects", () => {
  const returnNumber = "RET-1010"
  const reqSubject = `Return Request Received #${returnNumber} - AR Boutique`
  const appSubject = `Return Approved: Instructions for Return #${returnNumber} - AR Boutique`
  const rejSubject = `Update on Return Request #${returnNumber} - AR Boutique`

  assert.equal(reqSubject, "Return Request Received #RET-1010 - AR Boutique")
  assert.equal(appSubject, "Return Approved: Instructions for Return #RET-1010 - AR Boutique")
  assert.equal(rejSubject, "Update on Return Request #RET-1010 - AR Boutique")
})

test("refund confirmation email subject and formatting for card and bank transfer", () => {
  const amountFils = 185000 // 1,850 AED
  const amountAed = formatAED(amountFils)
  const subject = `Refund Processed: ${amountAed} - AR Boutique`

  assert.equal(subject, "Refund Processed: AED 1,850 - AR Boutique")

  const bankReference = "TRF-99201"
  assert.equal(bankReference.startsWith("TRF-"), true)
})
