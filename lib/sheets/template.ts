import ExcelJS from "exceljs"
export interface ExportColumnDef {
  header: string
  key: string
  width: number
  isNumber?: boolean
  numberFormat?: string
}

export const CATALOGUE_EXPORT_COLUMNS: ExportColumnDef[] = [
  { header: "SKU", key: "sku", width: 22 },
  { header: "Style", key: "style", width: 18 },
  { header: "Package Contains", key: "packageContains", width: 20 },
  { header: "Top Portal Fabric", key: "topPortalFabric", width: 18 },
  { header: "Top Primary Color", key: "topPrimaryColor", width: 18 },
  { header: "Top Pattern Type", key: "topPatternType", width: 18 },
  { header: "Top Neck Details", key: "topNeckDetails", width: 18 },
  { header: "Top Sleeve Details", key: "topSleeveDetails", width: 18 },
  { header: "Top Category", key: "topCategory", width: 16 },
  { header: "BTM Style Type", key: "btmStyleType", width: 16 },
  { header: "BTM Fabric Type", key: "btmFabricType", width: 16 },
  { header: "BTM Primary Color", key: "btmPrimaryColor", width: 18 },
  { header: "DPT Fabric Type", key: "dptFabricType", width: 16 },
  { header: "DPT Primary Color", key: "dptPrimaryColor", width: 18 },
  { header: "DPT Pattern Type", key: "dptPatternType", width: 18 },
  { header: "Creative Description", key: "creativeDescription", width: 36 },
  { header: "Selling Price", key: "sellingPrice", width: 15, isNumber: true, numberFormat: "#,##0.00" },
  { header: "Size", key: "size", width: 10 },
  { header: "Stock", key: "stock", width: 12, isNumber: true, numberFormat: "0" },
  { header: "Product Name", key: "productName", width: 30 },
  { header: "Category", key: "category", width: 18 },
  { header: "Compare-at Price", key: "compareAtPrice", width: 18, isNumber: true, numberFormat: "#,##0.00" },
  { header: "Product Group", key: "productGroup", width: 18 },
]

/**
 * Generates a ready-to-fill sample boutique stock sheet template (.xlsx)
 * pre-populated with client schema headers, cell formatting, sample rows,
 * and an Instructions tab.
 *
 * Rules:
 * - Uses exact client stock sheet column headers (ADR-029, ADR-032).
 * - Text cells formatted as '@' so formulas never execute.
 * - Number cells (Selling Price, Compare-at Price, Stock) formatted numerically.
 * - Admins can delete or edit the sample rows and upload directly.
 */
