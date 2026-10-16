export type ImportRowAction =
  | "create_product"
  | "create_colourway"
  | "create_variant"
  | "update_variant"
  | "unchanged"
  | "error"

export interface ImportRowDiff {
  rowNumber: number
  sku: string
  style: string
  productName: string
  colourName: string
  sizeLabel: string | null
  action: ImportRowAction
  actionLabel: string
  stockBefore: number | null
  stockAfter: number | null
  stockDelta: number | null
  priceFilsBefore: number | null
  priceFilsAfter: number | null
  isNewProduct: boolean
  isNewColourway: boolean
  isNewVariant: boolean
  errors: string[]
  warnings: string[]
}

export interface ImportPreviewSummary {
  importId: string
  fileName: string
  totalRows: number
  productsToCreate: number
  colourwaysToCreate: number
  variantsToCreate: number
  variantsToUpdate: number
  unchangedRows: number
  errorCount: number
  warningCount: number
  unrecognizedColumns: string[]
  diffs: ImportRowDiff[]
  canApply: boolean
}
