import "server-only"

import { createClient, createAdminClient } from "@/lib/supabase/server"

export interface AdminIdentity {
  id: string
  email: string | null
}

/**
 * Verifies the signed Supabase JWT, admin role claim, and active admin row.
 * Refunds allow password-authenticated admins; MFA is not required.
 */
export async function requireAdmin(): Promise<AdminIdentity | null> {
  const authClient = await createClient()
  const { data, error } = await authClient.auth.getClaims()
  const claims = data?.claims as Record<string, unknown> | undefined

  const userId = typeof claims?.sub === "string" ? claims.sub : null
  const appMetadata = claims?.app_metadata as Record<string, unknown> | undefined
  const role = typeof claims?.user_role === "string"
    ? claims.user_role
    : typeof appMetadata?.user_role === "string"
    ? appMetadata.user_role
    : null
  if (error || !userId || role !== "admin") {
    return null
  }

  const adminDb = createAdminClient()
  const { data: admin, error: adminError } = await adminDb
    .from("admin_users")
    .select("email, role, is_active")
    .eq("user_id", userId)
    .maybeSingle()

  if (adminError || !admin?.is_active || admin.role !== "admin") {
    return null
  }

  return {
    id: userId,
    email: typeof admin.email === "string" ? admin.email : null,
  }
}