export async function generateStockSheetTemplateBuffer(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "AR Boutique Administration"
  workbook.lastModifiedBy = "AR Boutique Admin"
  workbook.created = new Date()
  workbook.modified = new Date()

  // -------------------------------------------------------------
  // TAB 1: Stock Sheet (Template Data Sheet)
  // -------------------------------------------------------------
  const worksheet = workbook.addWorksheet("Stock Sheet", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  })

  // Configure Columns
  worksheet.columns = CATALOGUE_EXPORT_COLUMNS.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }))

  // Style Header Row
  const headerRow = worksheet.getRow(1)
  headerRow.height = 26
  headerRow.eachCell((cell) => {
    cell.font = {
      name: "Calibri",
      size: 10,
      bold: true,
      color: { argb: "FF09090B" },
    }
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF4F4F5" },
    }
    cell.border = {
      top: { style: "thin", color: { argb: "FFE4E4E7" } },
      bottom: { style: "medium", color: { argb: "FFD4D4D8" } },
      left: { style: "thin", color: { argb: "FFE4E4E7" } },
      right: { style: "thin", color: { argb: "FFE4E4E7" } },
    }
    cell.alignment = {
      vertical: "middle",
      horizontal: "left",
      wrapText: false,
    }
  })

  // Sample Row demonstrating product schema
  const sampleRows = [
    {
      sku: "AR-SAMPLE-01-M",
      style: "AR-SAMPLE-01",
      packageContains: "Top, Bottom & Dupatta",
      topPortalFabric: "Pure Organza Silk",
      topPrimaryColor: "Emerald Green",
      topPatternType: "Hand Embroidered",
      topNeckDetails: "Round Neck",
      topSleeveDetails: "Full Sleeves",
      topCategory: "Kurti",
      btmStyleType: "Straight Pants",
      btmFabricType: "Raw Silk",
      btmPrimaryColor: "Emerald Green",
      dptFabricType: "Organza Silk",
      dptPrimaryColor: "Emerald Green",
      dptPatternType: "Zari Border",
      creativeDescription: "Luxury hand-embroidered emerald green organza 3-piece suit with metallic zari work.",
      sellingPrice: 850.0,
      size: "M",
      stock: 12,
      productName: "Emerald Noor Embroidered Suit",
      category: "Suits",
      compareAtPrice: 950.0,
      productGroup: "Festive Collection",
    },
  ]

  sampleRows.forEach((rowObj) => {
    const row = worksheet.addRow(rowObj)
    row.height = 20

    CATALOGUE_EXPORT_COLUMNS.forEach((colDef, idx) => {
      const cell = row.getCell(idx + 1)
      cell.font = { name: "Calibri", size: 10 }
      cell.border = {
        top: { style: "thin", color: { argb: "FFF4F4F5" } },
        bottom: { style: "thin", color: { argb: "FFE4E4E7" } },
        left: { style: "thin", color: { argb: "FFF4F4F5" } },
        right: { style: "thin", color: { argb: "FFF4F4F5" } },
      }

      if (colDef.isNumber) {
        if (cell.value !== null && cell.value !== "" && typeof cell.value === "number") {
          cell.numFmt = colDef.numberFormat || "#,##0.00"
          cell.alignment = { vertical: "middle", horizontal: "right" }
        } else {
          cell.alignment = { vertical: "middle", horizontal: "right" }
        }
      } else {
        cell.numFmt = "@" // Text format
        cell.alignment = { vertical: "middle", horizontal: "left" }
      }
    })
  })

  // -------------------------------------------------------------
  // TAB 2: Instructions & Guidelines
  // -------------------------------------------------------------
  const guideSheet = workbook.addWorksheet("Instructions & Guide")
  guideSheet.columns = [
    { header: "Field", key: "field", width: 24 },
    { header: "Required?", key: "required", width: 14 },
    { header: "Description & Allowed Format", key: "desc", width: 65 },
  ]

  const guideHeaderRow = guideSheet.getRow(1)
  guideHeaderRow.height = 24
  guideHeaderRow.eachCell((cell) => {
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF09090B" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F4F5" } }
  })

  const guidelines = [
    { field: "SKU", required: "YES", desc: "Unique inventory SKU (e.g. AR-101-M). Case-insensitive identifier." },
    { field: "Style", required: "YES", desc: "Garment style code (e.g. AR-101). Groups colourways and sizes." },
    { field: "Product Name", required: "Recommended", desc: "Public product display title." },
    { field: "Category", required: "Recommended", desc: "Product category (e.g. Suits, Abayas, Co-ords, Dupattas)." },
    { field: "Top Primary Color", required: "YES", desc: "Colourway name (e.g. Emerald Green, Midnight Black)." },
    { field: "Size", required: "Optional", desc: "Size label (e.g. XS, S, M, L, XL, XXL) or '-' for free size." },
    { field: "Selling Price", required: "YES", desc: "AED retail price as a number (e.g. 850.00). Do not include 'AED' text." },
    { field: "Compare-at Price", required: "Optional", desc: "Original strike-through price in AED (for sale items)." },
    { field: "Stock", required: "YES", desc: "Available on-hand physical inventory quantity (integer, e.g. 10)." },
    { field: "Package Contains", required: "Optional", desc: "Summary of pieces included (e.g. Top, Bottom & Dupatta)." },
    { field: "Top Portal Fabric", required: "Optional", desc: "Primary upper garment fabric (e.g. Silk Organza, Pure Cotton)." },
    { field: "Creative Description", required: "Optional", desc: "Detailed product description shown on the storefront." },
    { field: "Tips for Upload", required: "NOTE", desc: "You can delete or overwrite the sample rows in 'Stock Sheet' tab with your real inventory." },
  ]

  guidelines.forEach((item) => {
    const row = guideSheet.addRow(item)
    row.height = 20
    row.getCell(1).font = { name: "Calibri", size: 10, bold: true }
    row.getCell(2).font = {
      name: "Calibri",
      size: 10,
      color: { argb: item.required === "YES" ? "FFB91C1C" : "FF52525B" },
      bold: item.required === "YES",
    }
    row.getCell(3).font = { name: "Calibri", size: 10 }
  })

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
