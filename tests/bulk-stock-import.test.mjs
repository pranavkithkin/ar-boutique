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

const { parseBulkStockBuffer } = load("lib/sheets/bulk-stock-reader.ts", {
  exceljs: require("exceljs"),
  stream: require("stream"),
})

test("Bulk Stock Reader - parses standard CSV with SKU and Stock", async () => {
  const csvData =
    "SKU,Stock,Notes\n" +
    "ARB-DR-01-S,10,Initial count\n" +
    "ARB-DR-01-M,25,Restock shipment\n"

  const buffer = Buffer.from(csvData, "utf8")
  const result = await parseBulkStockBuffer(buffer, "test_stock.csv")

  assert.equal(result.errors.length, 0)
  assert.equal(result.rows.length, 2)
  assert.equal(result.rows[0].sku, "ARB-DR-01-S")
  assert.equal(result.rows[0].newOnHand, 10)
  assert.equal(result.rows[0].note, "Initial count")
  assert.equal(result.rows[1].sku, "ARB-DR-01-M")
  assert.equal(result.rows[1].newOnHand, 25)
})

test("Bulk Stock Reader - supports flexible headers (Client SKU, Quantity)", async () => {
  const csvData =
    "Client SKU,Quantity\n" +
    "TEST-SKU-1,5\n" +
    "TEST-SKU-2,0\n"

  const buffer = Buffer.from(csvData, "utf8")
  const result = await parseBulkStockBuffer(buffer, "flexible_headers.csv")

  assert.equal(result.errors.length, 0)
  assert.equal(result.rows.length, 2)
  assert.equal(result.rows[0].sku, "TEST-SKU-1")
  assert.equal(result.rows[0].newOnHand, 5)
  assert.equal(result.rows[1].sku, "TEST-SKU-2")
  assert.equal(result.rows[1].newOnHand, 0)
})

test("Bulk Stock Reader - flags negative stock and invalid numbers", async () => {
  const csvData =
    "SKU,Stock\n" +
    "VALID-SKU,8\n" +
    "NEG-SKU,-5\n" +
    "NAN-SKU,abc\n"

  const buffer = Buffer.from(csvData, "utf8")
  const result = await parseBulkStockBuffer(buffer, "validation_test.csv")

  assert.equal(result.rows.length, 3)
  assert.equal(result.rows[0].newOnHand, 8)
  assert.equal(result.rows[0].error, undefined)

  assert.equal(result.rows[1].newOnHand, -5)
  assert.match(result.rows[1].error, /cannot be negative/i)

  assert.equal(result.rows[2].newOnHand, null)
  assert.match(result.rows[2].error, /invalid stock/i)
})

test("Bulk Stock Reader - returns error when SKU or Stock column is missing", async () => {
  const csvData =
    "Product Name,Price\n" +
    "Sample Dress,150\n"

  const buffer = Buffer.from(csvData, "utf8")
  const result = await parseBulkStockBuffer(buffer, "missing_cols.csv")

  assert.equal(result.errors.length, 1)
  assert.match(result.errors[0], /could not detect required columns/i)
})
