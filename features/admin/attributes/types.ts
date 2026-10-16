export interface AdminColourItem {
  id: string
  name: string
  slug: string
  swatch_hex: string | null
  sort: number
  is_active: boolean
  usage_count: number
  created_at: string
  updated_at: string
}

export interface AdminSizeItem {
  id: string
  label: string
  sort: number
  is_active: boolean
  usage_count: number
  created_at: string
  updated_at: string
}

export interface ColourFormValues {
  name: string
  slug?: string
  swatch_hex?: string | null
  sort?: number
  is_active: boolean
}

export interface SizeFormValues {
  label: string
  sort: number
  is_active: boolean
}
