import { z } from "zod"

export const addressSchema = z.object({
  label: z.string().min(1, "Label is required (e.g. Home, Office)"),
  recipientName: z.string().min(2, "Full name is required"),
  phone: z.string().min(7, "Valid phone number is required"),
  emirate: z.enum([
    "Dubai",
    "Abu Dhabi",
    "Sharjah",
    "Ajman",
    "Ras Al Khaimah",
    "Fujairah",
    "Umm Al Quwain",
  ]),
  area: z.string().min(2, "Area or district is required"),
  street: z.string().min(2, "Street address is required"),
  building: z.string().min(1, "Villa or Building name is required"),
  apartment: z.string().optional(),
  landmark: z.string().optional(),
  isDefault: z.boolean(),
})

export type AddressFormValues = z.infer<typeof addressSchema>

export const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(7, "Valid phone number is required"),
  preferredLanguage: z.enum(["en", "ar"]),
  notifyWhatsApp: z.boolean(),
  notifyEmail: z.boolean(),
})

export type ProfileFormValues = z.infer<typeof profileSchema>

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password must be at least 6 characters"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  })

export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>

export const guestOrderLookupSchema = z.object({
  orderNumber: z.string().min(3, "Order number is required (e.g. AR-1048)"),
  email: z.string().email("Valid email address is required"),
})

export type GuestOrderLookupFormValues = z.infer<typeof guestOrderLookupSchema>
