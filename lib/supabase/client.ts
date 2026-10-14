import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xoqdwqkftmlffiugxuzy.supabase.co"
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_hhz1lQcw1rSrl7V7s6WkGA_njrOxzBH"

  return createBrowserClient(supabaseUrl, supabaseKey)
}
