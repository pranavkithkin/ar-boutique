import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { BlogManagerClientView } from "@/features/admin/blog/components/BlogManagerClientView"
import { getAdminBlogPostsAction } from "@/features/admin/blog/actions"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Editorial Journal | AR Boutique Admin",
  description: "Compose, curate, and publish stories, styling guides, and atelier dispatches.",
  robots: { index: false, follow: false },
}

export default async function AdminBlogPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")

  const posts = await getAdminBlogPostsAction()

  return (
    <AppShell>
      <BlogManagerClientView initialPosts={posts} />
    </AppShell>
  )
}

