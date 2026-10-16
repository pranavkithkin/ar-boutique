import ExcelJS from "exceljs"

export interface ParsedSheetRow {
  rowNumber: number
  sku: string
  style: string
  colourName: string
  sizeLabel: string | null
  productName: string | null
  categoryName: string | null
  productGroup: string | null
  description: string | null
  sellingPriceAED: number | null
  compareAtPriceAED: number | null
  stock: number | null
  details: Record<string, string>
  rawValues: Record<string, string>
}

export interface SheetParseResult {
  headers: string[]
  recognizedColumns: string[]
  unrecognizedColumns: string[]
  rows: ParsedSheetRow[]
  errors: string[]
}

const DETAIL_COLUMN_MAP: Record<string, string> = {
  "package contains": "Package Contains",
  "top portal fabric": "Top Portal Fabric",
  "top primary color": "Top Primary Color",
  "top pattern type": "Top Pattern Type",
  "top neck details": "Top Neck Details",
  "top sleeve details": "Top Sleeve Details",
  "top category": "Top Category",
  "btm style type": "BTM Style Type",
  "btm fabric type": "BTM Fabric Type",
  "btm primary color": "BTM Primary Color",
  "dpt fabric type": "DPT Fabric Type",
  "dpt primary color": "DPT Primary Color",
  "dpt pattern type": "DPT Pattern Type",
}

export async function parseStockSheetBuffer(
  buffer: Buffer,
  fileName: string
): Promise<SheetParseResult> {
  const isCsv = fileName.toLowerCase().endsWith(".csv")
  const workbook = new ExcelJS.Workbook()

  if (isCsv) {
    const { Readable } = await import("stream")
    const stream = Readable.from(buffer)
    await workbook.csv.read(stream)
  } else {
    // Read XLSX in memory
    await workbook.xlsx.load(buffer as any)
  }

  const worksheet = workbook.worksheets[0]
  if (!worksheet) {
    return {
      headers: [],
      recognizedColumns: [],
      unrecognizedColumns: [],
      rows: [],
      errors: ["The uploaded spreadsheet contains no worksheets."],
    }
  }

  const headerRow = worksheet.getRow(1)
  const headers: { col: number; text: string; normalized: string }[] = []

  headerRow.eachCell((cell, colNumber) => {
    const text = (cell.text || "").trim()
    if (text) {
      headers.push({
        col: colNumber,
        text,
        normalized: text.toLowerCase().replace(/[\s_-]+/g, " ").trim(),
      })
    }
  })

  if (headers.length === 0) {
    return {
      headers: [],
      recognizedColumns: [],
      unrecognizedColumns: [],
      rows: [],
      errors: ["No header row detected in row 1 of the sheet."],
    }
  }

  const recognizedColumns: string[] = []
  const unrecognizedColumns: string[] = []

  // Check which headers are known
  headers.forEach((h) => {
    const n = h.normalized
    const isKnown =
      n === "sku" ||
      n === "client sku" ||
      n === "style" ||
      n === "style code" ||
      n === "top primary color" ||
      n === "color" ||
      n === "colour" ||
      n === "size" ||
      n === "selling price" ||
      n === "price" ||
      n === "compare at price" ||
      n === "compare-at price" ||
      n === "stock" ||
      n === "qty" ||
      n === "quantity" ||
      n === "product name" ||
      n === "name" ||
      n === "category" ||
      n === "product group" ||
      n === "creative description" ||
      n === "description" ||
      DETAIL_COLUMN_MAP[n] !== undefined

    if (isKnown) {
      recognizedColumns.push(h.text)
    } else {
      unrecognizedColumns.push(h.text)
    }
  })

  const rows: ParsedSheetRow[] = []
  const rowCount = worksheet.rowCount

  for (let r = 2; r <= rowCount; r++) {
    const row = worksheet.getRow(r)
    let hasAnyData = false

    const rawValues: Record<string, string> = {}
    headers.forEach((h) => {
      const cell = row.getCell(h.col)
      const val = (cell.text || "").trim()
      if (val) hasAnyData = true
      rawValues[h.text] = val
    })

    if (!hasAnyData) continue

    // Extract core fields
    let sku = ""
    let style = ""
    let colourName = ""
    let sizeLabel: string | null = null
    let productName: string | null = null
    let categoryName: string | null = null
    let productGroup: string | null = null
    let description: string | null = null
    let sellingPriceAED: number | null = null
    let compareAtPriceAED: number | null = null
    let stock: number | null = null
    const details: Record<string, string> = {}

    headers.forEach((h) => {
      const val = rawValues[h.text] || ""
      const n = h.normalized

      if (n === "sku" || n === "client sku") {
        sku = val
      } else if (n === "style" || n === "style code") {
        style = val
      } else if (n === "top primary color" || n === "color" || n === "colour") {
        colourName = val
      } else if (n === "size") {
        sizeLabel = val || null
      } else if (n === "product name" || n === "name") {
        productName = val || null
      } else if (n === "category") {
        categoryName = val || null
      } else if (n === "product group") {
        productGroup = val || null
      } else if (n === "creative description" || n === "description") {
        description = val || null
      } else if (n === "selling price" || n === "price") {
        const num = parseFloat(val.replace(/[^0-9.-]/g, ""))
        if (!isNaN(num)) sellingPriceAED = num
      } else if (n === "compare at price" || n === "compare-at price") {
        const num = parseFloat(val.replace(/[^0-9.-]/g, ""))
        if (!isNaN(num)) compareAtPriceAED = num
      } else if (n === "stock" || n === "quantity" || n === "qty") {
        const num = parseInt(val.replace(/[^0-9-]/g, ""), 10)
        if (!isNaN(num)) stock = num
      }

      // Check detail headers
      if (DETAIL_COLUMN_MAP[n]) {
        const canonicalKey = DETAIL_COLUMN_MAP[n]
        if (val) details[canonicalKey] = val
      }
    })

    // Infer size from SKU suffix if Size column is omitted (e.g. AR4380-TP-M -> M)
    if (!sizeLabel && sku) {
      const match = sku.match(/-(S|M|L|XL|XXL|XS|2XL|3XL)$/i)
      if (match) {
        sizeLabel = match[1].toUpperCase()
      }
    }

    // Infer colour from details if top primary color column was parsed in details
    if (!colourName && details["Top Primary Color"]) {
      colourName = details["Top Primary Color"]
    }

    rows.push({
      rowNumber: r,
      sku,
      style,
      colourName: colourName || "Standard",
      sizeLabel: sizeLabel || null,
      productName,
      categoryName,
      productGroup,
      description,
      sellingPriceAED,
      compareAtPriceAED,
      stock,
      details,
      rawValues,
    })
  }

  return {
    headers: headers.map((h) => h.text),
    recognizedColumns,
    unrecognizedColumns,
    rows,
    errors: [],
  }
}
