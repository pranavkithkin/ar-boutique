import ExcelJS from "exceljs"

export interface StyleCodeSheetResult {
  styleCodes: string[]
  error?: string
}

function cellString(value: ExcelJS.CellValue): string | null {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "richText" in value) {
    return value.richText.map(part => part.text).join("")
  }
  return null
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, " ")
}

export async function readStyleCodeSheet(buffer: Buffer, fileName: string): Promise<StyleCodeSheetResult> {
  const workbook = new ExcelJS.Workbook()
  if (fileName.toLowerCase().endsWith(".csv")) {
    const { Readable } = await import("stream")
    await workbook.csv.read(Readable.from(buffer))
  } else {
    await workbook.xlsx.load(buffer as never)
  }

  const worksheet = workbook.worksheets[0]
  if (!worksheet) return { styleCodes: [], error: "The uploaded file contains no worksheets." }

  const matchingColumns: number[] = []
  worksheet.getRow(1).eachCell((cell, column) => {
    const header = cellString(cell.value)
    if (header && ["style", "style code"].includes(normalizeHeader(header))) matchingColumns.push(column)
  })

  if (matchingColumns.length === 0) return { styleCodes: [], error: "Add a column named Style Code (or Style) and upload the file again." }
  if (matchingColumns.length > 1) return { styleCodes: [], error: "The file has more than one Style Code column. Keep one and try again." }

  const column = matchingColumns[0]
  const styleCodes = new Set<string>()
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const cell = worksheet.getRow(rowNumber).getCell(column)
    if (cell.value === null || cell.value === undefined || cell.value === "") continue

    const styleCode = cellString(cell.value)
    if (styleCode === null) {
      return { styleCodes: [], error: `Style Code on row ${rowNumber} must be stored as text.` }
    }
    if (styleCode !== "") styleCodes.add(styleCode)
  }

  if (styleCodes.size === 0) return { styleCodes: [], error: "No style codes were found under the Style Code column." }
  return { styleCodes: [...styleCodes] }
}
