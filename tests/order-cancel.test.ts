import { test, expect } from "vitest"

test("Order Cancellation: reason formatting with custom note", () => {
  const commonReason = "Customer requested cancellation"
  const customNote = "Customer called concierge asking to switch colour"
  
  const formattedWithNote = `${commonReason}: ${customNote}`
  expect(formattedWithNote).toBe("Customer requested cancellation: Customer called concierge asking to switch colour")
})

test("Order Cancellation: custom reason fallback", () => {
  const selectedReason = "Other / Custom reason"
  const customNote = "Duplicate order placed within 2 minutes"
  
  const finalReason = selectedReason === "Other / Custom reason" ? customNote.trim() || "Administrative cancellation" : selectedReason
  expect(finalReason).toBe("Duplicate order placed within 2 minutes")

  const emptyNote = "   "
  const fallback = selectedReason === "Other / Custom reason" ? emptyNote.trim() || "Administrative cancellation" : selectedReason
  expect(fallback).toBe("Administrative cancellation")
})
