import test from "node:test"
import assert from "node:assert/strict"
import {
  evaluateOrderReturnEligibility,
  RETURN_WINDOW_DAYS,
} from "../features/account/returns/eligibility.ts"
import { customerReturnFormSchema } from "../features/account/returns/schemas.ts"

test("evaluateOrderReturnEligibility: approves delivered orders within 7 days", () => {
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
  assert.equal(result.isEligible, true)
  assert.equal(result.daysRemaining, 4)
  assert.equal(result.items.length, 2)
  assert.equal(result.items[0].isEligible, true)
  assert.equal(result.items[0].maxReturnableQuantity, 2)
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
  assert.equal(result.isEligible, false)
  assert.match(result.ineligibleReason, /transit|delivered/)
  assert.equal(result.items[0].isEligible, false)
})

test("evaluateOrderReturnEligibility: rejects delivered orders after 7-day window", () => {
  const now = new Date("2026-10-19T10:00:00Z")
  const tenDaysAgo = new Date("2026-10-09T10:00:00Z").toISOString()

  const order = {
    id: "ord_3",
    orderNumber: "AR-1003",
    status: "delivered",
    deliveredAt: tenDaysAgo,
    createdAt: tenDaysAgo,
    items: [{ id: "item_1", quantity: 1 }],
  }

  const result = evaluateOrderReturnEligibility(order, [], now)
  assert.equal(result.isEligible, false)
  assert.match(result.ineligibleReason, /expired/)
  assert.equal(result.daysRemaining, 0)
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
  assert.equal(result.isEligible, true) // item_partial has 2 left
  assert.equal(result.items[0].isEligible, false) // final sale
  assert.match(result.items[0].ineligibleReason, /Final Sale/)
  assert.equal(result.items[1].isEligible, false) // already returned
  assert.equal(result.items[2].isEligible, true)
  assert.equal(result.items[2].maxReturnableQuantity, 2)
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
  assert.equal(validCod.success, true)

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
  assert.equal(invalidCod.success, false)
  assert.ok(invalidCod.error.issues.some((i) => i.path.includes("iban")))

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
  assert.equal(validCard.success, true)
})
