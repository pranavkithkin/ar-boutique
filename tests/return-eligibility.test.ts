import { test, expect } from "vitest"
import {
  evaluateOrderReturnEligibility,
  RETURN_WINDOW_DAYS,
} from "@/features/account/returns/eligibility"
import { customerReturnFormSchema } from "@/features/account/returns/schemas"

test("evaluateOrderReturnEligibility: approves delivered orders within 14 days", () => {
  expect(RETURN_WINDOW_DAYS).toBe(14)
  const now = new Date("2026-10-19T10:00:00Z")
  const threeDaysAgo = new Date("2026-10-16T10:00:00Z").toISOString()

  const order = {
    id: "ord_1",
    orderNumber: "AR-1001",
    status: "delivered",
    deliveredAt: threeDaysAgo,
    createdAt: threeDaysAgo,
    items: [
      { id: "item_1", quantity: 2, isFinalSale: false },
      { id: "item_2", quantity: 1, isFinalSale: false },
    ],
  }

  const result = evaluateOrderReturnEligibility(order, [], now)
  expect(result.isEligible).toBe(true)
  expect(result.daysRemaining).toBe(11)
  expect(result.items).toHaveLength(2)
  expect(result.items[0].isEligible).toBe(true)
  expect(result.items[0].maxReturnableQuantity).toBe(2)
})

test("evaluateOrderReturnEligibility: rejects non-delivered orders", () => {
  const now = new Date("2026-10-19T10:00:00Z")

  const order = {
    id: "ord_2",
    orderNumber: "AR-1002",
    status: "shipped",
    deliveredAt: null,
    createdAt: "2026-10-18T10:00:00Z",
    items: [{ id: "item_1", quantity: 1 }],
  }

  const result = evaluateOrderReturnEligibility(order, [], now)
  expect(result.isEligible).toBe(false)
  expect(result.ineligibleReason).toMatch(/transit|delivered/)
  expect(result.items[0].isEligible).toBe(false)
})

test("evaluateOrderReturnEligibility: rejects delivered orders after 14-day window", () => {
  const now = new Date("2026-10-19T10:00:00Z")
  const sixteenDaysAgo = new Date("2026-10-03T10:00:00Z").toISOString()

  const order = {
    id: "ord_3",
    orderNumber: "AR-1003",
    status: "delivered",
    deliveredAt: sixteenDaysAgo,
    createdAt: sixteenDaysAgo,
    items: [{ id: "item_1", quantity: 1 }],
  }

  const result = evaluateOrderReturnEligibility(order, [], now)
  expect(result.isEligible).toBe(false)
  expect(result.ineligibleReason).toMatch(/expired/)
  expect(result.daysRemaining).toBe(0)
})

test("evaluateOrderReturnEligibility: excludes final sale pieces and calculates returned quantities", () => {
  const now = new Date("2026-10-19T10:00:00Z")
  const twoDaysAgo = new Date("2026-10-17T10:00:00Z").toISOString()

  const order = {
    id: "ord_4",
    orderNumber: "AR-1004",
    status: "delivered",
    deliveredAt: twoDaysAgo,
    createdAt: twoDaysAgo,
    items: [
      { id: "item_final", quantity: 1, isFinalSale: true },
      { id: "item_already_returned", quantity: 1, isFinalSale: false },
      { id: "item_partial", quantity: 3, isFinalSale: false },
    ],
  }

  const existing = [
    { orderItemId: "item_already_returned", quantity: 1, status: "approved" },
    { orderItemId: "item_partial", quantity: 1, status: "received" },
  ]

  const result = evaluateOrderReturnEligibility(order, existing, now)
  expect(result.isEligible).toBe(true)
  expect(result.items[0].isEligible).toBe(false)
  expect(result.items[0].ineligibleReason).toMatch(/Final Sale/)
  expect(result.items[1].isEligible).toBe(false)
  expect(result.items[2].isEligible).toBe(true)
  expect(result.items[2].maxReturnableQuantity).toBe(2)
})

test("customerReturnFormSchema: validates COD UAE bank transfer requirements", () => {
  // Valid COD submission
  const validCod = customerReturnFormSchema.safeParse({
    orderId: "c2c57f72-9b59-4d62-95f7-6ec638217bb4",
    isCodOrder: true,
    items: [
      {
        orderItemId: "item_1",
        productName: "Silk Anarkali",
        colourName: "Sage",
        sizeLabel: "M",
        sku: "AR-AN-SAGE-M",
        unitPriceFils: 85000,
        quantity: 1,
        reason: "Fit / Size too small",
      },
    ],
    bankName: "Emirates NBD",
    accountHolderName: "Vivek VR",
    iban: "AE120260000001234567890",
  })
  expect(validCod.success).toBe(true)

  // Invalid COD missing IBAN
  const invalidCod = customerReturnFormSchema.safeParse({
    orderId: "c2c57f72-9b59-4d62-95f7-6ec638217bb4",
    isCodOrder: true,
    items: [
      {
        orderItemId: "item_1",
        productName: "Silk Anarkali",
        colourName: "Sage",
        sizeLabel: "M",
        sku: "AR-AN-SAGE-M",
        unitPriceFils: 85000,
        quantity: 1,
        reason: "Fit / Size too small",
      },
    ],
    bankName: "Emirates NBD",
    accountHolderName: "Vivek VR",
    iban: "12345", // invalid
  })
  expect(invalidCod.success).toBe(false)
  expect(invalidCod.error?.issues.some((i) => i.path.includes("iban"))).toBe(true)

  // Valid Card submission (bank details not required)
  const validCard = customerReturnFormSchema.safeParse({
    orderId: "c2c57f72-9b59-4d62-95f7-6ec638217bb4",
    isCodOrder: false,
    items: [
      {
        orderItemId: "item_1",
        productName: "Silk Anarkali",
        colourName: "Sage",
        sizeLabel: "M",
        sku: "AR-AN-SAGE-M",
        unitPriceFils: 85000,
        quantity: 1,
        reason: "Style not suitable / changed mind",
      },
    ],
  })
  expect(validCard.success).toBe(true)
})
