export type ProductStatus = "draft" | "published" | "archived"

export type AdminProductListItem = {
  id: string
  name: string
  slug: string
  category_id: string | null
  category_name: string | null
  status: ProductStatus
  is_final_sale: boolean
  created_at: string
  updated_at: string
  min_price_fils: number | null
  max_price_fils: number | null
  variant_count: number
  thumbnail_url: string | null
  style_codes: string[]
  skus: string[]
}

export type AdminProductsPaginatedResult = {
  products: AdminProductListItem[]
  total: number
  currentPage: number
  pageSize: number
  totalPages: number
}

export type AdminCategory = {
  id: string
  name: string
  slug: string
}

export type AdminColour = {
  id: string
  name: string
  slug: string
  swatch_hex: string | null
}

export type AdminSize = {
  id: string
  label: string
  sort: number
}

export type AdminProductVariant = {
  id: string
  sku: string
  size_id: string | null
  size_label: string | null
  price_fils: number
  compare_at_fils: number | null
  is_active: boolean
  first_sold_at: string | null
  on_hand: number
  reserved: number
}

export type AdminProductColourway = {
  id: string
  colour_id: string
  colour_name: string
  style_code: string
  details: Record<string, string>
  sort: number
  is_active: boolean
  images: Array<{
    id: string
    media_key: string
    alt: string
    sort: number
    url: string
  }>
  variants: AdminProductVariant[]
}

export type AdminProductDetail = {
  id: string
  name: string
  slug: string
  description: string | null
  category_id: string | null
  category_name: string | null
  product_group: string | null
  status: ProductStatus
  is_final_sale: boolean
  seo_title: string | null
  seo_description: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  colourways: AdminProductColourway[]
}
