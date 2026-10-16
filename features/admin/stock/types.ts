export type StockStatus = "in_stock" | "low_stock" | "out_of_stock"

export type StockFilter = "all" | StockStatus

export interface AdminStockSkuItem {
  variant_id: string
  product_id: string
  product_name: string
  product_slug: string
  colourway_id: string
  colour_name: string
  style_code: string
  size_id: string | null
  size_label: string
  size_sort: number
  sku: string
  price_fils: number
  is_active: boolean
  on_hand: number
  reserved: number
  available: number
  thumbnail_url: string | null
  status: StockStatus
}

export interface AdminStockSummary {
  total_skus: number
  total_on_hand: number
  total_reserved: number
  total_available: number
  in_stock_count: number
  low_stock_count: number
  out_of_stock_count: number
}

export interface AdminStockAdjustmentEntry {
  id: string
  variant_id: string
  delta: number
  on_hand_before: number
  on_hand_after: number
  reason: string
  note: string | null
  actor_sub: string | null
  created_at: string
  return_id: string | null
  order_id?: string | null
  import_id?: string | null
}

export interface AdminStockMatrixVariant {
  variant_id: string
  sku: string
  size_label: string
  on_hand: number
  reserved: number
  available: number
  status: StockStatus
}

export interface AdminStockMatrixRow {
  colourway_id: string
  product_id: string
  product_name: string
  product_slug: string
  colour_name: string
  style_code: string
  thumbnail_url: string | null
  variants_by_size: Record<string, AdminStockMatrixVariant> // size label -> variant info
  total_on_hand: number
  total_reserved: number
  total_available: number
}
