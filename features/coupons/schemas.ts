import { z } from "zod"

export const couponFormSchema = z.object({
  code: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .pipe(
      z
        .string()
        .min(2, "Code must be at least 2 characters")
        .max(30, "Code must be 30 characters or less")
        .regex(/^[A-Z0-9_-]+$/, "Code can only contain letters, numbers, hyphens, and underscores")
    ),
  description: z.string().max(255).optional().nullable(),
  discountType: z.enum(["percentage", "fixed_fils", "free_shipping"]),
  discountValue: z.coerce.number().min(0, "Value cannot be negative"),
  minOrderAed: z.coerce.number().min(0).default(0),
  maxDiscountAed: z.coerce.number().min(0).optional().nullable(),
  usageLimit: z.coerce.number().int().min(1).optional().nullable(),
  perCustomerLimit: z.coerce.number().int().min(1).default(1),
  startsAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

export type CouponFormValues = z.infer<typeof couponFormSchema>

export const validateCouponSchema = z.object({
  code: z
    .string()
    .min(1, "Please enter a promo code")
    .transform((v) => v.toUpperCase().trim()),
  subtotalFils: z.number().nonnegative(),
  customerEmail: z.string().email().optional(),
})
