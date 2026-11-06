import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { BlogPostForm } from "@/features/admin/blog/components/BlogPostForm"

export const metadata: Metadata = {
  title: "New Article | AR Boutique Admin",
  description: "Compose a new luxury editorial article for the AR Boutique journal.",
  robots: { index: false, follow: false },
}

export default async function NewAdminBlogPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")

  return (
    <AppShell>
      <BlogPostForm />
    </AppShell>
  )
}

