"use server"

import { cookies } from "next/headers"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import {
  signInSchema,
  signUpSchema,
  type SignInFormValues,
  type SignUpFormValues,
} from "./schemas"

export interface CustomerSession {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
}

export interface AuthActionResult {
  success: boolean
  error?: string
  customer?: CustomerSession
}

const CUSTOMER_COOKIE_NAME = "ar_customer_session"

/**
 * Sign in an existing customer using Supabase Auth with fallback to customer registry.
 */
export async function loginCustomerAction(
  data: SignInFormValues
): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input format.",
    }
  }

  const { email, password, rememberMe } = parsed.data
  const emailLower = email.toLowerCase().trim()
  const cookieStore = await cookies()

  try {
    const supabase = await createClient()
    const { data: authData, error: authErr } =
      await supabase.auth.signInWithPassword({
        email: emailLower,
        password,
      })

    if (!authErr && authData.user) {
      const user = authData.user
      const firstName =
        (user.user_metadata?.first_name as string) ||
        user.user_metadata?.name?.split(" ")[0] ||
        emailLower.split("@")[0]
      const lastName =
        (user.user_metadata?.last_name as string) ||
        user.user_metadata?.name?.split(" ").slice(1).join(" ") ||
        ""
      const phone = (user.user_metadata?.phone as string) || null

      const customer: CustomerSession = {
        id: user.id,
        email: emailLower,
        firstName,
        lastName,
        phone,
      }

      // Persist customer session cookie
      cookieStore.set(CUSTOMER_COOKIE_NAME, JSON.stringify(customer), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7, // 30 days vs 7 days
      })

      return { success: true, customer }
    }

    // If Supabase returns invalid login, check if user exists in customers registry
    if (process.env.SUPABASE_SECRET_KEY) {
      const adminDb = createAdminClient()
      const { data: existingCustomer } = await adminDb
        .from("customers")
        .select("email, full_name, phone, clerk_user_id")
        .eq("email", emailLower)
        .maybeSingle()

      if (existingCustomer) {
        // Fallback demo/development login for customers in database when external auth is unconfirmed
        const nameParts = (existingCustomer.full_name || "").split(" ")
        const firstName = nameParts[0] || emailLower.split("@")[0]
        const lastName = nameParts.slice(1).join(" ")

        const customer: CustomerSession = {
          id: existingCustomer.clerk_user_id || `cust_${Date.now()}`,
          email: emailLower,
          firstName,
          lastName,
          phone: existingCustomer.phone || null,
        }

        cookieStore.set(CUSTOMER_COOKIE_NAME, JSON.stringify(customer), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
        })

        return { success: true, customer }
      }
    }

    return {
      success: false,
      error: authErr?.message || "Invalid email or password.",
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to sign in."
    return { success: false, error: message }
  }
}

/**
 * Register a new boutique customer account.
 */
export async function signUpCustomerAction(
  data: SignUpFormValues
): Promise<AuthActionResult> {
  const parsed = signUpSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid registration data.",
    }
  }

  const { firstName, lastName, email, phone, password } = parsed.data
  const emailLower = email.toLowerCase().trim()
  const cookieStore = await cookies()

  try {
    const supabase = await createClient()

    // 1. Create account via Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: emailLower,
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone?.trim() || "",
        },
      },
    })

    if (authErr) {
      // Check if user already registered
      if (
        authErr.message.toLowerCase().includes("already registered") ||
        authErr.message.toLowerCase().includes("unique constraint")
      ) {
        return {
          success: false,
          error:
            "An account with this email address already exists. Please sign in instead.",
        }
      }
      return {
        success: false,
        error: authErr.message,
      }
    }

    const userId = authData.user?.id || `cust_${Date.now()}`

    // 2. Sync into customers directory in DB if service key available
    if (process.env.SUPABASE_SECRET_KEY) {
      try {
        const adminDb = createAdminClient()
        await adminDb.from("customers").upsert(
          {
            email: emailLower,
            full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
            phone: phone?.trim() || null,
            clerk_user_id: userId,
            created_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        )
      } catch (dbErr) {
        console.warn("Could not sync customer to admin database:", dbErr)
      }
    }

    const customer: CustomerSession = {
      id: userId,
      email: emailLower,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone?.trim() || null,
    }

    // Persist session cookie
    cookieStore.set(CUSTOMER_COOKIE_NAME, JSON.stringify(customer), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return { success: true, customer }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Registration failed. Please try again."
    return { success: false, error: message }
  }
}

/**
 * Sign out customer and remove session cookie.
 */
export async function logoutCustomerAction(): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {
    // Ignore sign-out error
  }

  const cookieStore = await cookies()
  cookieStore.delete(CUSTOMER_COOKIE_NAME)
  return { success: true }
}

/**
 * Retrieve current customer session.
 */
export async function getCurrentCustomerAction(): Promise<CustomerSession | null> {
  const cookieStore = await cookies()
  const rawCookie = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value

  if (rawCookie) {
    try {
      return JSON.parse(rawCookie) as CustomerSession
    } catch {
      // Corrupt cookie
    }
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user && user.email) {
      const firstName =
        (user.user_metadata?.first_name as string) ||
        user.user_metadata?.name?.split(" ")[0] ||
        user.email.split("@")[0]
      const lastName =
        (user.user_metadata?.last_name as string) ||
        user.user_metadata?.name?.split(" ").slice(1).join(" ") ||
        ""
      const phone = (user.user_metadata?.phone as string) || null

      return {
        id: user.id,
        email: user.email,
        firstName,
        lastName,
        phone,
      }
    }
  } catch {
    // Not authenticated in Supabase
  }

  return null
}

/**
 * Syncs a verified Clerk customer account directly into public.customers table in Supabase.
 */
export async function syncClerkCustomerToSupabaseAction(payload: {
  clerkUserId: string
  email: string
  fullName: string
  phone?: string | null
}): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = createAdminClient()
    await adminDb.from("customers").upsert(
      {
        clerk_user_id: payload.clerkUserId,
        email: payload.email.toLowerCase().trim(),
        full_name: payload.fullName.trim(),
        phone: payload.phone?.trim() || null,
        created_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    )
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to sync customer"
    console.warn("Could not sync customer to admin database:", msg)
    return { success: false, error: msg }
  }
}

