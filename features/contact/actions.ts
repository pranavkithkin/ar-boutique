"use server"

import "server-only"
import { contactFormSchema, type ContactFormValues } from "./schemas"
import { sendContactInquiryEmail } from "@/lib/email"

export interface SubmitContactInquiryResult {
  success: boolean
  error?: string
}

/**
 * Server Action: Validates and processes a customer concierge inquiry from /contact.
 * Dispatches notification emails to the boutique team and auto-acknowledgment to the patron.
 */
export async function submitContactInquiryAction(
  data: ContactFormValues
): Promise<SubmitContactInquiryResult> {
  try {
    // 1. Validate payload with Zod
    const parsed = contactFormSchema.safeParse(data)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid form submission."
      return { success: false, error: firstError }
    }

    const { name, email, phone, topic, message } = parsed.data

    // 2. Dispatch email to operations team and customer
    const emailRes = await sendContactInquiryEmail({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || undefined,
      topic: topic.trim(),
      message: message.trim(),
    })

    if (!emailRes.success) {
      return {
        success: false,
        error: emailRes.error || "Failed to deliver inquiry. Please try WhatsApp.",
      }
    }

    return { success: true }
  } catch (err: unknown) {
    console.error("[Contact Action] Unexpected error submitting inquiry:", err)
    return {
      success: false,
      error: "An unexpected error occurred while submitting your message. Please try WhatsApp.",
    }
  }
}

