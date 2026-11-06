import { z } from "zod"

export const blogPostSchema = z.object({
  id: z.string().uuid().optional(),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title cannot exceed 200 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(200, "Slug cannot exceed 200 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens (e.g. 'my-story')"),
  excerpt: z.string().max(500, "Excerpt cannot exceed 500 characters").optional().nullable(),
  content: z.string().optional().nullable(),
  category: z.string().optional().default("Journal"),
  cover_image: z.string().optional().nullable(),
  author: z.string().min(1, "Author name is required").default("AR Boutique"),
  read_time: z.string().default("4 min read"),
  is_featured: z.boolean().default(false),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  published_at: z.string().optional().nullable(),
  seo_title: z.string().max(100, "SEO title cannot exceed 100 characters").optional().nullable(),
  seo_description: z.string().max(200, "SEO description cannot exceed 200 characters").optional().nullable(),
})

export type BlogPostFormValues = z.infer<typeof blogPostSchema>

