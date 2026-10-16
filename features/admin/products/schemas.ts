import { z } from "zod"

export const adminProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  category_id: z.string().uuid("Please select a valid category").nullable().or(z.literal("")),
  description: z.string().optional().nullable(),
  status: z.enum(["draft", "published", "archived"]),
  is_final_sale: z.boolean(),
  seo_title: z.string().max(70, "SEO title should be under 70 characters").optional().nullable(),
  seo_description: z.string().max(160, "SEO description should be under 160 characters").optional().nullable(),
})

export type AdminProductFormValues = z.infer<typeof adminProductSchema>
