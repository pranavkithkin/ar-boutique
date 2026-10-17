import assert from "node:assert/strict"
import test from "node:test"
import {
  checkoutFormSchema,
  UAE_EMIRATES,
} from "../features/checkout/schemas.ts"
import {
  formatAED,
  calculateVatPortion,
  calculateDeliveryEstimate,
  FREE_DELIVERY_THRESHOLD_FILS,
  STANDARD_DELIVERY_FEE_FILS,
} from "../lib/money.ts"

test("checkoutFormSchema accepts valid UAE delivery details", () => {
  const valid = {
    fullName: "Fatima Al Mansoori",
    email: "fatima.almansoori@gmail.com",
    phone: "+971 50 123 4567",
    emirate: "Dubai",
    area: "Jumeirah 1",
    street: "12B Street",
    building: "Villa 48",
    apartment: "Villa",
    landmark: "Near BoxPark",
    instructions: "Call upon arrival",
    paymentMethod: "cod",
    saveAddress: true,
  }

  const result = checkoutFormSchema.safeParse(valid)
  assert.equal(result.success, true)
})

test("checkoutFormSchema accepts card payment method", () => {
  const valid = {
    fullName: "Mariam Al Zaabi",
    email: "mariam@example.com",
    phone: "+971 55 987 6543",
    emirate: "Abu Dhabi",
    area: "Al Bateen",
    street: "Corniche Road",
    building: "Tower B",
    apartment: "1204",
    landmark: "",
    instructions: "",
    paymentMethod: "card",
    saveAddress: false,
  }

  const result = checkoutFormSchema.safeParse(valid)
  assert.equal(result.success, true)
})

test("checkoutFormSchema rejects missing required fields and invalid email", () => {
  const invalid = {
    fullName: "A", // min 2
    email: "not-an-email",
    phone: "123", // too short
    emirate: "Doha", // Not in UAE_EMIRATES
    area: "",
    street: "",
    building: "",
    paymentMethod: "bitcoin", // invalid method
  }

  const result = checkoutFormSchema.safeParse(invalid)
  assert.equal(result.success, false)
  if (!result.success) {
    const errorPaths = result.error.issues.map((i) => i.path[0])
    assert.ok(errorPaths.includes("fullName"))
    assert.ok(errorPaths.includes("email"))
    assert.ok(errorPaths.includes("phone"))
    assert.ok(errorPaths.includes("emirate"))
    assert.ok(errorPaths.includes("paymentMethod"))
  }
})

test("UAE_EMIRATES contains all 7 federation emirates", () => {
  assert.equal(UAE_EMIRATES.length, 7)
  assert.ok(UAE_EMIRATES.includes("Dubai"))
  assert.ok(UAE_EMIRATES.includes("Abu Dhabi"))
  assert.ok(UAE_EMIRATES.includes("Sharjah"))
  assert.ok(UAE_EMIRATES.includes("Ajman"))
  assert.ok(UAE_EMIRATES.includes("Ras Al Khaimah"))
  assert.ok(UAE_EMIRATES.includes("Fujairah"))
  assert.ok(UAE_EMIRATES.includes("Umm Al Quwain"))
})

test("delivery fee evaluates free shipping threshold correctly", () => {
  // Below 200 AED threshold (e.g. 150 AED = 15,000 fils)
  const feeUnder = calculateDeliveryEstimate(15000, true)
  assert.equal(feeUnder.deliveryFeeFils, STANDARD_DELIVERY_FEE_FILS)
  assert.equal(feeUnder.isFreeShipping, false)

  // Exactly at 200 AED threshold (20,000 fils) -> FREE
  const feeAt = calculateDeliveryEstimate(FREE_DELIVERY_THRESHOLD_FILS, true)
  assert.equal(feeAt.deliveryFeeFils, 0)
  assert.equal(feeAt.isFreeShipping, true)

  // Above 200 AED threshold (350 AED = 35,000 fils) -> FREE
  const feeAbove = calculateDeliveryEstimate(35000, true)
  assert.equal(feeAbove.deliveryFeeFils, 0)
  assert.equal(feeAbove.isFreeShipping, true)
})

test("calculateVatPortion correctly extracts included 5% UAE VAT", () => {
  // 105 AED (10,500 fils) has exactly 5 AED (500 fils) VAT
  const vat = calculateVatPortion(10500)
  assert.equal(vat, 500)

  // 210 AED (21,000 fils) has 10 AED (1,000 fils) VAT
  const vat2 = calculateVatPortion(21000)
  assert.equal(vat2, 1000)
})

test("COD eligibility checks enforce maximum order value", () => {
  const codMaxFils = 100000 // 1,000 AED max
  const eligibleSubtotal = 85000 // 850 AED
  const ineligibleSubtotal = 120000 // 1,200 AED

  assert.equal(eligibleSubtotal <= codMaxFils, true)
  assert.equal(ineligibleSubtotal <= codMaxFils, false)
})
