import { describe, it, expect } from "vitest"
import {
  addressSchema,
  profileSchema,
  passwordChangeSchema,
  guestOrderLookupSchema,
} from "../features/account/schemas"
import {
  INITIAL_ADDRESSES,
  INITIAL_ORDERS,
  INITIAL_USER_PROFILE,
} from "../features/account/data"
import { formatAED } from "../lib/money"

describe("Account Page Schemas & Data", () => {
  it("addressSchema accepts valid UAE addresses across emirates", () => {
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
    expect(result.success).toBe(true)
  })

  it("addressSchema rejects invalid emirates or missing recipient", () => {
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
    expect(result.success).toBe(false)
    if (!result.success) {
      const errorPaths = result.error.issues.map((i) => i.path[0])
      expect(errorPaths).toContain("recipientName")
      expect(errorPaths).toContain("emirate")
    }
  })

  it("profileSchema validates email and required names", () => {
    const valid = {
      firstName: "Fatima",
      lastName: "Al Mansoori",
      email: "fatima@arboutique.ae",
      phone: "+971 50 847 2910",
      preferredLanguage: "en",
      notifyWhatsApp: true,
      notifyEmail: true,
    }
    expect(profileSchema.safeParse(valid).success).toBe(true)

    const invalidEmail = {
      ...valid,
      email: "not-an-email",
    }
    expect(profileSchema.safeParse(invalidEmail).success).toBe(false)
  })

  it("passwordChangeSchema enforces matching new passwords", () => {
    const valid = {
      currentPassword: "oldpassword123",
      newPassword: "newpassword123",
      confirmPassword: "newpassword123",
    }
    expect(passwordChangeSchema.safeParse(valid).success).toBe(true)

    const mismatched = {
      currentPassword: "oldpassword123",
      newPassword: "newpassword123",
      confirmPassword: "differentpassword",
    }
    expect(passwordChangeSchema.safeParse(mismatched).success).toBe(false)
  })

  it("guestOrderLookupSchema validates order number and email", () => {
    expect(
      guestOrderLookupSchema.safeParse({
        orderNumber: "AR-1048",
        email: "client@example.com",
      }).success
    ).toBe(true)

    expect(
      guestOrderLookupSchema.safeParse({
        orderNumber: "",
        email: "invalid",
      }).success
    ).toBe(false)
  })

  it("INITIAL_ORDERS are priced correctly in integer fils and format to AED", () => {
    expect(INITIAL_ORDERS.length).toBeGreaterThanOrEqual(2)
    for (const order of INITIAL_ORDERS) {
      expect(typeof order.totalFils).toBe("number")
      expect(order.totalFils).toBeGreaterThan(0)
      expect(formatAED(order.totalFils)).toMatch(/^AED\s[\d,]+(\.\d{2})?$/)
      expect(order.items.length).toBeGreaterThan(0)
    }
  })

  it("INITIAL_ADDRESSES have at least one default primary address", () => {
    expect(INITIAL_ADDRESSES.length).toBeGreaterThan(0)
    const defaultCount = INITIAL_ADDRESSES.filter((a) => a.isDefault).length
    expect(defaultCount).toBe(1)
  })

  it("INITIAL_USER_PROFILE provides default boutique member info", () => {
    expect(INITIAL_USER_PROFILE.firstName).toBeTruthy()
    expect(INITIAL_USER_PROFILE.email).toBeTruthy()
    expect(INITIAL_USER_PROFILE.tier).toBe("Boutique VIP")
  })
})
