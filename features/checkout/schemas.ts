import { z } from "zod"

export const UAE_EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Ras Al Khaimah",
  "Fujairah",
  "Umm Al Quwain",
] as const

export type UAEEmirate = (typeof UAE_EMIRATES)[number]

export const checkoutFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters"),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address for order confirmation"),
  phone: z
    .string()
    .trim()
    .min(7, "Valid phone number is required (e.g. +971 50 123 4567)")
    .refine((val) => /^(\+971|00971|0)?5[0-9]{8}$/.test(val.replace(/[\s-]/g, "")) || val.length >= 9, {
      message: "Please enter a valid UAE mobile number (+971 5X XXX XXXX)",
    }),
  emirate: z.enum(UAE_EMIRATES, {
    errorMap: () => ({ message: "Please select an emirate" }),
  }),
  area: z
    .string()
    .trim()
    .min(2, "Area or neighbourhood is required (e.g. Jumeirah 1, Downtown)"),
  street: z
    .string()
    .trim()
    .min(2, "Street name or number is required"),
  building: z
    .string()
    .trim()
    .min(1, "Villa, building, or tower name is required"),
  apartment: z.string().optional(),
  landmark: z.string().optional(),
  instructions: z.string().optional(),
  paymentMethod: z.enum(["card", "cod"], {
    errorMap: () => ({ message: "Please select a payment method" }),
  }),
  saveAddress: z.boolean(),
})

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>
