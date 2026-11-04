import ExcelJS from "exceljs"

export interface RawBulkStockRow {
  rowNumber: number
  sku: string
  newOnHand: number | null
  rawStock: string
  note?: string
  error?: string
}

export interface BulkStockParseResult {
  headers: string[]
  skuColumn: string | null
  stockColumn: string | null
  rows: RawBulkStockRow[]
  errors: string[]
}

function normalizeHeader(val: string): string {
  return val
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

const SKU_HEADER_PATTERNS = [
  "sku",
  "client sku",
  "variant sku",
  "item sku",
  "code",
  "product sku",
]

const STOCK_HEADER_PATTERNS = [
  "stock",
  "quantity",
  "qty",
  "on hand",
  "onhand",
  "units",
  "new stock",
  "inventory",
]

export async function parseBulkStockBuffer(
  buffer: Buffer,
  fileName: string
): Promise<BulkStockParseResult> {
  const isCsv = fileName.toLowerCase().endsWith(".csv")
  const workbook = new ExcelJS.Workbook()

  try {
    if (isCsv) {
      const { Readable } = await import("stream")
      const stream = Readable.from(buffer)
      await workbook.csv.read(stream)
    } else {
      await workbook.xlsx.load(buffer as any)
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to parse file."
    return {
      headers: [],
      skuColumn: null,
      stockColumn: null,
      rows: [],
      errors: [`Unable to read spreadsheet: ${msg}`],
    }
  }

  const worksheet = workbook.worksheets[0]
  if (!worksheet) {
    return {
      headers: [],
      skuColumn: null,
      stockColumn: null,
      rows: [],
      errors: ["The uploaded spreadsheet contains no worksheets."],
    }
  }

  // Find header row (check first 5 rows in case of blank title rows)
  let headerRowIndex = 1
  let skuColNumber: number | null = null
  let stockColNumber: number | null = null
  let noteColNumber: number | null = null
  let detectedHeaders: string[] = []

  for (let r = 1; r <= Math.min(5, worksheet.rowCount); r++) {
    const row = worksheet.getRow(r)
    let foundSku = false
    let foundStock = false
    const currentHeaders: string[] = []

    row.eachCell((cell, colNum) => {
      const text = (cell.text || "").trim()
      if (!text) return
      currentHeaders.push(text)
      const norm = normalizeHeader(text)

      if (!foundSku && SKU_HEADER_PATTERNS.includes(norm)) {
        skuColNumber = colNum
        foundSku = true
      } else if (!foundStock && STOCK_HEADER_PATTERNS.includes(norm)) {
        stockColNumber = colNum
        foundStock = true
      } else if (norm.includes("note") || norm.includes("reason")) {
        noteColNumber = colNum
      }
    })

    if (foundSku && foundStock) {
      headerRowIndex = r
      detectedHeaders = currentHeaders
      break
    }
  }

  if (!skuColNumber || !stockColNumber) {
    return {
      headers: detectedHeaders,
      skuColumn: skuColNumber ? "Found" : null,
      stockColumn: stockColNumber ? "Found" : null,
      rows: [],
      errors: [
        "Could not detect required columns. Please ensure your sheet includes both a 'SKU' column and a 'Stock' (or 'Quantity') column.",
      ],
    }
  }

  const parsedRows: RawBulkStockRow[] = []

  // Read data rows starting after headerRowIndex
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowIndex) return

    const skuCell = row.getCell(skuColNumber!)
    const stockCell = row.getCell(stockColNumber!)
    const noteCell = noteColNumber ? row.getCell(noteColNumber) : null

    const rawSku = (skuCell.text || "").trim()
    const rawStock = (stockCell.text || "").trim()
    const note = noteCell ? (noteCell.text || "").trim() : undefined

    // Skip entirely empty rows
    if (!rawSku && !rawStock) return

    if (!rawSku) {
      parsedRows.push({
        rowNumber,
        sku: "—",
        newOnHand: null,
        rawStock,
        note,
        error: "Missing SKU in row.",
      })
      return
    }

    // Parse stock value
    let numVal: number | null = null
    const val = stockCell.value

    if (typeof val === "number") {
      numVal = val
    } else if (typeof val === "object" && val !== null && "result" in val) {
      // Formula result
      const res = (val as any).result
      if (typeof res === "number") numVal = res
      else if (typeof res === "string") numVal = Number(res)
    } else if (rawStock) {
      // Remove comma separators and currency symbols if accidentally pasted
      const cleaned = rawStock.replace(/[^0-9.-]/g, "")
      numVal = cleaned !== "" ? Number(cleaned) : null
    }

    if (numVal === null || isNaN(numVal)) {
      parsedRows.push({
        rowNumber,
        sku: rawSku,
        newOnHand: null,
        rawStock,
        note,
        error: `Invalid stock quantity: "${rawStock || "empty"}"`,
      })
      return
    }

    const roundedVal = Math.floor(numVal)
    if (roundedVal < 0) {
      parsedRows.push({
        rowNumber,
        sku: rawSku,
        newOnHand: roundedVal,
        rawStock,
        note,
        error: "Stock quantity cannot be negative.",
      })
      return
    }

    parsedRows.push({
      rowNumber,
      sku: rawSku,
      newOnHand: roundedVal,
      rawStock,
      note,
    })
  })

  if (parsedRows.length === 0) {
    return {
      headers: detectedHeaders,
      skuColumn: "Found",
      stockColumn: "Found",
      rows: [],
      errors: ["The uploaded spreadsheet does not contain any data rows."],
    }
  }

  return {
    headers: detectedHeaders,
    skuColumn: "Found",
    stockColumn: "Found",
    rows: parsedRows,
    errors: [],
  }
}

/**
 * Generate sample CSV template string for bulk stock updates
 */
export function generateSampleStockCsv(): string {
  return (
    "SKU,Stock,Notes\n" +
    "ARB-EM-01-S,15,Monthly warehouse recount\n" +
    "ARB-EM-01-M,20,Restock batch A\n"
  )
}

