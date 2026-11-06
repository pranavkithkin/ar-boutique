import { test, expect } from "vitest"
import { contactFormSchema } from "@/features/contact/schemas"

test("contactFormSchema validates valid inquiry data", () => {
  const result = contactFormSchema.safeParse({
    name: "Amina Al Mansoori",
    email: "amina@example.com",
    phone: "+971 50 273 6767",
    topic: "General Inquiry",
    message: "I would like to inquire about bespoke tailoring options for the upcoming festive season.",
  })

  expect(result.success).toBe(true)
})

test("contactFormSchema rejects missing required fields", () => {
  const shortName = contactFormSchema.safeParse({
    name: "A",
    email: "amina@example.com",
    topic: "General Inquiry",
    message: "Valid message content with sufficient length.",
  })
  expect(shortName.success).toBe(false)

  const invalidEmail = contactFormSchema.safeParse({
    name: "Amina Al Mansoori",
    email: "not-an-email",
    topic: "General Inquiry",
    message: "Valid message content with sufficient length.",
  })
  expect(invalidEmail.success).toBe(false)

  const shortMessage = contactFormSchema.safeParse({
    name: "Amina Al Mansoori",
    email: "amina@example.com",
    topic: "General Inquiry",
    message: "Short",
  })
  expect(shortMessage.success).toBe(false)
})

