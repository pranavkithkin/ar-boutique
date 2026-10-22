import test from "node:test"
import assert from "node:assert/strict"
import ExcelJS from "exceljs"
import { generateStockSheetTemplateBuffer } from "../lib/sheets/template.ts"
import { parseStockSheetBuffer } from "../lib/sheets/reader.ts"

test("Stock sheet sample template generates valid Excel workbook with client schema", async () => {
  const buffer = await generateStockSheetTemplateBuffer()
  assert.ok(buffer.length > 2000, "Buffer should be valid and non-empty")

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  // Verify Worksheets
  const sheetNames = workbook.worksheets.map((w) => w.name)
  assert.ok(sheetNames.includes("Stock Sheet"), "Must contain 'Stock Sheet' tab")
  assert.ok(sheetNames.includes("Instructions & Guide"), "Must contain 'Instructions & Guide' tab")

  // Verify Headers in Stock Sheet
  const stockSheet = workbook.getWorksheet("Stock Sheet")
  const headers = []
  stockSheet.getRow(1).eachCell((cell) => {
    headers.push(cell.text)
  })

  assert.equal(headers.length, 23, "Must have exactly 23 standard stock sheet headers")
  assert.equal(headers[0], "SKU")
  assert.equal(headers[1], "Style")
  assert.equal(headers[16], "Selling Price")
  assert.equal(headers[17], "Size")
  assert.equal(headers[18], "Stock")
  assert.equal(headers[19], "Product Name")
  assert.equal(headers[20], "Category")
})

test("Stock sheet sample template parses cleanly through parseStockSheetBuffer with 0 errors", async () => {
  const buffer = await generateStockSheetTemplateBuffer()
  const result = await parseStockSheetBuffer(buffer, "sample-template.xlsx")

  assert.equal(result.errors.length, 0, "Template should parse with zero errors")
  assert.equal(result.rows.length, 1, "Should parse the 1 sample product row")

  const row1 = result.rows[0]
  assert.equal(row1.sku, "AR-SAMPLE-01-M")
  assert.equal(row1.style, "AR-SAMPLE-01")
  assert.equal(row1.sizeLabel, "M")
  assert.equal(row1.sellingPriceAED, 850)
  assert.equal(row1.stock, 12)
  assert.equal(row1.productName, "Emerald Noor Embroidered Suit")
  assert.equal(row1.categoryName, "Suits")
})
