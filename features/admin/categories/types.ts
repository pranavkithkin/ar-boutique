export interface AdminCategoryItem {
  id: string
  name: string
  slug: string
  description: string | null
  image_key: string | null
  image_url: string | null
  sort: number
  is_active: boolean
  seo_title: string | null
  seo_description: string | null
  product_count: number
  created_at: string
  updated_at: string
}

export type CategoryVisibilityFilter = "all" | "visible" | "hidden"

export interface CreateCategoryResponse {
  success: boolean
  error?: string
  category?: AdminCategoryItem
}

export interface UpdateCategoryResponse {
  success: boolean
  error?: string
  category?: AdminCategoryItem
}

export interface DeleteCategoryResponse {
  success: boolean
  error?: string
  assignedCount?: number
}
