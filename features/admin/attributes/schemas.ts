import { z } from "zod"

export const colourSchema = z.object({
  name: z
    .string()
    .min(1, "Colour name is required")
    .max(64, "Colour name must be at most 64 characters"),
  swatch_hex: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => !val || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val),
      "Swatch hex must be a valid hex color code (e.g. #1B4D3E)"
    ),
  is_active: z.boolean(),
})

export const sizeSchema = z.object({
  label: z
    .string()
    .min(1, "Size label is required")
    .max(32, "Size label must be at most 32 characters"),
  sort: z.coerce.number().int().min(0, "Sort order must be non-negative"),
  is_active: z.boolean(),
})

export type ColourFormSchema = z.infer<typeof colourSchema>
export type SizeFormSchema = z.infer<typeof sizeSchema>
