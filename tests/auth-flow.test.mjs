import test from "node:test"
import assert from "node:assert/strict"
import { signInSchema, signUpSchema } from "../features/auth/schemas.ts"

test("signInSchema accepts valid credentials", () => {
  const validData = {
    email: "client@example.ae",
    password: "Password123",
    rememberMe: true,
  }
  const result = signInSchema.safeParse(validData)
  assert.equal(result.success, true)
})

test("signInSchema rejects invalid email format", () => {
  const invalidData = {
    email: "not-an-email",
    password: "Password123",
    rememberMe: false,
  }
  const result = signInSchema.safeParse(invalidData)
  assert.equal(result.success, false)
  assert.match(result.error.issues[0].message, /valid email/i)
})

test("signInSchema rejects short password", () => {
  const invalidData = {
    email: "client@example.ae",
    password: "short",
    rememberMe: false,
  }
  const result = signInSchema.safeParse(invalidData)
  assert.equal(result.success, false)
  assert.match(result.error.issues[0].message, /at least 8 characters/i)
})

test("signUpSchema accepts valid customer registration data", () => {
  const validData = {
    firstName: "Sara",
    lastName: "Al Mansoori",
    email: "sara@boutique.ae",
    phone: "+971501234567",
    password: "BoutiqueSecure2026",
    termsAccepted: true,
  }
  const result = signUpSchema.safeParse(validData)
  assert.equal(result.success, true)
})

test("signUpSchema enforces password complexity (uppercase + number)", () => {
  // Missing uppercase
  const noUpper = {
    firstName: "Sara",
    lastName: "Al Mansoori",
    email: "sara@boutique.ae",
    password: "password123",
    termsAccepted: true,
  }
  const res1 = signUpSchema.safeParse(noUpper)
  assert.equal(res1.success, false)
  assert.match(res1.error.issues[0].message, /uppercase/i)

  // Missing number
  const noNumber = {
    firstName: "Sara",
    lastName: "Al Mansoori",
    email: "sara@boutique.ae",
    password: "PasswordSecure",
    termsAccepted: true,
  }
  const res2 = signUpSchema.safeParse(noNumber)
  assert.equal(res2.success, false)
  assert.match(res2.error.issues[0].message, /number/i)
})

test("signUpSchema requires terms & conditions acceptance", () => {
  const unacceptedTerms = {
    firstName: "Sara",
    lastName: "Al Mansoori",
    email: "sara@boutique.ae",
    password: "Password123",
    termsAccepted: false,
  }
  const result = signUpSchema.safeParse(unacceptedTerms)
  assert.equal(result.success, false)
  assert.match(result.error.issues[0].message, /terms & conditions/i)
})
