export interface BlogPost {
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
  status: "draft" | "published" | "archived"
  published_at: string | null
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

export type BlogPostListItem = Pick<
  BlogPost,
  | "id"
  | "slug"
  | "title"
  | "excerpt"
  | "category"
  | "cover_image"
  | "author"
  | "read_time"
  | "is_featured"
  | "published_at"
>

