import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { BlogPostForm } from "@/features/admin/blog/components/BlogPostForm"
import { getAdminBlogPostByIdAction } from "@/features/admin/blog/actions"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface EditAdminBlogPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: EditAdminBlogPageProps): Promise<Metadata> {
  const { id } = await params
  const post = await getAdminBlogPostByIdAction(id)

  return {
    title: post ? `Edit: ${post.title} | AR Boutique Admin` : "Edit Article | AR Boutique Admin",
    robots: { index: false, follow: false },
  }
}

export default async function EditAdminBlogPage({ params }: EditAdminBlogPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")

  const { id } = await params
  const post = await getAdminBlogPostByIdAction(id)

  if (!post) {
    notFound()
  }

  return (
    <AppShell>
      <BlogPostForm initialPost={post} />
    </AppShell>
  )
}

