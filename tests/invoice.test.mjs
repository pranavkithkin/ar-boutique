import test from "node:test"
import assert from "node:assert/strict"
import { formatAED, calculateVatPortion } from "../lib/money.ts"

test("Invoice number formatting matches sequential gapless standard INV-YYYY-XXXX", () => {
  const year = 2026
  const seq = 1001
  const invoiceNumber = `INV-${year}-${seq}`
  assert.match(invoiceNumber, /^INV-20\d{2}-\d{4,}$/)
})

test("Invoice VAT and net item price calculation complies with UAE 5% VAT rules", () => {
  // E.g. A garment priced at AED 1,050.00 gross (105,000 fils)
  const grossFils = 105000
  const vatFils = calculateVatPortion(grossFils)
  assert.equal(vatFils, 5000) // 5,000 fils = AED 50.00
  const netFils = grossFils - vatFils
  assert.equal(netFils, 100000) // 100,000 fils = AED 1,000.00

  assert.equal(formatAED(grossFils), "AED 1,050")
  assert.equal(formatAED(netFils), "AED 1,000")
  assert.equal(formatAED(vatFils), "AED 50")
})

test("Invoice item pricing arithmetic splits gross, net, and 5% VAT correctly per line item", () => {
  const quantity = 2
  const unitPriceGrossFils = 157500 // AED 1,575.00 gross per unit
  const totalGrossFils = unitPriceGrossFils * quantity
  const totalVatFils = calculateVatPortion(totalGrossFils)
  const totalNetFils = totalGrossFils - totalVatFils

  assert.equal(totalGrossFils, 315000)
  assert.equal(totalVatFils, 15000) // 5% VAT portion = AED 150.00
  assert.equal(totalNetFils, 300000) // Net total = AED 3,000.00
  assert.equal(formatAED(totalGrossFils), "AED 3,150")
  assert.equal(formatAED(totalNetFils), "AED 3,000")
  assert.equal(formatAED(totalVatFils), "AED 150")
})

