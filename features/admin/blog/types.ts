export type BlogPostStatus = "draft" | "published" | "archived"

export interface AdminBlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string | null
  category: string
  cover_image: string | null
  author: string
  read_time: string
  is_featured: boolean
  status: BlogPostStatus
  published_at: string | null
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

export interface SaveBlogPostInput {
  id?: string
  title: string
  slug: string
  excerpt?: string | null
  content?: string | null
  category?: string
  cover_image?: string | null
  author?: string
  read_time?: string
  is_featured?: boolean
  status: BlogPostStatus
  published_at?: string | null
  seo_title?: string | null
  seo_description?: string | null
}

export interface AdminBlogMutationResponse {
  success: boolean
  post?: AdminBlogPost
  error?: string
}

