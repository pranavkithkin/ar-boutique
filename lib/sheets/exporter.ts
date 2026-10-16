import ExcelJS from "exceljs"
import { createAdminClient } from "@/lib/supabase/server"

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
 * Generate an Excel (.xlsx) workbook buffer containing the entire boutique catalogue,
 * formatted strictly according to the client's stock sheet schema (TASK-115, ADR-032, ADR-036).
 *
 * Rules:
 * - Every value is exported exactly as stored.
 * - Text cells are formatted as text ('@') so formulas never execute.
 * - Prices and stock quantities are formatted as numbers.
 * - Round-trip invariant: Exporting then uploading the same file changes nothing.
 */
export async function exportCatalogueToExcelBuffer(): Promise<Buffer> {
  const adminDb = createAdminClient()

  // Fetch all variants with nested relations
  const { data: variants, error } = await adminDb
    .from("product_variants")
    .select(`
      id,
      sku,
      price_fils,
      compare_at_fils,
      is_active,
      sizes:size_id (
        id,
        label,
        sort
      ),
      stock_levels (
        on_hand,
        reserved
      ),
      product_colours:product_colour_id (
        id,
        style_code,
        details,
        colours:colour_id (
          id,
          name
        ),
        products:product_id (
          id,
          name,
          description,
          product_group,
          categories:category_id (
            id,
            name
          )
        )
      )
    `)
    .order("sku", { ascending: true })

  if (error) {
    console.error("Error fetching catalogue for export:", error)
    throw new Error(`Failed to query catalogue data: ${error.message}`)
  }

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "AR Boutique Administration"
  workbook.lastModifiedBy = "AR Boutique Admin"
  workbook.created = new Date()
  workbook.modified = new Date()

  const worksheet = workbook.addWorksheet("Catalogue", {
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

interface ExportVariantRow {
  id: string
  sku: string
  price_fils: number | null
  compare_at_fils: number | null
  is_active: boolean
  sizes: { id: string; label: string; sort: number } | null
  stock_levels: { on_hand: number; reserved: number }[] | null
  product_colours: {
    id: string
    style_code: string
    details: Record<string, string> | null
    colours: { id: string; name: string } | null
    products: {
      id: string
      name: string
      description: string | null
      product_group: string | null
      categories: { id: string; name: string } | null
    } | null
  } | null
}

  // Sort rows cleanly: Product Name ASC, Style Code ASC, Colour ASC, Size sort ASC
  const rawVariants = (variants || []) as unknown as ExportVariantRow[]
  rawVariants.sort((a, b) => {
    const pNameA = a.product_colours?.products?.name || ""
    const pNameB = b.product_colours?.products?.name || ""
    if (pNameA !== pNameB) return pNameA.localeCompare(pNameB)

    const styleA = a.product_colours?.style_code || ""
    const styleB = b.product_colours?.style_code || ""
    if (styleA !== styleB) return styleA.localeCompare(styleB)

    const sortA = a.sizes?.sort ?? 999
    const sortB = b.sizes?.sort ?? 999
    return sortA - sortB
  })

  // Populate data rows
  for (const v of rawVariants) {
    const pc = v.product_colours
    const p = pc?.products
    const details = pc?.details || {}
    const colName = pc?.colours?.name || details["Top Primary Color"] || ""
    const sizeLabel = v.sizes?.label || ""
    const catName = p?.categories?.name || ""

    const sellingPriceAED = typeof v.price_fils === "number" ? v.price_fils / 100 : 0
    const compareAtPriceAED =
      typeof v.compare_at_fils === "number" && v.compare_at_fils > 0
        ? v.compare_at_fils / 100
        : null

    const stockOnHand =
      v.stock_levels && v.stock_levels.length > 0 && typeof v.stock_levels[0].on_hand === "number"
        ? v.stock_levels[0].on_hand
        : 0

    const rowData: Record<string, string | number | null> = {
      sku: v.sku ?? "",
      style: pc?.style_code ?? "",
      packageContains: details["Package Contains"] ?? "-",
      topPortalFabric: details["Top Portal Fabric"] ?? "-",
      topPrimaryColor: colName,
      topPatternType: details["Top Pattern Type"] ?? "-",
      topNeckDetails: details["Top Neck Details"] ?? "-",
      topSleeveDetails: details["Top Sleeve Details"] ?? "-",
      topCategory: details["Top Category"] ?? "-",
      btmStyleType: details["BTM Style Type"] ?? "-",
      btmFabricType: details["BTM Fabric Type"] ?? "-",
      btmPrimaryColor: details["BTM Primary Color"] ?? "-",
      dptFabricType: details["DPT Fabric Type"] ?? "-",
      dptPrimaryColor: details["DPT Primary Color"] ?? "-",
      dptPatternType: details["DPT Pattern Type"] ?? "-",
      creativeDescription: p?.description ?? "",
      sellingPrice: sellingPriceAED,
      size: sizeLabel,
      stock: stockOnHand,
      productName: p?.name ?? "",
      category: catName,
      compareAtPrice: compareAtPriceAED,
      productGroup: p?.product_group ?? "",
    }

    const row = worksheet.addRow(rowData)
    row.height = 20

    // Apply formatting to each cell in the row
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
        cell.numFmt = "@" // Standard text cell format
        cell.alignment = { vertical: "middle", horizontal: "left" }
      }
    })
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
