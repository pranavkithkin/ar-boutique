import { test, expect } from "vitest"
import ExcelJS from "exceljs"
import { generateStockSheetTemplateBuffer } from "@/lib/sheets/template"
import { parseStockSheetBuffer } from "@/lib/sheets/reader"

test("Stock sheet sample template generates valid Excel workbook with client schema", async () => {
  const buffer = await generateStockSheetTemplateBuffer()
  expect(buffer.length).toBeGreaterThan(2000)

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as any)

  // Verify Worksheets
  const sheetNames = workbook.worksheets.map((w) => w.name)
  expect(sheetNames).toContain("Stock Sheet")
  expect(sheetNames).toContain("Instructions & Guide")

  // Verify Headers in Stock Sheet
  const stockSheet = workbook.getWorksheet("Stock Sheet")
  const headers: string[] = []
  stockSheet?.getRow(1).eachCell((cell) => {
    headers.push(cell.text)
  })

  expect(headers.length).toBe(23)
  expect(headers[0]).toBe("SKU")
  expect(headers[1]).toBe("Style")
  expect(headers[16]).toBe("Selling Price")
  expect(headers[17]).toBe("Size")
  expect(headers[18]).toBe("Stock")
  expect(headers[19]).toBe("Product Name")
  expect(headers[20]).toBe("Category")
})

test("Stock sheet sample template parses cleanly through parseStockSheetBuffer with 0 errors", async () => {
  const buffer = await generateStockSheetTemplateBuffer()
  const result = await parseStockSheetBuffer(buffer, "sample-template.xlsx")

  expect(result.errors).toHaveLength(0)
  expect(result.rows).toHaveLength(1)

  const row1 = result.rows[0]
  expect(row1.sku).toBe("AR-SAMPLE-01-M")
  expect(row1.style).toBe("AR-SAMPLE-01")
  expect(row1.sizeLabel).toBe("M")
  expect(row1.sellingPriceAED).toBe(850)
  expect(row1.stock).toBe(12)
  expect(row1.productName).toBe("Emerald Noor Embroidered Suit")
  expect(row1.categoryName).toBe("Suits")
})
