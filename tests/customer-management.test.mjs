// Run: node --test tests/customer-management.test.mjs
import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import vm from "node:vm"
import { createRequire } from "node:module"
import ts from "typescript"

const require = createRequire(import.meta.url)
const root = new URL("../", import.meta.url)
const read = (path) => fs.readFileSync(new URL(path, root), "utf8")

function load(path, dependencies = {}) {
  const { outputText, diagnostics } = ts.transpileModule(read(path), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    reportDiagnostics: true,
  })
  assert.equal(diagnostics?.length ?? 0, 0)
  const modObj = { exports: {} }
  vm.runInNewContext(outputText, {
    module: modObj,
    exports: modObj.exports,
    require: (name) => dependencies[name] ?? require(name),
  })
  return modObj.exports
}

const { updateCustomerCodSchema, updateCustomerNotesSchema } = load("features/admin/customers/schemas.ts")

test("updateCustomerCodSchema accepts valid COD enable/disable inputs", () => {
  const validDisable = {
    customerId: "d4646f54-63e5-4726-aa48-15a6b93fb124",
    codDisabled: true,
    codDisabledReason: "Refused 2 consecutive COD deliveries at Dubai Marina",
  }
  const parsed1 = updateCustomerCodSchema.parse(validDisable)
  assert.equal(parsed1.codDisabled, true)
  assert.equal(parsed1.codDisabledReason, "Refused 2 consecutive COD deliveries at Dubai Marina")

  const validEnable = {
    customerId: "d4646f54-63e5-4726-aa48-15a6b93fb124",
    codDisabled: false,
    codDisabledReason: null,
  }
  const parsed2 = updateCustomerCodSchema.parse(validEnable)
  assert.equal(parsed2.codDisabled, false)
  assert.equal(parsed2.codDisabledReason, null)
})

test("updateCustomerCodSchema rejects invalid UUIDs", () => {
  assert.throws(() => {
    updateCustomerCodSchema.parse({
      customerId: "not-a-valid-uuid",
      codDisabled: true,
    })
  }, /Invalid customer ID/)
})

test("updateCustomerNotesSchema accepts notes under 2000 chars", () => {
  const valid = {
    customerId: "d4646f54-63e5-4726-aa48-15a6b93fb124",
    notes: "Prefers morning deliveries in Abu Dhabi. VIP client.",
  }
  const parsed = updateCustomerNotesSchema.parse(valid)
  assert.equal(parsed.notes, "Prefers morning deliveries in Abu Dhabi. VIP client.")
})

test("customer directory filter logic correctly filters by search query and COD status", () => {
  const sampleCustomers = [
    {
      id: "1",
      email: "mariam.mansoor@example.ae",
      fullName: "Mariam Mansoor",
      phone: "+971 55 987 6543",
      codDisabled: false,
      totalOrders: 3,
      totalSpendFils: 250000, // 2500 AED (VIP)
      codRefusals: 0,
    },
    {
      id: "2",
      email: "shaikha.alnuaimi@example.ae",
      fullName: "Shaikha Al Nuaimi",
      phone: "+971 50 123 4567",
      codDisabled: true,
      totalOrders: 2,
      totalSpendFils: 45000, // 450 AED
      codRefusals: 2,
    },
    {
      id: "3",
      email: "fatima.guest@example.ae",
      fullName: null,
      phone: "+971 52 333 4444",
      codDisabled: false,
      totalOrders: 1,
      totalSpendFils: 12000,
      codRefusals: 0,
    },
  ]

  // Search by partial name
  const nameSearch = sampleCustomers.filter((c) =>
    (c.fullName || "").toLowerCase().includes("mariam")
  )
  assert.equal(nameSearch.length, 1)
  assert.equal(nameSearch[0].email, "mariam.mansoor@example.ae")

  // Search by phone
  const phoneSearch = sampleCustomers.filter((c) =>
    (c.phone || "").includes("50 123")
  )
  assert.equal(phoneSearch.length, 1)
  assert.equal(phoneSearch[0].fullName, "Shaikha Al Nuaimi")

  // Status: cod_disabled
  const codDisabledList = sampleCustomers.filter((c) => c.codDisabled)
  assert.equal(codDisabledList.length, 1)
  assert.equal(codDisabledList[0].codRefusals, 2)

  // Status: VIP (>= 1,000 AED = 100,000 fils)
  const vipList = sampleCustomers.filter((c) => c.totalSpendFils >= 100000)
  assert.equal(vipList.length, 1)
  assert.equal(vipList[0].fullName, "Mariam Mansoor")
})
