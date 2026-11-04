import { test, expect } from "vitest"
import { parseBulkStockBuffer, generateSampleStockCsv } from "@/lib/sheets/bulk-stock-reader"

test("Bulk Stock Reader - parses standard CSV with SKU and Stock", async () => {
  const csvData =
    "SKU,Stock,Notes\n" +
    "ARB-DR-01-S,10,Initial count\n" +
    "ARB-DR-01-M,25,Restock shipment\n"

  const buffer = Buffer.from(csvData, "utf8")
  const result = await parseBulkStockBuffer(buffer, "test_stock.csv")

  expect(result.errors).toHaveLength(0)
  expect(result.rows).toHaveLength(2)
  expect(result.rows[0].sku).toBe("ARB-DR-01-S")
  expect(result.rows[0].newOnHand).toBe(10)
  expect(result.rows[0].note).toBe("Initial count")
  expect(result.rows[1].sku).toBe("ARB-DR-01-M")
  expect(result.rows[1].newOnHand).toBe(25)
})

test("Bulk Stock Reader - supports flexible headers (Client SKU, Quantity)", async () => {
  const csvData =
    "Client SKU,Quantity\n" +
    "TEST-SKU-1,5\n" +
    "TEST-SKU-2,0\n"

  const buffer = Buffer.from(csvData, "utf8")
  const result = await parseBulkStockBuffer(buffer, "test_stock.csv")

  expect(result.errors).toHaveLength(0)
  expect(result.rows).toHaveLength(2)
  expect(result.rows[0].sku).toBe("TEST-SKU-1")
  expect(result.rows[0].newOnHand).toBe(5)
  expect(result.rows[1].sku).toBe("TEST-SKU-2")
  expect(result.rows[1].newOnHand).toBe(0)
})

test("Bulk Stock Reader - flags negative stock and invalid numbers", async () => {
  const csvData =
    "SKU,Stock\n" +
    "SKU-GOOD,10\n" +
    "SKU-NEG,-5\n" +
    "SKU-NAN,ten\n"

  const buffer = Buffer.from(csvData, "utf8")
  const result = await parseBulkStockBuffer(buffer, "test_stock.csv")

  expect(result.rows).toHaveLength(3)
  expect(result.rows[0].sku).toBe("SKU-GOOD")
  expect(result.rows[0].newOnHand).toBe(10)
  expect(result.rows[0].error).toBeUndefined()

  expect(result.rows[1].sku).toBe("SKU-NEG")
  expect(result.rows[1].error).toContain("negative")

  expect(result.rows[2].sku).toBe("SKU-NAN")
  expect(result.rows[2].error).toContain("Invalid stock quantity")
})

test("Bulk Stock Reader - returns error when SKU or Stock column is missing", async () => {
  const csvData =
    "Product Name,Price\n" +
    "Silk Abaya,500\n"

  const buffer = Buffer.from(csvData, "utf8")
  const result = await parseBulkStockBuffer(buffer, "test_stock.csv")

  expect(result.errors.length).toBeGreaterThan(0)
  expect(result.errors[0]).toContain("Could not detect required columns")
})

test("Bulk Stock Reader - generates valid sample CSV template", () => {
  const csv = generateSampleStockCsv()
  expect(csv).toContain("SKU,Stock,Notes")
  expect(csv).toContain("ARB-EM-01-S")
})
