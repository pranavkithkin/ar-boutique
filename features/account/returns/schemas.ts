import { z } from "zod"

export const RETURN_REASONS = [
  "Fit / Size too small",
  "Fit / Size too large",
  "Colour or fabric different from editorial",
  "Defect or flaw in craftsmanship",
  "Style not suitable / changed mind",
] as const

export type ReturnReason = (typeof RETURN_REASONS)[number]

export const uaeIbanRegex = /^AE\d{21}$/i

export const returnItemInputSchema = z.object({
  orderItemId: z.string().min(1, "Order item ID is required"),
  variantId: z.string().optional(),
  productName: z.string().min(1),
  colourName: z.string().min(1),
  styleCode: z.string().optional(),
  sizeLabel: z.string().min(1),
  sku: z.string().min(1),
  unitPriceFils: z.number().int().nonnegative(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  reason: z.string().min(1, "Please choose a return reason"),
  mediaKey: z.string().optional(),
})

export const customerReturnFormSchema = z
  .object({
    orderId: z.string().uuid("Invalid order identifier"),
    isCodOrder: z.boolean().default(false),
    items: z
      .array(returnItemInputSchema)
      .min(1, "Please select at least one garment piece to return"),
    customerComment: z
      .string()
      .max(500, "Notes cannot exceed 500 characters")
      .optional()
      .or(z.literal("")),
    photoKeys: z.array(z.string()).max(5, "Maximum 5 photos allowed").default([]),
    // UAE Bank details for Cash on Delivery orders (ADR-039)
    bankName: z.string().optional(),
    accountHolderName: z.string().optional(),
    iban: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isCodOrder) {
      if (!data.bankName || data.bankName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bank name is required for Cash on Delivery bank refund",
          path: ["bankName"],
        })
      }
      if (!data.accountHolderName || data.accountHolderName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Account beneficiary name is required",
          path: ["accountHolderName"],
        })
      }
      const cleanIban = (data.iban || "").replace(/\s+/g, "").toUpperCase()
      if (!cleanIban) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "UAE IBAN is required for bank transfer refund",
          path: ["iban"],
        })
      } else if (!uaeIbanRegex.test(cleanIban)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid UAE IBAN starting with 'AE' followed by 21 digits",
          path: ["iban"],
        })
      }
    }
  })

export type CustomerReturnFormValues = z.infer<typeof customerReturnFormSchema>
