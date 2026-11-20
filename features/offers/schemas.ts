import { z } from "zod"

export const offerSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens"),
  description: z.string().trim().max(1500),
  terms: z.string().trim().max(3000),
  status: z.enum(["draft", "published", "disabled"]),
  discount_type: z.enum(["percentage", "fixed_fils", "free_shipping"]),
  discount_value: z.number().int().nonnegative().max(10000000),
  scope: z.enum(["all", "products", "categories"]),
  product_ids: z.array(z.string().uuid()).max(500),
  category_ids: z.array(z.string().uuid()).max(100),
  min_order_fils: z.number().int().min(0).max(10000000),
  max_discount_fils: z.number().int().positive().max(10000000).nullable(),
  usage_limit: z.number().int().positive().max(1000000).nullable(),
  per_customer_limit: z.number().int().positive().max(1000000).nullable(),
  starts_at: z.string().datetime({ offset: true }).nullable(),
  expires_at: z.string().datetime({ offset: true }).nullable(),
}).superRefine((v, ctx) => {
  const issue = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message })
  if (v.discount_type === "percentage" && (v.discount_value < 1 || v.discount_value > 100)) issue("discount_value", "Percentage must be between 1 and 100")
  if (v.discount_type === "fixed_fils" && v.discount_value < 1) issue("discount_value", "Enter a positive discount")
  if (v.scope === "products" && !v.product_ids.length) issue("product_ids", "Select at least one product")
  if (v.scope === "categories" && !v.category_ids.length) issue("category_ids", "Select at least one category")
  if (v.starts_at && v.expires_at && new Date(v.starts_at) >= new Date(v.expires_at)) issue("expires_at", "End date must be after the start date")
})

export type OfferInput = z.infer<typeof offerSchema>
export const offerLinesSchema = z.array(z.object({
  variantId: z.string().uuid(), quantity: z.number().int().min(1).max(5),
})).min(1).max(100)
