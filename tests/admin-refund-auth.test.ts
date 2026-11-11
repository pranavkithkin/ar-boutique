import { beforeEach, expect, test, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getClaims: vi.fn(),
  maybeSingle: vi.fn(),
  createAdminClient: vi.fn(),
}))

vi.mock("server-only", () => ({}))
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getClaims: mocks.getClaims } }),
  createAdminClient: mocks.createAdminClient,
}))

import { requireAdmin } from "@/lib/supabase/admin-auth"

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getClaims.mockResolvedValue({
    data: { claims: { sub: "admin-id", aal: "aal1", app_metadata: { user_role: "admin" } } },
    error: null,
  })
  mocks.maybeSingle.mockResolvedValue({
    data: { role: "admin", is_active: true, email: "admin@example.com" },
    error: null,
  })
  mocks.createAdminClient.mockReturnValue({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }) }),
  })
})

test("allows a signed-in active admin without 2FA", async () => {
  expect(await requireAdmin()).toEqual({ id: "admin-id", email: "admin@example.com" })
})

test("rejects logged-out requests", async () => {
  mocks.getClaims.mockResolvedValue({ data: null, error: new Error("No session") })
  expect(await requireAdmin()).toBeNull()
  expect(mocks.createAdminClient).not.toHaveBeenCalled()
})

test("rejects signed-in non-admins", async () => {
  mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "customer-id", aal: "aal1" } }, error: null })
  expect(await requireAdmin()).toBeNull()
  expect(mocks.createAdminClient).not.toHaveBeenCalled()
})

test("rejects inactive admins even when their JWT still contains the admin role", async () => {
  mocks.maybeSingle.mockResolvedValue({ data: { role: "admin", is_active: false }, error: null })
  expect(await requireAdmin()).toBeNull()
})

test("rejects a missing admin record", async () => {
  mocks.maybeSingle.mockResolvedValue({ data: null, error: null })
  expect(await requireAdmin()).toBeNull()
})

test("rejects admin lookup errors", async () => {
  mocks.maybeSingle.mockResolvedValue({ data: null, error: new Error("Database unavailable") })
  expect(await requireAdmin()).toBeNull()
})
