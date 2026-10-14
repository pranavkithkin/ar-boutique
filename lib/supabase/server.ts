import "server-only"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xoqdwqkftmlffiugxuzy.supabase.co"
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_hhz1lQcw1rSrl7V7s6WkGA_njrOxzBH"

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}

export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xoqdwqkftmlffiugxuzy.supabase.co"
  const serviceKey = process.env.SUPABASE_SECRET_KEY

  if (!serviceKey) {
    throw new Error("SUPABASE_SECRET_KEY is not defined")
  }

  return createServerClient(supabaseUrl, serviceKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })
}
