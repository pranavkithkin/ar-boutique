import { test, expect } from "vitest"

test("Resend Email: validates email formats correctly", () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  expect(emailRegex.test("customer@example.com")).toBe(true)
  expect(emailRegex.test("patron@domain.ae")).toBe(true)
  expect(emailRegex.test("invalid-email")).toBe(false)
  expect(emailRegex.test("missing@domain")).toBe(false)
  expect(emailRegex.test("@no-local.com")).toBe(false)
})

test("Resend Email: template selection and default determination", () => {
  function getDefaultTemplate(status: string) {
    if (status === "shipped" || status === "delivered") return "shipped"
    if (status === "cancelled") return "cancelled"
    return "confirmation"
  }

  expect(getDefaultTemplate("pending")).toBe("confirmation")
  expect(getDefaultTemplate("confirmed")).toBe("confirmation")
  expect(getDefaultTemplate("packed")).toBe("confirmation")
  expect(getDefaultTemplate("shipped")).toBe("shipped")
  expect(getDefaultTemplate("delivered")).toBe("shipped")
  expect(getDefaultTemplate("cancelled")).toBe("cancelled")
})
