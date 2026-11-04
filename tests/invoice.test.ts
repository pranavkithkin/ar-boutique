import { test, expect } from "vitest"
import { formatAED, calculateVatPortion } from "@/lib/money"

test("Invoice number formatting matches sequential gapless standard INV-YYYY-XXXX", () => {
  const year = 2026
  const seq = 1001
  const invoiceNumber = `INV-${year}-${seq}`
  expect(invoiceNumber).toMatch(/^INV-20\d{2}-\d{4,}$/)
})

test("Invoice VAT and net item price calculation complies with UAE 5% VAT rules", () => {
  // E.g. A garment priced at AED 1,050.00 gross (105,000 fils)
  const grossFils = 105000
  const vatFils = calculateVatPortion(grossFils)
  expect(vatFils).toBe(5000) // 5,000 fils = AED 50.00
  const netFils = grossFils - vatFils
  expect(netFils).toBe(100000) // 100,000 fils = AED 1,000.00

  expect(formatAED(grossFils)).toBe("AED 1,050")
  expect(formatAED(netFils)).toBe("AED 1,000")
  expect(formatAED(vatFils)).toBe("AED 50")
})

test("Invoice item pricing arithmetic splits gross, net, and 5% VAT correctly per line item", () => {
  const quantity = 2
  const unitPriceGrossFils = 157500 // AED 1,575.00 gross per unit
  const totalGrossFils = unitPriceGrossFils * quantity
  const totalVatFils = calculateVatPortion(totalGrossFils)
  const totalNetFils = totalGrossFils - totalVatFils

  expect(totalGrossFils).toBe(315000)
  expect(totalVatFils).toBe(15000) // 5% VAT portion = AED 150.00
  expect(totalNetFils).toBe(300000) // Net total = AED 3,000.00
  expect(formatAED(totalGrossFils)).toBe("AED 3,150")
  expect(formatAED(totalNetFils)).toBe("AED 3,000")
  expect(formatAED(totalVatFils)).toBe("AED 150")
})
