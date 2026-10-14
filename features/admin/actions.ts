"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { adminLoginSchema, AdminLoginFormValues } from "./schemas"

export type AdminLoginResult = {
  success: boolean
  error?: string
  redirectTo?: string
}

export async function loginAdminAction(data: AdminLoginFormValues): Promise<AdminLoginResult> {
  const parsed = adminLoginSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid credentials format",
    }
  }

  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message || "Invalid email or password",
    }
  }

  // Check admin role in app_metadata
  const isMetadataAdmin = authData.user.app_metadata?.user_role === "admin"

  // Verify active status in admin_users if SUPABASE_SECRET_KEY is present
  let isDbAdminActive = true
  if (process.env.SUPABASE_SECRET_KEY) {
    try {
      const adminClient = createAdminClient()
      const { data: adminRecord, error: dbErr } = await adminClient
        .from("admin_users")
        .select("is_active, role")
        .eq("user_id", authData.user.id)
        .single()

      if (dbErr || !adminRecord || !adminRecord.is_active) {
        isDbAdminActive = false
      }
    } catch {
      // If service query fails, fallback to app_metadata check
    }
  }

  if (!isMetadataAdmin || !isDbAdminActive) {
    await supabase.auth.signOut()
    return {
      success: false,
      error: "Access denied. You do not have active administrator permissions.",
    }
  }

  return {
    success: true,
    redirectTo: "/admin",
  }
}

export async function logoutAdminAction(): Promise<{ success: boolean }> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return { success: true }
}
