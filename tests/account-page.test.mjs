import assert from "node:assert/strict"
import test from "node:test"
import {
  addressSchema,
  profileSchema,
  passwordChangeSchema,
  guestOrderLookupSchema,
} from "../features/account/schemas.ts"
import {
  INITIAL_ADDRESSES,
  INITIAL_ORDERS,
  INITIAL_USER_PROFILE,
} from "../features/account/data.ts"
import { formatAED } from "../lib/money.ts"

test("addressSchema accepts valid UAE addresses across emirates", () => {
  const valid = {
    label: "Home Villa",
    recipientName: "Fatima Al Mansoori",
    phone: "+971 50 123 4567",
    emirate: "Dubai",
    area: "Jumeirah 1",
    street: "12B Street",
    building: "Villa 48",
    apartment: "",
    landmark: "Near BoxPark",
    isDefault: true,
  }
  const result = addressSchema.safeParse(valid)
  assert.equal(result.success, true)
})

test("addressSchema rejects invalid emirates or missing recipient", () => {
  const invalid = {
    label: "Home",
    recipientName: "",
    phone: "123",
    emirate: "Doha", // Not in UAE
    area: "",
    street: "",
    building: "",
  }
  const result = addressSchema.safeParse(invalid)
  assert.equal(result.success, false)
  if (!result.success) {
    const errorPaths = result.error.issues.map((i) => i.path[0])
    assert.ok(errorPaths.includes("recipientName"))
    assert.ok(errorPaths.includes("emirate"))
  }
})

test("profileSchema validates email and required names", () => {
  const valid = {
    firstName: "Fatima",
    lastName: "Al Mansoori",
    email: "fatima@arboutique.ae",
    phone: "+971 50 847 2910",
    preferredLanguage: "en",
    notifyWhatsApp: true,
    notifyEmail: true,
  }
  assert.equal(profileSchema.safeParse(valid).success, true)

  const invalidEmail = {
    ...valid,
    email: "not-an-email",
  }
  assert.equal(profileSchema.safeParse(invalidEmail).success, false)
})

test("passwordChangeSchema enforces matching new passwords", () => {
  const valid = {
    currentPassword: "oldpassword123",
    newPassword: "newpassword123",
    confirmPassword: "newpassword123",
  }
  assert.equal(passwordChangeSchema.safeParse(valid).success, true)

  const mismatched = {
    currentPassword: "oldpassword123",
    newPassword: "newpassword123",
    confirmPassword: "differentpassword",
  }
  assert.equal(passwordChangeSchema.safeParse(mismatched).success, false)
})

test("guestOrderLookupSchema validates order number and email", () => {
  assert.equal(
    guestOrderLookupSchema.safeParse({
      orderNumber: "AR-1048",
      email: "client@example.com",
    }).success,
    true
  )
  assert.equal(
    guestOrderLookupSchema.safeParse({
      orderNumber: "",
      email: "invalid",
    }).success,
    false
  )
})

test("INITIAL_ORDERS are priced correctly in integer fils and format to AED", () => {
  assert.ok(INITIAL_ORDERS.length >= 2)
  for (const order of INITIAL_ORDERS) {
    assert.ok(typeof order.totalFils === "number")
    assert.ok(order.totalFils > 0)
    assert.match(formatAED(order.totalFils), /^AED\s[\d,]+(\.\d{2})?$/)
    assert.ok(order.items.length > 0)
  }
})

test("INITIAL_ADDRESSES have at least one default primary address", () => {
  assert.ok(INITIAL_ADDRESSES.length > 0)
  const defaultCount = INITIAL_ADDRESSES.filter((a) => a.isDefault).length
  assert.equal(defaultCount, 1)
})

test("INITIAL_USER_PROFILE provides default boutique member info", () => {
  assert.ok(INITIAL_USER_PROFILE.firstName)
  assert.ok(INITIAL_USER_PROFILE.email)
  assert.equal(INITIAL_USER_PROFILE.tier, "Boutique VIP")
})

