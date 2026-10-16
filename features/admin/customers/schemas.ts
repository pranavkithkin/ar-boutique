import { z } from "zod"

export const updateCustomerCodSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  codDisabled: z.boolean(),
  codDisabledReason: z.string().max(500, "Reason must be under 500 characters").optional().nullable(),
})

export type UpdateCustomerCodInput = z.infer<typeof updateCustomerCodSchema>

export const updateCustomerNotesSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  notes: z.string().max(2000, "Notes must be under 2000 characters").optional().nullable(),
})

export type UpdateCustomerNotesInput = z.infer<typeof updateCustomerNotesSchema>
