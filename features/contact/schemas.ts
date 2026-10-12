import { z } from "zod"

export const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Please enter your full name (at least 2 characters)." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().optional(),
  topic: z.string().min(1, { message: "Please select an inquiry topic." }),
  message: z.string().min(10, { message: "Please enter a message of at least 10 characters." }),
})

export type ContactFormValues = z.infer<typeof contactFormSchema>
