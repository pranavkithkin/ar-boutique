import { expect, test, vi } from "vitest"
import { getCheckoutAttempt } from "@/features/checkout/checkout-key"

test("retries reuse the original checkout key", () => {
  const previous = { fingerprint: "same request", key: "original-key" }
  const create = vi.fn(() => "new-key")
  expect(getCheckoutAttempt("same request", previous, create)).toBe(previous)
  expect(create).not.toHaveBeenCalled()
})

test("changed checkout details get a new key", () => {
  expect(getCheckoutAttempt("changed request", { fingerprint: "old request", key: "old-key" }, () => "new-key"))
    .toEqual({ fingerprint: "changed request", key: "new-key" })
})
